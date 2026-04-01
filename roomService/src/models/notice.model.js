import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notice title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    type: {
      type: String,
      enum: {
        values: ["general", "event", "maintenance", "academic"],
        message:
          "Notice type must be one of: general, event, maintenance, academic",
      },
      required: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    relevancePercentage: {
      type: Number,
      required: [true, "Relevance percentage is required"],
      min: [0, "Relevance must be at least 0%"],
      max: [100, "Relevance cannot exceed 100%"],
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // references auth service users via userRef.model.js
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Notice = mongoose.models.Notice || mongoose.model("Notice", noticeSchema);

export default Notice;
