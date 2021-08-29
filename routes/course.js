import express from "express";
import { create, readById, readBySlug, removeImage, uploadImage } from "../controllers/course";
import { isInstructor, requireSignin } from "../middlewares";

const router = express.Router();

// process image
router.post("/course/upload-image", uploadImage);
router.post("/course/remove-image", removeImage);

// process course
router.post("/course", requireSignin, isInstructor, create);
router.get("/course/:slug", readBySlug);
router.get("/course/id/:_id", readById);

module.exports = router;