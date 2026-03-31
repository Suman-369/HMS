import express from "express";
import * as controller from "../controller/student.complaint.controller.js";
import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";
import { ensureAuthUser } from "../middlewares/ensureAuthUser.middleware.js";
import {
  createComplaintRules,
  mongoIdParam,
} from "../middlewares/validation.middleware.js";

const router = express.Router();

router.use(authenticate, ensureAuthUser);

router.post(
  "/complaints",
  requireRoles("student"),
  createComplaintRules,
  controller.createComplaint,
);
router.get("/complaints", requireRoles("student"), controller.listMyComplaints);
router.get(
  "/complaints/:id",
  requireRoles("student"),
  mongoIdParam,
  controller.getMyComplaintById,
);

router.delete(
  "/complaints/:id",
  requireRoles("student"),
  mongoIdParam,
  controller.deleteOwnComplaint,
);

export default router;
