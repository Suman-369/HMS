import mongoose from "mongoose";
import complaintModel from "../models/complaint.model.js";

function formatComplaint(docOrLean) {
  const o = docOrLean?.toObject ? docOrLean.toObject() : docOrLean;
  return {
    id: String(o._id),
    studentId: String(o.studentId),
    title: o.title,
    description: o.description,
    category: o.category,
    status: o.status,
    attachmentUrls: o.attachmentUrls ?? [],
    staffNote: o.staffNote ?? null,
    handledBy: o.handledBy != null ? String(o.handledBy) : null,
    resolvedAt: o.resolvedAt ?? null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export async function createComplaint(req, res, next) {
  try {
    const { title, description, category, attachmentUrls } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.user.id);

    const doc = await complaintModel.create({
      studentId,
      title,
      description,
      category: category ?? "other",
      attachmentUrls: Array.isArray(attachmentUrls) ? attachmentUrls : [],
    });

    res.status(201).json({ complaint: formatComplaint(doc) });
  } catch (err) {
    next(err);
  }
}

export async function listMyComplaints(req, res, next) {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user.id);
    const items = await complaintModel
      .find({ studentId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      complaints: items.map((o) => formatComplaint(o)),
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyComplaintById(req, res, next) {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user.id);
    const doc = await complaintModel.findOne({
      _id: req.params.id,
      studentId,
    });

    if (!doc) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({ complaint: formatComplaint(doc) });
  } catch (err) {
    next(err);
  }
}
