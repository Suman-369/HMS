import express from "express";
import * as staffRoom from "../controller/staff.room.controller.js";
import * as application from "../controller/application.controller.js";
import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";
import * as Validation from "../middlewares/validation.middleware.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.use(authenticate, requireRoles("staff", "admin"));

router.get("/rooms", staffRoom.listAllRooms);
router.get("/users", staffRoom.listUsers);
router.post("/rooms", Validation.createRoomRules, staffRoom.createRoom);
router.get(
  "/rooms/:id",
  Validation.mongoIdParam,
  staffRoom.getRoomById,
);
router.patch(
  "/rooms/:id",
  Validation.updateRoomRules,
  staffRoom.updateRoom,
);
router.delete(
  "/rooms/:id",
  Validation.mongoIdParam,
  staffRoom.deleteRoom,
);

router.get(
  "/applications",
  Validation.listApplicationsQuery,
  application.listAllApplications,
);
router.post(
  "/upload-image",
  upload.single("image"),
  staffRoom.uploadImageHandler
);
router.patch(
  "/applications/:id/decision",
  Validation.applicationDecisionRules,
  application.decideApplication,
);

export default router;
