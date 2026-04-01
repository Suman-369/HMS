import mongoose from "mongoose";
import Room from "../models/room.model.js";
import RoomApplication from "../models/roomApplication.model.js";
import { authStudentPopulate } from "../models/userRef.model.js";
import { sameId } from "../utils/id.util.js";

export async function applyForRoom(req, res) {
  const studentId = req.user.id;
  const { roomId, studentDetails, message } = req.body;

  // Validate required fields
  if (!studentDetails || !studentDetails.name || !studentDetails.rollNo || !studentDetails.courseStream || !studentDetails.mobile) {
    return res.status(400).json({ message: "All student details are required" });
  }

  const assignedElsewhere = await Room.findOne({
    "occupants.userId": studentId,
  });
  if (assignedElsewhere) {
    return res.status(400).json({
      message: "You are already assigned to a room",
      roomId: assignedElsewhere._id,
    });
  }

  const room = await Room.findById(roomId);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }
  if (room.status === "maintenance") {
    return res.status(400).json({ message: "Room is not accepting applications" });
  }
  const occ = room.occupants?.length || 0;
  if (occ >= room.capacity) {
    return res.status(400).json({ message: "Room is full" });
  }

  if (room.occupants?.some((o) => sameId(o.userId, studentId))) {
    return res.status(400).json({ message: "You are already in this room" });
  }

  try {
    const application = await RoomApplication.create({
      studentId,
      room: room._id,
      studentDetails,
      message: message ?? "",
      status: "pending",
    });
    await application.populate([{ path: "room" }, authStudentPopulate()]);
    return res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        message: "You already have a pending application for this room",
      });
    }
    console.error("Apply error:", err);
    throw err;
  }
}

export async function listMyApplications(req, res) {
  const applications = await RoomApplication.find({ studentId: req.user.id })
    .populate([{ path: "room" }, authStudentPopulate(), "studentDetails"])
    .sort({ createdAt: -1 })
    .lean();
  return res.json({ applications });

}

export async function listAllApplications(req, res) {
  const { status } = req.query;
  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }

  const applications = await RoomApplication.find(filter)
    .populate([{ path: "room" }, authStudentPopulate(), "studentDetails"])
    .sort({ createdAt: -1 })
    .lean();
  return res.json({ applications });

}

export async function decideApplication(req, res) {
  const { id } = req.params;
  const { decision, staffNote } = req.body;

  const application = await RoomApplication.findById(id);
  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }
  if (application.status !== "pending") {
    return res.status(400).json({ message: "Application is no longer pending" });
  }

  const staffId = req.user.id;
  const now = new Date();

  if (decision === "rejected") {
    application.status = "rejected";
    application.staffNote = staffNote ?? "";
    application.reviewedBy = staffId;
    application.reviewedAt = now;
    await application.save();
    await application.populate([{ path: "room" }, authStudentPopulate()]);
    return res.json({ message: "Application rejected", application });
  }

  const room = await Room.findById(application.room);
  if (!room) {
    return res.status(400).json({ message: "Room no longer exists" });
  }
  if (room.status === "maintenance") {
    return res.status(400).json({ message: "Room is under maintenance" });
  }

  const studentId = application.studentId;

  const otherRoom = await Room.findOne({
    "occupants.userId": studentId,
    _id: { $ne: room._id },
  });
  if (otherRoom) {
    return res.status(400).json({
      message: "Student is already assigned to another room",
      roomId: otherRoom._id,
    });
  }

  if (room.occupants?.some((o) => sameId(o.userId, studentId))) {
    application.status = "approved";
    application.staffNote = staffNote ?? "";
    application.reviewedBy = staffId;
    application.reviewedAt = now;
    await application.save();
    await application.populate([{ path: "room" }, authStudentPopulate()]);
    return res.json({ message: "Application approved (student already listed)", application });
  }

  const occ = room.occupants?.length || 0;
  if (occ >= room.capacity) {
    return res.status(400).json({ message: "Room is full" });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const lockedRoom = await Room.findById(room._id).session(session);
      if (!lockedRoom) {
        throw new Error("ROOM_NOT_FOUND");
      }
      const n = lockedRoom.occupants?.length || 0;
      if (n >= lockedRoom.capacity) {
        throw new Error("ROOM_FULL");
      }
      if (lockedRoom.occupants?.some((o) => sameId(o.userId, studentId))) {
        application.status = "approved";
        application.staffNote = staffNote ?? "";
        application.reviewedBy = staffId;
        application.reviewedAt = now;
        await application.save({ session });
        return;
      }

      lockedRoom.occupants.push({ userId: studentId });
      await lockedRoom.save({ session });

      application.status = "approved";
      application.staffNote = staffNote ?? "";
      application.reviewedBy = staffId;
      application.reviewedAt = now;
      await application.save({ session });

      await RoomApplication.updateMany(
        {
          studentId,
          status: "pending",
          _id: { $ne: application._id },
        },
        {
          $set: {
            status: "cancelled",
            staffNote: "Superseded after another application was approved",
            reviewedBy: staffId,
            reviewedAt: now,
          },
        },
        { session },
      );

      const refreshed = await Room.findById(room._id).session(session);
      const remaining =
        refreshed.capacity - (refreshed.occupants?.length || 0);
      if (remaining === 0) {
        await RoomApplication.updateMany(
          {
            room: room._id,
            status: "pending",
            studentId: { $ne: studentId },
          },
          {
            $set: {
              status: "rejected",
              staffNote: "Room is now full",
              reviewedBy: staffId,
              reviewedAt: now,
            },
          },
          { session },
        );
      }
    });
  } catch (e) {
    if (e.message === "ROOM_FULL") {
      return res.status(400).json({ message: "Room is full" });
    }
    if (e.message === "ROOM_NOT_FOUND") {
      return res.status(400).json({ message: "Room no longer exists" });
    }
    throw e;
  } finally {
    await session.endSession();
  }

  const updated = await RoomApplication.findById(application._id)
    .populate("room")
    .populate(authStudentPopulate());
  return res.json({ message: "Application approved", application: updated });
}
