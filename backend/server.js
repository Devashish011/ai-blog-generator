
import express from "express";

import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import blogRoutes from "./routes/blogRoutes.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: "1mb" }));

// Routes
app.use("/api", blogRoutes);

// Health check
app.get("/", (req, res) => res.send("AI Blog Generator Backend is running..."));

// Start: connect DB then listen
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Startup error:", err.message);
    process.exit(1);
  }
};

start();
