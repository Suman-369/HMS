import express from "express";
import * as studentRoom from "../controller/student.room.controller.js";
import * as notice from "../controller/notice.controller.js";
import * as application from "../controller/application.controller.js";
import { authenticate, requireRoles } from "../middlewares/auth.middleware.js";
import {
  applyForRoomRules,
  mongoIdParam,
} from "../middlewares/validation.middleware.js";

const router = express.Router();

/** Same secret as auth; any logged-in hostel user can browse catalog. */
const browseRoles = ["student", "staff", "admin"];

router.use(authenticate);

router.get(
  "/rooms",
  requireRoles(...browseRoles),
  studentRoom.listAvailableRooms,
);
router.get(
  "/rooms/:id",
  requireRoles(...browseRoles),
  mongoIdParam,
  studentRoom.getRoomDetail,
);

router.get("/me/room", requireRoles("student"), studentRoom.getMyRoom);
router.get("/notices", requireRoles(...browseRoles), notice.listNotices);
router.get(
  "/applications",
  requireRoles("student"),
  application.listMyApplications,
);
router.post(
  "/applications",
  requireRoles("student"),
  applyForRoomRules,
  application.applyForRoom,
);

export default router;
