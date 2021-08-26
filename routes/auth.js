import express from "express";
import { register, login, logout, me } from "../controllers/auth";
import { requireSignin } from "../middlewares";

const router = express.Router();


router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/current-user", requireSignin, me);

module.exports = router;