import Notice from "../models/notice.model.js";
import mongoose from "mongoose";
import { getAuthUserModel } from "../models/userRef.model.js";

const NOTICE_TYPES = ["general", "event", "maintenance", "academic"];

export async function createNotice(req, res) {
  try {
    const { title, type, description, relevancePercentage } = req.body;

    if (!title || !type || !description || relevancePercentage === undefined) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    if (!NOTICE_TYPES.includes(type)) {
      return res.status(400).json({ message: "Invalid notice type" });
    }

    const relevance = Number(relevancePercentage);
    if (!Number.isFinite(relevance) || relevance < 0 || relevance > 100) {
      return res
        .status(400)
        .json({ message: "Relevance percentage must be between 0 and 100" });
    }

    const notice = await Notice.create({
      title: title.trim(),
      type,
      description: description.trim(),
      relevancePercentage: relevance,
      staffId: req.user.id,
    });

    const populated = await Notice.findById(notice._id)
      .populate({
        path: "staffId",
        model: getAuthUserModel(),
        select: "email fullname role",
      })
      .lean();

    return res.status(201).json({
      message: "Notice created successfully",
      notice: populated,
    });
  } catch (error) {
    console.error("createNotice error", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((i) => i.message);
      return res.status(400).json({ message: messages.join("; ") });
    }
    return res.status(500).json({ message: "Failed to create notice" });
  }
}

export async function listNotices(req, res) {
  try {
    const limit = Math.max(0, Number(req.query.limit) || 0);
    const query = Notice.find().sort({ createdAt: -1 }).populate({
      path: "staffId",
      model: getAuthUserModel(),
      select: "email fullname role",
    });
    if (limit > 0) query.limit(limit);

    const notices = await query.lean();

    return res.json({ notices });
  } catch (error) {
    console.error("listNotices error", error);
    return res.status(500).json({ message: "Failed to load notices" });
  }
}

export async function updateNotice(req, res) {
  try {
    const { id } = req.params;
    const { title, type, description, relevancePercentage } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notice ID" });
    }

    const notice = await Notice.findOne({ _id: id, staffId: req.user.id });
    if (!notice) {
      return res.status(404).json({ message: "Notice not found or access denied" });
    }

    if (title !== undefined) notice.title = title.trim();
    if (type !== undefined) {
      if (!NOTICE_TYPES.includes(type)) {
        return res.status(400).json({ message: "Invalid notice type" });
      }
      notice.type = type;
    }
    if (description !== undefined) notice.description = description.trim();
    if (relevancePercentage !== undefined) {
      const relevance = Number(relevancePercentage);
      if (!Number.isFinite(relevance) || relevance < 0 || relevance > 100) {
        return res.status(400).json({ message: "Relevance percentage must be between 0 and 100" });
      }
      notice.relevancePercentage = relevance;
    }

    await notice.save();

    const populated = await Notice.findById(notice._id)
      .populate({
        path: "staffId",
        model: getAuthUserModel(),
        select: "email fullname role",
      })
      .lean();

    return res.json({
      message: "Notice updated successfully",
      notice: populated,
    });
  } catch (error) {
    console.error("updateNotice error", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((i) => i.message);
      return res.status(400).json({ message: messages.join("; ") });
    }
    return res.status(500).json({ message: "Failed to update notice" });
  }
}

export async function deleteNotice(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notice ID" });
    }

    const notice = await Notice.findOneAndDelete({ _id: id, staffId: req.user.id });
    if (!notice) {
      return res.status(404).json({ message: "Notice not found or access denied" });
    }

    return res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("deleteNotice error", error);
    return res.status(500).json({ message: "Failed to delete notice" });
  }
}
