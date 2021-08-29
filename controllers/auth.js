import User from "../models/user";
import { comparePassword, hashPassword } from "../utils/auth";
import jwt from "jsonwebtoken";
import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import { AwsConfig } from "../utils/constants";

const SES = new AWS.SES(AwsConfig);

export const register = async (req, res) => {
    try {
        // console.log(req.body);
        const { name, email, password } = req.body;

        // validation
        if (!name) return res.status(400).send("Name is required.");
        if (!password || password.length < 6) {
            return res.status(400).send("Password is required and should contain at least 6 characters");
        }
        let userExist = await User.findOne({ email }).exec();
        if (userExist) return res.status(400).send("Email is taken.");

        // hash password
        const hashedPassword = await hashPassword(password);

        // register
        const user = new User({
            name,
            email,
            password: hashedPassword,
        });
        await user.save();
        // console.log("saved user: ", user);
        return res.json({ ok: true });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const login = async (req, res) => {
    try {
        // console.log(req.body);
        const { email, password } = req.body;

        // validation
        const user = await User.findOne({ email }).exec();
        if (!user) return res.status(400).send("User not found.");

        // check password
        const match = await comparePassword(password, user.password);
        if (!match) return res.status(400).send("Wrong password. Try again.");

        // create token
        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // exclude hashed password
        user.password = undefined;

        // send token in cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,  // only works on https
        });

        return res.json(user);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie("token");
        return res.json({ message: "Sign out successfully." })
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const currentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').exec();
        if (!user) return res.status(400).send("User not found.");
        console.log("CURRENT_USER", user);
        return res.json({ ok: true });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const sendTestEmail = async (req, res) => {
    try {
        // console.log("send email using SES");
        // return res.json({ok: true});
        const params = {
            Source: process.env.EMAIL_FROM,
            Destination: {
                ToAddresses: ['quangdangvan65@gmail.com'],   // ses verified email
            },
            ReplyToAddresses: [process.env.EMAIL_FROM],
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: `
                            <html>
                                <h1>Reset password link</h1>
                                <p>Please use the following link to reset your password</p>
                            </html>
                        `,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "Password reset link"
                },
            },
        };
        const emailSent = SES.sendEmail(params).promise();
        emailSent.then((data) => {
            console.log(data);
            return res.json({ ok: true });
        })
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const shortCode = nanoid(6).toUpperCase();

        // update user code
        const user = await User.findOneAndUpdate(
            { email },
            { passwordResetCode: shortCode }
        );
        if(!user) return res.status(400).send("Email not found. Try again.");

        // send email
        const params = {
            Source: process.env.EMAIL_FROM,
            Destination: {
                ToAddresses: [email],   // ses verified email
            },
            ReplyToAddresses: [process.env.EMAIL_FROM],
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: `
                            <html>
                                <h1>Reset password link</h1>
                                <p>Please use this code to reset your password</p>
                                <h2 style="color:red;">${shortCode}</h2>
                                <i>vietcourse.com</i>
                            </html>
                        `,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "Vietcourse Password reset"
                },
            },
        };
        const emailSent = SES.sendEmail(params).promise();
        emailSent.then((data) => {
            console.log(data);
            return res.json({ ok: true });
        }).catch((err) => {
            console.log(err);
            return res.status(400).send("Send code failed. Try again.");
        })
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        // console.table({email, code, newPassword});

        // validation
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).send("Password is required and should contain at least 6 characters");
        }
        
        // hash password
        const hashedPassword = await hashPassword(newPassword);
        const user = await User.findOneAndUpdate(
            { email, passwordResetCode: code },
            { password: hashedPassword, passwordResetCode: ''}
        ).exec();
        if (!user) return res.status(400).send("User not found or Wrong Secret Code.");

        console.log("update password to user: ", user);
        return res.json({ ok: true });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}