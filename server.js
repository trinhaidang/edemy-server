import express from "express";
import cors from "cors";
import { readdirSync } from "fs";
import mongoose from "mongoose";
import csrf from "csurf";
import cookieParser from "cookie-parser";
const morgan = require("morgan");
require("dotenv").config();

const csrfProtection = csrf({ cookie: true });

// create express app
const app = express();

// db
mongoose.connect(process.env.DATABASE, {
    // userNewUrlParser: true,
    // useFindAndModify: false,
    // useUnifiedTopology: true,
    // useCreateIndex: true,
})
    .then(() => console.log("**DB CONNECTED**"))
    .catch((err) => console.log("DB CONNECTION ERR => ", err));

// use: apply middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// we need this because "cookie" is true in csrfProtection
app.use(cookieParser());

// route fs.readdirSync map to routes
readdirSync('./routes').map(
    (r) => app.use("/api", require(`./routes/${r}`))
);

// put after route
app.use(csrfProtection);

app.get("/api/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// port
const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
