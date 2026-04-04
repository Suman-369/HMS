import mongoose from "mongoose";
import config from "../config/config.js";
import '../models/task.model.js';
import '../models/user.model.js';

async function ConnectDB() {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("MongoDB connected successfully");
    
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
}

export default ConnectDB;
