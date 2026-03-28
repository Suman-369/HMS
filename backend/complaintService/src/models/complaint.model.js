import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8000,
    },
    category: {
      type: String,
      enum: ["room", "service", "facility", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected"],
      default: "pending",
      index: true,
    },
    /** Client-provided URLs after uploading files elsewhere (e.g. object storage). */
    attachmentUrls: [{ type: String, trim: true }],
    staffNote: { type: String, trim: true, maxlength: 4000 },
    handledBy: { type: mongoose.Schema.Types.ObjectId },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

const complaintModel = mongoose.model("complaint", complaintSchema);

export default complaintModel;
