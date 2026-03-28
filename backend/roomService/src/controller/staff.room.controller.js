import Room from "../models/room.model.js";
import {
  authOccupantsPopulate,
  formatOccupantEntry,
} from "../models/userRef.model.js";

function mapRoomWithOccupants(r) {
  const occ = r.occupants || [];
  const { occupants: _raw, ...base } = r;
  return {
    ...base,
    vacancy: Math.max(0, r.capacity - occ.length),
    occupants: occ.map(formatOccupantEntry),
  };
}

export async function listAllRooms(req, res) {
  const rooms = await Room.find()
    .sort({ block: 1, floor: 1, roomNumber: 1 })
    .populate(authOccupantsPopulate())
    .lean();
  return res.json({ rooms: rooms.map(mapRoomWithOccupants) });
}

export async function getRoomById(req, res) {
  const room = await Room.findById(req.params.id)
    .populate(authOccupantsPopulate())
    .lean();
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }
  return res.json({ room: mapRoomWithOccupants(room) });
}

export async function createRoom(req, res) {
  const payload = req.body;
  const exists = await Room.findOne({ roomNumber: payload.roomNumber });
  if (exists) {
    return res.status(409).json({ message: "Room number already exists" });
  }

  const rawOccupants = Array.isArray(payload.occupants) ? payload.occupants : [];
  const occupants = rawOccupants.map((o) => ({
    userId: o.userId,
  }));

  if (occupants.length > 0) {
    const userIds = occupants.map((o) => o.userId);
    const conflicts = await Room.find({
      "occupants.userId": { $in: userIds },
    })
      .select("roomNumber")
      .lean();
    if (conflicts.length > 0) {
      return res.status(400).json({
        message:
          "One or more users are already assigned to another room. Remove them from the other room first.",
        conflicts: conflicts.map((c) => ({
          roomId: c._id,
          roomNumber: c.roomNumber,
        })),
      });
    }
  }

  const room = await Room.create({
    roomNumber: payload.roomNumber,
    block: payload.block ?? "",
    floor: payload.floor ?? "",
    description: payload.description ?? "",
    amenities: payload.amenities ?? [],
    images: payload.images ?? [],
    capacity: payload.capacity,
    status: payload.status ?? "available",
    occupants,
  });

  const populated = await Room.findById(room._id)
    .populate(authOccupantsPopulate())
    .lean();

  return res.status(201).json({
    message: "Room created",
    room: mapRoomWithOccupants(populated),
  });
}

export async function updateRoom(req, res) {
  const room = await Room.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  const {
    roomNumber,
    block,
    floor,
    description,
    amenities,
    images,
    capacity,
    status,
  } = req.body;

  if (roomNumber !== undefined) {
    const clash = await Room.findOne({
      roomNumber,
      _id: { $ne: room._id },
    });
    if (clash) {
      return res.status(409).json({ message: "Room number already in use" });
    }
    room.roomNumber = roomNumber;
  }
  if (block !== undefined) room.block = block;
  if (floor !== undefined) room.floor = floor;
  if (description !== undefined) room.description = description;
  if (amenities !== undefined) room.amenities = amenities;
  if (images !== undefined) room.images = images;
  if (capacity !== undefined) {
    if (capacity < (room.occupants?.length || 0)) {
      return res.status(400).json({
        message: "capacity cannot be less than current number of occupants",
      });
    }
    room.capacity = capacity;
  }
  if (status !== undefined) room.status = status;

  await room.save();
  const updated = await Room.findById(room._id)
    .populate(authOccupantsPopulate())
    .lean();
  return res.json({
    message: "Room updated",
    room: mapRoomWithOccupants(updated),
  });
}

export async function deleteRoom(req, res) {
  const room = await Room.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }
  if (room.occupants?.length > 0) {
    return res.status(400).json({
      message: "Cannot delete a room that still has occupants",
    });
  }
  await room.deleteOne();
  return res.json({ message: "Room deleted" });
}
