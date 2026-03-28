import mongoose from "mongoose";
import { body, param, query, validationResult } from "express-validator";

async function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

export const createComplaintRules = [
  body("title").trim().notEmpty().isLength({ max: 200 }).withMessage("title is required (max 200 chars)"),
  body("description")
    .trim()
    .notEmpty()
    .isLength({ max: 8000 })
    .withMessage("description is required (max 8000 chars)"),
  body("category")
    .optional()
    .isIn(["room", "service", "facility", "other"])
    .withMessage("Invalid category"),
  body("attachmentUrls")
    .optional()
    .isArray()
    .withMessage("attachmentUrls must be an array"),
  body("attachmentUrls.*")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2048 })
    .withMessage("Each attachment URL must be a string"),
  validate,
];

export const mongoIdParam = [
  param("id").isMongoId().withMessage("Invalid id"),
  validate,
];

export const listComplaintsQuery = [
  query("status")
    .optional()
    .isIn(["pending", "in_progress", "resolved", "rejected", "all"])
    .withMessage("Invalid status filter"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
  validate,
];

export const staffActionRules = [
  param("id").isMongoId().withMessage("Invalid complaint id"),
  body("status")
    .optional()
    .isIn(["pending", "in_progress", "resolved", "rejected"])
    .withMessage("Invalid status"),
  body("staffNote").optional().trim().isLength({ max: 4000 }),
  body().custom((_, { req }) => {
    const hasStatus = req.body?.status != null && req.body?.status !== "";
    const hasNote =
      req.body?.staffNote != null && String(req.body.staffNote).trim() !== "";
    if (!hasStatus && !hasNote) {
      throw new Error("Provide at least one of status or staffNote");
    }
    return true;
  }),
  validate,
];

export function isValidObjectId(value) {
  return mongoose.isValidObjectId(String(value));
}
