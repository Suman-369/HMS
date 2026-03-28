import mongoose from "mongoose";
import config from "../config/config.js";

/**
 * Read-only view of auth service users (`users` collection on AUTH_DB_NAME).
 * Used so `Room.occupants.userId` can reference real user documents and populate.
 */
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

export const authOccupantsPopulate = () => ({
  path: "occupants.userId",
  model: getAuthUserModel(),
  select: "email fullname role",
});

export const authStudentPopulate = () => ({
  path: "studentId",
  model: getAuthUserModel(),
  select: "email fullname role",
});

/** Normalized occupant for JSON (works with populated or raw ObjectId `userId`). */
export function formatOccupantEntry(o) {
  const u = o.userId;
  const assignedAt = o.assignedAt;
  if (u && typeof u === "object" && u._id) {
    return {
      assignedAt,
      user: {
        id: String(u._id),
        email: u.email,
        fullname: u.fullname,
        role: u.role,
      },
    };
  }
  return {
    assignedAt,
    user: { id: u != null ? String(u) : null },
  };
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
