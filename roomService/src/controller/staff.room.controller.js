import Room from "../models/room.model.js";
import RoomApplication from "../models/roomApplication.model.js";
import { uploadImage } from "../service/imagekit.service.js";
import { getAuthUserModel } from "../models/userRef.model.js";
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

async function resolveImageUrls(images = []) {
  if (!Array.isArray(images)) return [];

  const resolved = [];
  for (const image of images) {
    if (!image) continue;

    if (typeof image === "string" && image.startsWith("data:")) {
      // Incoming base64 data URL from frontend, upload to ImageKit
      const [, meta] = image.split(",");
      const fileName = `room-${Date.now()}.png`;
      const result = await uploadImage(meta, fileName);
      if (result?.url) resolved.push(result.url);
    } else if (typeof image === "string") {
      // Already a URL, leave as-is
      resolved.push(image);
    }
  }

  return resolved;
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

  const rawOccupants = Array.isArray(payload.occupants)
    ? payload.occupants
    : [];
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

  const resolvedImageUrls = await resolveImageUrls(payload.images ?? []);

  const room = await Room.create({
    roomNumber: payload.roomNumber,
    block: payload.block ?? "",
    floor: payload.floor ?? "",
    description: payload.description ?? "",
    amenities: payload.amenities ?? [],
    images: resolvedImageUrls,
    capacity: payload.capacity,
    price: payload.price ?? 0,
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
    price,
    status,
    occupants: payloadOccupants,
  } = req.body;

  const targetCapacity = capacity !== undefined ? capacity : room.capacity;

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
  if (payloadOccupants !== undefined) {
    const newOccupants = Array.isArray(payloadOccupants)
      ? payloadOccupants.map((o) => ({ userId: o.userId }))
      : [];

    if (newOccupants.length > targetCapacity) {
      return res.status(400).json({
        message: "Occupants count cannot exceed room capacity",
      });
    }

    const occupantIds = newOccupants.map((o) => o.userId);
    if (occupantIds.length > 0) {
      const conflicts = await Room.find({
        _id: { $ne: room._id },
        "occupants.userId": { $in: occupantIds },
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

    room.occupants = newOccupants;
  }

  if (price !== undefined) room.price = price;
  if (images !== undefined) {
    const resolvedImageUrls = await resolveImageUrls(images);
    room.images = resolvedImageUrls;
  }
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

// List all users for occupant dropdown
export async function listUsers(req, res) {
  try {
    const User = getAuthUserModel();
    const users = await User.find().select("_id email fullname role").lean();
    return res.json({ users });
  } catch (err) {
    console.error("listUsers error", err);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
}

export async function getStaffDashboardStats(req, res) {
  try {
    const User = getAuthUserModel();
    const totalStudents = await User.countDocuments({ role: "student" });

    const rooms = await Room.find().lean();
    const availableRooms = rooms.filter((room) => {
      const occupied = Array.isArray(room.occupants)
        ? room.occupants.length
        : 0;
      const vacancy = (room.capacity || 0) - occupied;
      return room.status === "available" && vacancy > 0;
    }).length;

    const newApplications = await RoomApplication.countDocuments({
      status: "pending",
    });

    return res.json({ totalStudents, availableRooms, newApplications });
  } catch (err) {
    console.error("getStaffDashboardStats error", err);
    return res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
}

export async function uploadImageHandler(req, res) {
  try {
    if (!req.file) {
      console.error("uploadImageHandler: no file received", req.body);
      return res.status(400).json({ message: "No image file provided" });
    }

    console.log("uploadImageHandler file received", {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const result = await uploadImage(req.file.buffer, req.file.originalname);
    return res.status(200).json({
      message: "Image uploaded successfully",
      url: result.url,
      fileId: result.fileId,
    });
  } catch (error) {
    console.error("uploadImageHandler error", error);
    return res.status(500).json({
      message: "Image upload failed",
      error: error.message || "unknown",
    });
  }
}

export async function getRecentActivities(req, res) {
  try {
    // Fetch recent room applications (all statuses, recent changes)
    const recentApps = await RoomApplication.find()
      .populate("room", "roomNumber block")
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    // Fetch recent complaints from complaint service
    const complaintRes = await fetch(
      "http://localhost:3003/api/staff/complaints?limit=5&sort=-updatedAt",
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      },
    );
    const complaintData = await complaintRes.json();
    const recentComplaints = complaintData.complaints || [];

    // Format unified activities
    const activities = [];

    // Applications
    recentApps.forEach((app) => {
      const studentName = app.studentDetails?.name || "Unknown Student";
      const roomNum = app.room?.roomNumber || "Unknown Room";

      activities.push({
        type: "application",
        title:
          app.status === "pending"
            ? "New Room Application"
            : `${app.status.charAt(0).toUpperCase() + app.status.slice(1)} Application`,
        description: `${studentName} ${app.status === "pending" ? "applied for" : app.status} ${roomNum} No Room`,
        timestamp: app.updatedAt || app.createdAt,
        iconColor: "blue",
        studentName,
        roomNumber: roomNum,
        status: app.status,
        id: app._id,
      });
    });

    // Complaints
    recentComplaints.forEach((comp) => {
      const studentObj = comp.student || {};

      let studentName = "Unknown Student";
      if (studentObj.fullname) {
        if (typeof studentObj.fullname === "object") {
          studentName =
            `${studentObj.fullname.firstName || ""} ${studentObj.fullname.lastName || ""}`.trim();
        } else if (typeof studentObj.fullname === "string") {
          studentName = studentObj.fullname;
        }
      } else if (studentObj.name) {
        studentName = studentObj.name;
      } else if (studentObj.id) {
        studentName = `Student ${studentObj.id.slice(-4)}`;
      }

      const isNew =
        !comp.updatedAt ||
        new Date(comp.updatedAt).getTime() ===
          new Date(comp.createdAt).getTime();

      activities.push({
        type: "complaint",
        title: isNew ? "New Complaint" : "Complaint Updated",
        description: `${comp.title.slice(0, 50)}${comp.title.length > 50 ? "..." : ""}${!isNew ? ` - ${comp.status}` : ""} by ${studentName}`,
        timestamp: comp.updatedAt || comp.createdAt,
        iconColor: "orange",
        studentName,
        complaintTitle: comp.title,
        status: comp.status,
        id: comp.id,
      });
    });

    // Room assignments (recent occupant changes via recent approved apps)
    // Handled in application approved above

    // Sort by timestamp desc, take top 5
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const topActivities = activities.slice(0, 5);

    return res.json({ activities: topActivities });
  } catch (err) {
    console.error("getRecentActivities error:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch recent activities" });
  }
}
