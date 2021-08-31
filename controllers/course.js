import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import { AwsConfig } from "../utils/constants";
import Course from "../models/course";
import slugify from "slugify";
// import { readFileSync } from "fs";

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
        const { slug } = req.params;
        const course = await Course.findOne({ slug }).exec();
        if (!course) return res.status(400).send("Course not found.");
        if (req.user._id != course.instructor) {
            console.log("USER ID: ", req.user._id);
            console.log("INSTRUCTOR ID: ", course.instructor);
            return res.status(400).send("Unauthorized. You cannot update this course.");
        }

        const updated = await Course.findOneAndUpdate({ slug }, req.body, { new: true }).exec();
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
