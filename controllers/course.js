import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import { AwsConfig } from "../utils/constants";
import Course from "../models/course";
import slugify from "slugify";
import { readFileSync } from "fs";

const S3 = new AWS.S3(AwsConfig);

export const uploadImage = async (req, res) => {
    try {
        // console.log(req.body);
        const { image } = req.body;
        if (!image) return res.status(400).send("No image.");

        // image data
        const base64Data = new Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), "base64"); // remove metadata
        // image extension  -- jpeg
        const type = image.split(";")[0].split("/")[1];
        // image params
        const params = {
            Bucket: process.env.S3_BUCKET,
            Key: `${nanoid()}.${type}`,    // -- sdafef123.jpeg
            Body: base64Data,
            ACL: "public-read",
            ContentEncoding: "base64",
            ContentType: `image/${type}`,
        }

        // upload to s3
        S3.upload(params, (err, data) => {
            if (err) {
                console.log(err);
                return res.status(400).send("S3 upload error. Try again.");
            }
            console.log(data);
            res.send(data);
        });

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const removeImage = async (req, res) => {
    try {
        // console.log(req.body);
        const { image } = req.body;
        if (!image) return res.status(400).send("No image.");
        const params = {
            Bucket: image.Bucket,
            Key: image.Key,
        };

        S3.deleteObject(params, (err, data) => {
            if (err) {
                console.log(err);
                return res.status(400).send("S3 delete error. Try again.");
            }
            res.send({ ok: true });
        });

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const createCourse = async (req, res) => {
    try {
        // check duplicate name
        const exist = await Course.findOne({
            slug: slugify(req.body.name.toLowerCase()),
        });
        if (exist) return res.status(400).send("Course Name is taken. Try another name");

        //
        const course = await new Course({
            slug: slugify(req.body.name),
            instructor: req.user._id,
            ...req.body,
        }).save();

        res.send({ course });

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const updateCourse = async (req, res) => {
    try {
        const {slug} = req.params;
        const course = await Course.findOne({slug}).exec();
        if(!course) return res.status(400).send("Course not found.");
        if (req.user._id != course.instructor) {
            console.log("USER ID: ", req.user._id);
            console.log("INSTRUCTOR ID: ", course.instructor);
            return res.status(400).send("Unauthorized. You cannot update this course.");
        }

        const updated = await Course.findOneAndUpdate({slug}, req.body, {new: true}).exec();
        res.json(updated);

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const readBySlug = async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug }).populate("instructor", "_id name").exec();
        res.send({ course });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const readById = async (req, res) => {
    try {
        // console.log("read by id: ",req.params);
        const course = await Course.findOne({ _id: req.params.courseId.trim() }).populate("instructor", "_id name").exec();
        if (!course) return res.status(400).send("Course not found.");
        res.send({ course });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const uploadMedia = async (req, res) => {
    try {
        if (req.user._id != req.params.instructorId) {
            console.log("USER ID: ", req.user._id);
            console.log("INSTRUCTOR ID: ", req.params.instructorId);
            return res.status(400).send("Unauthorized. You cannot upload for this course.");
        }
        // media: {type: file}  -- {doc: {file props}}
        const media = req.files;
        const type = Object.keys(media)[0];
        if (!media || !type || (type !== "doc" && type !== "video")) {
            console.log("TYPE: ", type);
            return res.status(400).send("No media.");
        }
        const file = media[type];

        const params = {
            Bucket: process.env.S3_BUCKET,
            Key: `${nanoid()}.${file.type.split("/")[1]}`,  // -- adcfv.pdf || wdef.mp4
            Body: readFileSync(file.path),
            ACL: "public-read",
            ContentType: file.type,
        };
        // console.log("PARAMS: ", params);

        S3.upload(params, (err, data) => {
            if (err) {
                console.log(err);
                return res.status(400).send("S3 Upload Error. Try again.");
            }
            res.send(data);
        });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
};

export const removeMedia = async (req, res) => {
    try {
        if (req.user._id != req.params.instructorId) {
            console.log("USER ID: ", req.user._id);
            console.log("INSTRUCTOR ID: ", req.params.instructorId);
            return res.status(400).send("Unauthorized. You cannot remove contents on this course.");
        }

        const media = req.body;
        if (!media) return res.status(400).send("No media.");
        const params = {
            Bucket: media.Bucket,
            Key: media.Key,  // -- adcfv.pdf || wdef.mp4\
        };
        // console.log("PARAMS: ", params);

        S3.deleteObject(params, (err, data) => {
            if (err) {
                console.log(err);
                return res.status(400).send("S3 Remove Error. Try again.");
            }
            res.send({ ok: true });
        });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const addLessonByCourseSLug = async (req, res) => {
    try {
        // check duplicate name
        const { slug, instructorId } = req.params;
        const { title, content, media } = req.body;
        if (req.user._id != instructorId) {
            console.log("USER ID: ", req.user._id);
            console.log("INSTRUCTOR ID: ", instructorId);
            return res.status(400).send("Unauthorized. You cannot add contents on this course.");
        }

        const updated = await Course.findOneAndUpdate(
            { slug },
            {   $push: { lessons: { 
                            title, 
                            content, 
                            media,
                            slug: slugify(title) 
                        }}},
            { new: true }
        ).populate("instructor", "_id name").exec();
        res.send(updated);

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

