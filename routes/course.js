import express from "express";
import { checkEnrollment, createCourse, freeEnrollment, getAllPublishedCourses, getAllUserCourses, listCompleted, markCompleted, markIncompleted, paidEnrollment, publishCourse, readById, readBySlug, removeImage, stripeSuccess, unpublishCourse, updateCourse, uploadImage } from "../controllers/course";
import { isEnrolled, isInstructor, requireSignin } from "../middlewares";
import formidable from "express-formidable";
import { addLessonByCourseSLug, removeLesson, removeMedia, updateLessonByCourseSLug, uploadMedia } from "../controllers/lesson";

const router = express.Router();

router.get("/courses", getAllPublishedCourses);

// user
router.get("/user-courses", requireSignin, getAllUserCourses);
router.get("/user/course/:slug", requireSignin, isEnrolled, readBySlug);

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

router.get("/check-enrollment/:courseId", requireSignin, checkEnrollment);
router.post("/free-enrollment/:courseId", requireSignin, freeEnrollment);
router.post("/paid-enrollment/:courseId", requireSignin, paidEnrollment);
router.post("/stripe-success/:courseId", requireSignin, stripeSuccess);

// process lesson
router.post("/course/upload-media/:instructorId", requireSignin, formidable(), uploadMedia);
router.post("/course/remove-media/:instructorId", requireSignin, removeMedia);
router.post("/course/lesson/:slug/:instructorId", requireSignin, addLessonByCourseSLug);
router.put("/course/lesson/:slug/:instructorId", requireSignin, updateLessonByCourseSLug);

router.delete("/course/:slug/:lessonId", requireSignin, removeLesson);    // remove lesson 

// completed
router.post("/mark-completed", requireSignin, markCompleted);
router.post("/mark-incompleted", requireSignin, markIncompleted);
router.post("/list-completed", requireSignin, listCompleted);

module.exports = router;