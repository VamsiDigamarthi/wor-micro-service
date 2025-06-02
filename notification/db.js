// db.js
import mongoose from "mongoose";
import logger from "./utils/logger.js";

export const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    logger.info("✅ Connected to MongoDB");
  } catch (err) {
    logger.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1); // Exit if DB connection fails
  }
};
