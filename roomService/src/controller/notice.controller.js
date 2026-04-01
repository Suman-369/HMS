import Notice from "../models/notice.model.js";
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
