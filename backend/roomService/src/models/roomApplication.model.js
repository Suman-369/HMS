import mongoose from "mongoose";

const roomApplicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    studentDetails: {
      name: { type: String, required: true },
      rollNo: { type: String, required: true },
      courseStream: { type: String, required: true },
      mobile: { type: String, required: true, match: [/^\+?\d{10,15}$/, "Invalid mobile number"] }
    },
    message: { type: String, default: "", maxlength: 2000 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    staffNote: { type: String, default: "" },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

roomApplicationSchema.index(
  { studentId: 1, room: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

const RoomApplication = mongoose.model(
  "RoomApplication",
  roomApplicationSchema,
);

export default RoomApplication;
