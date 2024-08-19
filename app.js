import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoute from "./routes/userRoute.js"; // Note the .js extension
import tweetRoute from "./routes/tweetRoute.js"; // Note the .js extension
import db from "./config/database.js"; // Note the .js extension
const app = express();
dotenv.config();

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Routes
app.use("/user", userRoute);
app.use("/tweet", tweetRoute);

// Database connection
db();

// Start server
app.listen(3000, () => {
  console.log(`Server running on port ${PORT}`);
});