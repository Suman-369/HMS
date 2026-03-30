import mongoose from "mongoose";
import Room from "../models/room.model.js";
import {
  authOccupantsPopulate,
  formatOccupantEntry,
} from "../models/userRef.model.js";

function availableFilter() {
  return {
    status: { $ne: "maintenance" },
    $expr: { $lt: [{ $size: { $ifNull: ["$occupants", []] } }, "$capacity"] },
  };
}

export async function listAvailableRooms(req, res) {
  const { block, floor } = req.query;
  const q = { ...availableFilter() };
  if (block) q.block = String(block);
  if (floor) q.floor = String(floor);

  const rooms = await Room.find(q)
    .sort({ block: 1, floor: 1, roomNumber: 1 })
    .lean();

  const roomsOut = rooms.map((r) => {
    const occ = r.occupants?.length || 0;
    return {
      ...r,
      vacancy: Math.max(0, r.capacity - occ),
    };
  });

  return res.json({ rooms: roomsOut });
}

export async function getRoomDetail(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid room id" });
  }

  const room = await Room.findById(id)
    .populate(authOccupantsPopulate())
    .lean();
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  const occupants = room.occupants || [];
  const { occupants: _omit, ...roomBase } = room;
  const roommates = occupants.map(formatOccupantEntry);

  return res.json({
    room: {
      ...roomBase,
      vacancy: Math.max(0, room.capacity - occupants.length),
    },
    roommates,
  });
}

export async function getMyRoom(req, res) {
  const studentId = req.user.id;
  const room = await Room.findOne({ "occupants.userId": studentId })
    .populate(authOccupantsPopulate())
    .lean();
  if (!room) {
    return res.json({ room: null, roommates: [] });
  }

  const occupants = room.occupants || [];
  const { occupants: _omit, ...roomBase } = room;
  const roommates = occupants
    .filter((o) => String(o.userId?._id ?? o.userId) !== String(studentId))
    .map(formatOccupantEntry);

  return res.json({
    room: {
      ...roomBase,
      vacancy: Math.max(0, room.capacity - occupants.length),
    },
    roommates,
  });
}
