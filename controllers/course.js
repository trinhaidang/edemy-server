import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import { AwsConfig } from "../utils/constants";

const S3 = new AWS.S3(AwsConfig);

export const uploadImage = async (req, res) => {
    try {
        // console.log(req.body);
        const { image } = req.body;
        if (!image) return res.status(400).send("No image.");

        // image data
        const base64Data = new Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), "base64"); // remove metadata
        // image extension  -- jpeg
        const type = image.split(";")[0].split("/")[1];
        // image params
        const params = {
            Bucket: process.env.S3_BUCKET,
            Key: `${nanoid()}.${type}`,    // -- sdafef123.jpeg
            Body: base64Data,
            ContentEncoding: "base64",
            ContentType: `image/${type}`,
        }

        // upload to s3
        S3.upload(params, (err, data) => {
            if (err) {
                console.log(err);
                return res.status(400).send("S3 upload error. Try again.");
            }
            console.log(data);
            res.send(data);
        });

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}

export const removeImage = async (req, res) => {
    try {
        // console.log(req.body);
        const { image } = req.body;
        if (!image) return res.status(400).send("No image.");
        const params = {
            Bucket: image.Bucket,
            Key: image.Key,
        };

        S3.deleteObject(params, (err, data) => {
            if (err) {
                console.log(err);
                return res.status(400).send("S3 delete error. Try again.");
            }
            res.send({ ok: true });
        });

    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
}