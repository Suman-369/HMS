import jwt from "jsonwebtoken";
import config from "../config/config.js";

export function authenticate(req, res, next) {
  if (!config.JWT_SECRET) {
    return res.status(500).json({
      message: "Server misconfiguration: JWT_SECRET is not set",
    });
  }

  let token = req.cookies?.token;
  const authHeader = req.headers.authorization;
  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.user = {
      id: String(payload.id),
      role: payload.role,
      fullname: payload.fullname,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRoles(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden",
        requiredRoles: allowed,
        yourRole: req.user.role ?? null,
      });
    }
    next();
  };
}
