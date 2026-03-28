import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const _config = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  /** Database name where auth `user` documents live; set to verify callers still exist. */
  AUTH_DB_NAME: process.env.AUTH_DB_NAME,
};

export default _config;
