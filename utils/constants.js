export const RoleEnum = {
    INSTRUCTOR: "Instructor",
    SUBSCRIBER: "Subscriber",
    ADMIN: "Admin"
};

export const AwsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    apiVersion: process.env.AWS_API_VERSION,
}

export const DEFAULT_PRICE = 19;
export const DEFAULT_CURRENCY = "VND";
