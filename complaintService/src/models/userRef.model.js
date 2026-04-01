import mongoose from "mongoose";
import config from "../config/config.js";

const userRefSchema = new mongoose.Schema(
  {
    email: { type: String },
    fullname: {
      firstName: { type: String },
      lastName: { type: String },
    },
    role: { type: String },
  },
  {
    collection: "users",
    strict: false,
  },
);

/**
 * @returns {import('mongoose').Model}
 */
export function getAuthUserModel() {
  const authDb = mongoose.connection.useDb(config.AUTH_DB_NAME, {
    useCache: true,
  });
  return authDb.models.user || authDb.model("user", userRefSchema);
}

export function formatStudentRef(doc) {
  if (!doc) return null;
  if (typeof doc === "object" && doc._id) {
    return {
      id: String(doc._id),
      email: doc.email,
      fullname: doc.fullname,
      role: doc.role,
    };
  }
  return { id: String(doc) };
}
