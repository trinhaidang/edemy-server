import mongoose from "mongoose";
import { DEFAULT_CURRENCY, DEFAULT_PRICE } from "../utils/constants";


const {ObjectId} = mongoose.Schema;

const lessonSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            minlength: 3,
            maxlength: 320,
            required: true,
        },
        slug: {
            type: String,
            lowercase: true,
        },
        content: {
            type: {},
            minlength: 200,
        },
        media: {},
        free_preview: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true, }
);

const courseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            minlength: 3,
            maxlength: 320,
            required: true,
        },
        slug: {
            type: String,
            lowercase: true,
        },
        description: {
            type: {},
            minlength: 200,
            required: true,
        },
        price: {
            type: Number,
            default: DEFAULT_PRICE,
        },
        currency: {
            type: String,
            default: DEFAULT_CURRENCY,
        },
        image: {},
        category: String,
        published: {
            type: Boolean,
            default: false,
        },
        paid: {
            type: Boolean,
            default: true,
        },
        instructor: {
            type: ObjectId,
            ref: "User",
            required: true,
        },
        lessons: [lessonSchema]
    },
    { timestamps: true, }
);

export default mongoose.model("Course", courseSchema);