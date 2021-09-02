import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import { APP_FEE, AwsConfig } from "../utils/constants";
import Course from "../models/course";
import slugify from "slugify";
import User from "../models/user";
import course from "../models/course";
// import { readFileSync } from "fs";
// const stripe = require("stripe")(process.env.STRIPE_SECRET);

const S3 = new AWS.S3(AwsConfig);

export const getAllPublishedCourses = async (req, res) => {
    try {
        const all = await Course.find({ published: true })
            .populate("instructor", "_id name")
            .exec();
        res.json(all);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

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
        if (!course) return res.status(400).send("Course not found. Cannot update");
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
        if (!course) return res.status(400).send("Course not found. Cannot view by Id");
        res.send({ course });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const publishCourse = async (req, res) => {
    try {
        // console.log("publishCourse: ", req.params);
        const courseId = req.params.courseId.trim();
        console.log(courseId);
        const course = await Course.findOne({ _id: courseId }).select("instructor").exec();
        if (!course) return res.status(400).send("Course not found. Cannot publish");
        if (req.user._id != course.instructor) {
            console.log("USER ID: ", req.user._id);
            console.log("INSTRUCTOR ID: ", course.instructor);
            return res.status(400).send("Unauthorized. You cannot publish this course.");
        }

        const updated = await Course.findByIdAndUpdate(courseId, { published: true }, { new: true }).exec();
        res.json(updated);

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const unpublishCourse = async (req, res) => {
    try {
        // console.log("unpublishCourse: ", req.params);
        const courseId = req.params.courseId.trim();
        const course = await Course.findOne({ courseId }).select("instructor").exec();
        if (!course) return res.status(400).send("Course not found. Cannot unpublish");
        if (req.user._id != course.instructor) {
            console.log("USER ID: ", req.user._id);
            console.log("INSTRUCTOR ID: ", course.instructor);
            return res.status(400).send("Unauthorized. You cannot unpublish this course.");
        }

        const updated = await Course.findByIdAndUpdate(courseId, { published: false }, { new: true }).exec();
        res.json(updated);

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const checkEnrollment = async (req, res) => {
    try {
        const { courseId } = req.params;
        const user = await User.findById(req.user._id).exec();
        let ids = [];
        let length = user.courses && user.courses.length;
        for (let i = 0; i < length; i++) {
            ids.push(user.courses[i].toString());
        }
        res.json({
            status: ids.includes(courseId),
            course: await Course.findById(courseId).exec()
        });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const freeEnrollment = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findById(courseId).exec();
        if (!course) return res.status(400).send("Course not found. Cannot freeEnrollment");
        if (course.paid) return res.status(400).send("This is a paid course. Cannot enroll.");

        const result = await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { courses: course._id }
        }, { new: true }).exec();
        res.json({
            messsage: "Congratulations! You have successfully enrolled.",
            course,
        });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const paidEnrollment = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findById(courseId).populate("instructor").exec();
        if (!course) return res.status(400).send("Course not found. Cannot paidEnrollment");
        if (!course.paid) return res.status(400).send("This is a free course. Cannot enroll.");
        // application fee 30%
        const fee = course.price * APP_FEE;
        // const session = await stripe.checkout.sessions.create({
        //     payment_method_types: ["card"],
        //     // purchase details
        //     line_items: [{
        //         name: course.name,
        //         amount: Math.round(course.price.toFixed(2)*100),
        //         currency: course.currency,
        //         quantity: 1
        //     }],
        //     // charge buyer and transfer to seller (after conducting fee)
        //     payment_intent_data: {
        //         application_fee_amount: Math.round(fee.toFixed(2)*100),
        //         transfer_data: {
        //             destination: course.instructor.stripe_account_id
        //         }
        //     },
        //     success_url: `${process.env.STRIPE_SUCCESS_URL}/${course._id}`,
        //     cancel_url: process.env.STRIPE_CANCEL_URL
        // });
        const session = {
            id: nanoid(),
            payment_method_types: ["card"],
            payment_status: "unpaid",
            // purchase details
            line_items: [{
                name: course.name,
                // amount: course.price.toFixed(2)*100),
                amount: course.price,
                currency: course.currency,
                quantity: 1
            }],
            // charge buyer and transfer to seller (after conducting fee)
            payment_intent_data: {
                // application_fee_amount: Math.round(fee.toFixed(2)*100),
                application_fee_amount: fee,
                transfer_data: {
                    destination: course.instructor.stripe_account_id
                }
            },
            success_url: `${process.env.STRIPE_SUCCESS_URL}/${course._id}`,
            cancel_url: process.env.STRIPE_CANCEL_URL
        };
        console.log("SESSION: ", session);

        await User.findByIdAndUpdate(req.user._id, {stripeSession: session}).exec();
        // res.send(session.id);
        res.send(session.success_url);

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const stripeSuccess = async (req, res) => {
    try {
        console.log("stripeSuccess -----",req.params);
        const course = await Course.findById(req.params.courseId.trim()).exec();
        if (!course) return res.status(400).send("Course not found. Cannot view by Id");

        const user = await User.findById(req.user._id).exec();
        if(!user.stripeSession.id) return res.status(400).send("Course not enrolled. Cannot process stripeSuccess");
        // const session = await stripe.checkout.sessions.retrieve(user.stripeSession.id);
        console.log("STRIPE SUCCESS: ", course);
        const session = {
            payment_status: "paid"
        };
        if(session.payment_status === "paid") {
            await User.findByIdAndUpdate(user._id, {
                $addToSet: { courses: course._id },
                $set: { stripeSession: {} }
            }).exec();
        }
        res.json({ok: true, course});
    } catch (err) { 
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}