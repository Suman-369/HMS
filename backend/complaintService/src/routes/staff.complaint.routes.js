import express from "express";
import * as controller from "../controller/staff.complaint.controller.js";
import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";
import { ensureAuthUser } from "../middlewares/ensureAuthUser.middleware.js";
import {
  listComplaintsQuery,
  mongoIdParam,
  staffActionRules,
} from "../middlewares/validation.middleware.js";

const router = express.Router();

router.use(authenticate, ensureAuthUser, requireRoles("staff", "admin"));

router.get("/complaints", listComplaintsQuery, controller.listAllComplaints);
router.get("/complaints/:id", mongoIdParam, controller.getComplaintById);
router.patch(
  "/complaints/:id/action",
  staffActionRules,
  controller.updateComplaintAction,
);

export default router;
