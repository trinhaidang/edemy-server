import expressJwt from 'express-jwt';
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
        return res.status(400).send("Error. Try again.");
    }
}