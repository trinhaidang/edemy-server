import expressJwt from 'express-jwt';
import Course from '../models/course';
import User from "../models/user"
import { RoleEnum } from '../utils/constants';

export const requireSignin = expressJwt({
    getToken: (req, res) => req.cookies.token,
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
});  // -> req.user._id

export const isInstructor = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).exec();
        if (!user) return res.status(400).send("User not found.");
        if(!user.role.includes(RoleEnum.INSTRUCTOR)) {
            return res.status(403).send("Unauthorized. Not an instructor.");
        } 
        next();
    } catch (err) {
        console.log(err);
        return res.status(400).send("Middleware Error. Try again.");
    }
}

export const isEnrolled = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).exec();
        if (!user) return res.status(400).send("User not found.");
        const course = await Course.findOne({ slug: req.params.slug }).exec();

        // check if course id in user.courses
        let ids = [];
        for (let i=0; i<user.courses.length; i++) {
            ids.push(user.courses[i].toString());
        }
        if(!ids.includes(course._id.toString())) {
            res.status(403).send("Unauthorized. Course not enrolled");
        } else {
            next();
        }

    } catch (err) {
        console.log(err);
        return res.status(400).send("Middleware Error. Try again.");
    }
}