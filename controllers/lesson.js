import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import { AwsConfig } from "../utils/constants";
import Course from "../models/course";
import slugify from "slugify";
import { readFileSync } from "fs";

const S3 = new AWS.S3(AwsConfig);


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
        // console.log(file);

        const params = {
            Bucket: process.env.S3_BUCKET,
            // Key: `${nanoid()+"_"+file.name.split('.')[0].replace(" ","-")}.${file.type.split("/")[1]}`,  // -- adcfv.pdf || wdef.mp4
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
            {
                $push: {
                    lessons: {
                        title,
                        content,
                        media,
                        slug: slugify(title)
                    }
                }
            },
            { new: true }
        ).populate("instructor", "_id name").exec();
        // console.log("LESSON ADDED: ", updated);
        res.send(updated);

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const removeLesson = async (req, res) => {
    try {
        // console.log("remove lesson");
        const { slug, lessonId } = req.params;
        const course = await Course.findOne({ slug }).exec();
        if (!course) return res.status(400).send("Course not found. Cannot remove lesson");
        if (req.user._id != course.instructor) {
            console.log("USER ID: ", req.user._id);
            console.log("INSTRUCTOR ID: ", course.instructor);
            return res.status(400).send("Unauthorized. You cannot update this course.");
        }

        const deletedCourse = await Course.findByIdAndUpdate(course._id, {
            $pull: { lessons: { _id: lessonId } }
        }).exec();

        // remove media
        if (course.media && Object.keys(course.media).length !== 0) {
            const media = course.media;
            const params = {
                Bucket: media.Bucket,
                Key: media.Key,  // -- adcfv.pdf || wdef.mp4\
            };
            S3.deleteObject(params, (err, data) => {
                if (err) {
                    console.log("S3 Remove Error. Try deleting on S3.", media.Key);
                }
            });
        }

        res.json({ ok: true });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const updateLessonByCourseSLug = async (req, res) => {
    try {
        console.log("update lesson");
        const { slug, lessonId } = req.params;
        const course = await Course.findOne({ slug }).select("instructor").exec();
        if (!course) return res.status(400).send("Course not found. Cannot update lesson");
        if (req.user._id != course.instructor._id) {
            console.log("USER ID: ", req.user._id);
            console.log("INSTRUCTOR ID: ", course.instructor._id);
            return res.status(400).send("Unauthorized. You cannot update this course.");
        }

        const { _id, title, content, media, free_preview } = req.body;
        const updated = await Course.updateOne(
            { "lessons._id": _id },
            {
                $set: {
                    "lessons.$.title": title,
                    "lessons.$.content": content,
                    "lessons.$.media": media,
                    "lessons.$.free_preview": free_preview,
                }
            },
            { new: true }
        ).exec();
        console.log("UPDATED: ", updated);
        res.json({ ok: true });

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}