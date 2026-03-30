import mongoose from "mongoose";

const occupantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    assignedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true },
    block: { type: String, default: "", trim: true },
    floor: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    amenities: [{ type: String, trim: true }],
    images: [{ type: String, trim: true }],
    capacity: { type: Number, required: true, min: 1 },
    price: { type: Number, default: 0 }, // price in INR
    occupants: { type: [occupantSchema], default: [] },
    status: {
      type: String,
      enum: ["available", "full", "maintenance"],
      default: "available",
    },
  },
  { timestamps: true },
);

roomSchema.virtual("vacancy").get(function () {
  return Math.max(0, this.capacity - (this.occupants?.length || 0));
});

roomSchema.set("toJSON", { virtuals: true });
roomSchema.set("toObject", { virtuals: true });

function syncRoomAvailability(doc) {
  if (!doc || doc.status === "maintenance") return;
  const occ = doc.occupants?.length || 0;
  if (occ >= doc.capacity) doc.status = "full";
  else doc.status = "available";
}

roomSchema.pre("save", function () {
  syncRoomAvailability(this);
});

const Room = mongoose.model("Room", roomSchema);

export default Room;
