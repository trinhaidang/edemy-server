import express from "express";
import { currentInstructor, getAccountStatus, instructorCourses, makeInstructor } from "../controllers/instructor";
import { requireSignin } from "../middlewares";

const router = express.Router();


router.post("/make-instructor", requireSignin, makeInstructor);
router.post("/get-account-status", requireSignin, getAccountStatus);
router.get("/current-instructor", requireSignin, currentInstructor);
router.get("/instructor-courses", requireSignin, instructorCourses);

module.exports = router;