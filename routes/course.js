import express from "express";
import { createCourse, getAllPublishedCourses, publishCourse, readById, readBySlug, removeImage, unpublishCourse, updateCourse, uploadImage } from "../controllers/course";
import { isInstructor, requireSignin } from "../middlewares";
import formidable from "express-formidable";
import { addLessonByCourseSLug, removeLesson, removeMedia, updateLessonByCourseSLug, uploadMedia } from "../controllers/lesson";

const router = express.Router();

router.get("/courses", getAllPublishedCourses);

// process image
router.post("/course/upload-image", uploadImage);
router.post("/course/remove-image", removeImage);

// process course
router.post("/course", requireSignin, isInstructor, createCourse);
router.put("/course/:slug", requireSignin, updateCourse);
router.get("/course/:slug", readBySlug);
router.get("/course/id/:courseId", readById);
router.put("/course/publish/:courseId", requireSignin, publishCourse);
router.put("/course/unpublish/:courseId", requireSignin, unpublishCourse);

// process lesson
router.post("/course/upload-media/:instructorId", requireSignin, formidable(), uploadMedia);
router.post("/course/remove-media/:instructorId", requireSignin, removeMedia);
router.post("/course/lesson/:slug/:instructorId", requireSignin, addLessonByCourseSLug);
router.put("/course/lesson/:slug/:instructorId", requireSignin, updateLessonByCourseSLug);

router.delete("/course/:slug/:lessonId", requireSignin, removeLesson);    // remove lesson 

module.exports = router;