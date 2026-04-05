import express from "express";
import * as authController from "../controller/auth.controller.js";
import * as ValidationRules from "../middlewares/validation.middlewar.js";
import { verifyToken, isAdmin } from "../middlewares/auth.js";

import passport from "passport";
const router = express.Router();

router.post(
  "/register",
  ValidationRules.registerUSerValidationRules,
  authController.register,
);

router.post(
  "/login",
  ValidationRules.loginUserValidationRules,
  authController.login,
);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  authController.googleAuthCallback,
);

router.post("/logout", authController.logout);

// Protected routes
router.get("/me", verifyToken, authController.getCurrentUser);

router.get("/users", verifyToken, isAdmin, authController.getUsersByRole);
router.get("/staff-directory", authController.getPublicStaffDirectory);

router.put("/users/:id/status", verifyToken, isAdmin, authController.updateUserStatus);

router.put("/users/:id/block", verifyToken, isAdmin, authController.toggleUserBlock);

export default router;
