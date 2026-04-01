import mongoose from "mongoose";
import { body, param, query, validationResult } from "express-validator";

async function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

export const createRoomRules = [
  body("roomNumber").trim().notEmpty().withMessage("roomNumber is required"),
  body("capacity").isInt({ min: 1 }).withMessage("capacity must be a positive integer"),
  body("block").optional().trim(),
  body("floor").optional().trim(),
  body("description").optional().trim(),
  body("amenities").optional().isArray(),
  body("images").optional().isArray(),
  body("status")
    .optional()
    .isIn(["available", "full", "maintenance"])
    .withMessage("Invalid status"),
  body("occupants").optional().isArray().withMessage("occupants must be an array"),
  body("occupants").custom((arr, { req }) => {
    if (arr == null || (Array.isArray(arr) && arr.length === 0)) return true;
    if (!Array.isArray(arr)) throw new Error("occupants must be an array");
    const cap = Number.parseInt(String(req.body.capacity), 10);
    if (!Number.isFinite(cap) || cap < 1) return true;
    if (arr.length > cap) {
      throw new Error("occupants cannot be more than capacity");
    }
    const seen = new Set();
    for (const o of arr) {
      const id = o?.userId;
      if (id == null || id === "") {
        throw new Error("each occupant must have userId");
      }
      if (!mongoose.isValidObjectId(String(id))) {
        throw new Error(`invalid occupant userId: ${id}`);
      }
      const key = String(id);
      if (seen.has(key)) {
        throw new Error("duplicate userId in occupants");
      }
      seen.add(key);
    }
    return true;
  }),
  validate,
];

export const updateRoomRules = [
  param("id").isMongoId().withMessage("Invalid room id"),
  body("roomNumber").optional().trim().notEmpty(),
  body("capacity").optional().isInt({ min: 1 }),
  body("block").optional().trim(),
  body("floor").optional().trim(),
  body("description").optional().trim(),
  body("amenities").optional().isArray(),
  body("images").optional().isArray(),
  body("status")
    .optional()
    .isIn(["available", "full", "maintenance"])
    .withMessage("Invalid status"),
  validate,
];

export const mongoIdParam = [
  param("id").isMongoId().withMessage("Invalid id"),
  validate,
];

export const applyForRoomRules = [
  body("roomId").isMongoId().withMessage("Invalid roomId"),
  body("message").optional().trim().isLength({ max: 2000 }),
  validate,
];

export const createNoticeRules = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 200 }),
  body("type")
    .trim()
    .notEmpty()
    .withMessage("Type is required")
    .isIn(["general", "event", "maintenance", "academic"])
    .withMessage("Type must be general, event, maintenance, or academic"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 2000 })
    .withMessage("Description must be under 2000 chars"),
  body("relevancePercentage")
    .isFloat({ min: 0, max: 100 })
    .withMessage("relevancePercentage must be between 0 and 100"),
  validate,
];

export const listApplicationsQuery = [
  query("status")
    .optional()
    .isIn(["pending", "approved", "rejected", "cancelled", "all"])
    .withMessage("Invalid status filter"),
  validate,
];

export const applicationDecisionRules = [
  param("id").isMongoId().withMessage("Invalid application id"),
  body("decision")
    .isIn(["approved", "rejected"])
    .withMessage("decision must be approved or rejected"),
  body("staffNote").optional().trim(),
  validate,
];
