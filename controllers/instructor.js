import User from "../models/user"
import queryString from "query-string";
import { RoleEnum } from "../utils/constants";
import { nanoid } from "nanoid";
// npm i stripe
// const stripe = require("stripe")(process.env.STRIPE_SECRET);

export const makeInstructor = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).exec();
        if (!user) return res.status(400).send("User not found.");
        if (!user.stripe_account_id) {
            const account = { id: nanoid(20) };
            user.stripe_account_id = account.id;
            user.save();
        }
        const accountLink = { url: process.env.STRIPE_REDIRECT_URL };
        res.send(accountLink.url);
    } catch (err) {
        console.log("stripe error", err);
        return res.status(400).send("Error. Try again.");
    }
}

export const getAccountStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).exec();
        if (!user) return res.status(400).send("User not found.");
        // fake stripe account
        const account = {
            id: user.stripe_account_id,
            charges_enabled: true
        };
        if (!account.charges_enabled) {
            return res.status(401).send("Unauthorized. Account cannot charge");
        } else {
            const statusUpdated = await User.findByIdAndUpdate(
                user._id,
                {
                    stripe_seller: account,
                    $addToSet: { role: RoleEnum.INSTRUCTOR }
                },
                { new: true }
            ).select('-password').exec();
            res.json(statusUpdated);
        }
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const currentInstructor = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').exec();
        if (!user) return res.status(400).send("Instructor not found.");
        if(!user.role.includes(RoleEnum.INSTRUCTOR)) {
            return res.status(403).send("Unauthorized. Not an instructor.");
        } 
        console.log("CURRENT INSTRUCTOR", user);
        return res.json({ ok: true });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}



// real

const makeInstructor2 = async (req, res) => {
    try {
        // 1. find user from Db 
        const user = await User.findById(req.user._id).exec();
        // 2. if user does not have stripe_account_id then create new
        if (!user.stripe_account_id) {
            let account = await stripe.accounts.create({ type: "express" });
            // console.log('ACCOUNT => ', account.id);
            user.stripe_account_id = account.id;
            user.save();
        }
        // 3. create account link based on account id (for frontend to complete onboarding)
        let accountLink = await stripe.accountLinks.create({
            account: user.stripe_account_id,
            refresh_url: process.env.STRIPE_REDIRECT_URL,
            return_url: process.env.STRIPE_REDIRECT_URL,
            type: "account_onboarding",
        });
        // 4. pre-fill any info such as email (optional)
        accountLink = Object.assign(accountLink, {
            "stripe_user[email]": user.email,
        });
        // 5. send account link as response to frontend
        res.send(`${accountLink.url}?${queryString.stringify(accountLink)}`);
    } catch (err) {
        console.log("stripe error");
        return res.status(400).send("Error. Try again.");
    }
}

const getAccountStatus2 = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).exec();
        if (!user) return res.status(400).send("User not found.");
        const account = await stripe.accounts.retrieve(user.stripe_account_id);
        console.log("STRIPE ACCOUNT: ", account);
        if (!account.charges_enabled) {
            return res.status(401).send("Unauthorized. Account cannot charge");
        } else {
            const statusUpdated = await User.findByIdAndUpdate(
                user._id,
                {
                    stripe_seller: account,
                    $addToSet: { role: RoleEnum.INSTRUCTOR }
                },
                { new: true }
            ).exec();
            res.json(statusUpdated);
        }
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}