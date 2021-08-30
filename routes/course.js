import express from "express";
import { addLessonByCourseSLug, createCourse, readById, readBySlug, removeImage, removeMedia, uploadImage, uploadMedia } from "../controllers/course";
import { isInstructor, requireSignin } from "../middlewares";
import formidable from "express-formidable";

const router = express.Router();

// process image
router.post("/course/upload-image", uploadImage);
router.post("/course/remove-image", removeImage);

// process course
router.post("/course", requireSignin, isInstructor, createCourse);
router.get("/course/:slug", readBySlug);
router.get("/course/id/:courseId", readById);

// process lesson
router.post("/course/upload-media/:instructorId", requireSignin, formidable(), uploadMedia);
router.post("/course/remove-media/:instructorId", requireSignin, removeMedia);
router.post("/course/lesson/:slug/:instructorId", requireSignin, addLessonByCourseSLug);

module.exports = router;