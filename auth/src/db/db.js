import mongoose from "mongoose";
import config from "../config/config.js";

async function ConnectDB() {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("Connect to DB");
    
  } catch (error) {
    console.log("Error in DB", error);
  }
}

export default ConnectDB;
