import express from "express";
import { removeImage, uploadImage } from "../controllers/course";
import { requireSignin } from "../middlewares";

const router = express.Router();


router.post("/course/upload-image", uploadImage);
router.post("/course/remove-image", removeImage);

module.exports = router;