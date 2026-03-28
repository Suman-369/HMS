import config from "../config/config.js";
import { getAuthUserModel } from "../models/userRef.model.js";

/**
 * After JWT auth: confirm the user still exists in the auth database and sync role from DB.
 * If `AUTH_DB_NAME` is unset, only JWT verification applies (same pattern as optional cross-db checks).
 */
export async function ensureAuthUser(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!config.AUTH_DB_NAME) {
    return next();
  }

  try {
    const User = getAuthUserModel();
    const doc = await User.findById(req.user.id).select("_id role");
    if (!doc) {
      return res.status(401).json({ message: "User not found or no longer valid" });
    }
    req.user.role = doc.role;
    next();
  } catch (err) {
    next(err);
  }
}
