import mongoose from "mongoose";
import { uploadImage } from "../../services/imagekit.service.js";
import complaintModel from "../models/complaint.model.js";

const uploadImageKitBase64 = async (base64Data, fileName) => {
  const uploadResult = await uploadImage(base64Data, fileName);
  return uploadResult?.url;
};

function formatComplaint(docOrLean) {
  const o = docOrLean?.toObject ? docOrLean.toObject() : docOrLean;
  return {
    id: String(o._id),
    studentId: String(o.studentId),
    title: o.title,
    description: o.description,
    category: o.category,
    priority: o.priority,
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
    const {
      title,
      description,
      category,
      priority,
      attachmentUrls = [],
      attachmentBase64,
    } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.user.id);

    const resolvedUrls = Array.isArray(attachmentUrls)
      ? [...attachmentUrls]
      : [];

    if (attachmentBase64 && typeof attachmentBase64 === "string") {
      try {
        const fileName = `complaint-${studentId.toString()}-${Date.now()}.jpeg`;
        const url = await uploadImageKitBase64(attachmentBase64, fileName);
        if (url) resolvedUrls.push(url);
      } catch (uploadErr) {
        console.warn("ImageKit upload failed:", uploadErr);
      }
    }

    const doc = await complaintModel.create({
      studentId,
      title,
      description,
      category: category ?? "other",
      priority: priority ?? "medium",
      attachmentUrls: resolvedUrls,
    });

    res.status(201).json({ complaint: formatComplaint(doc) });
  } catch (err) {
    next(err);
  }
}

export async function deleteOwnComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const studentId = new mongoose.Types.ObjectId(req.user.id);
    const doc = await complaintModel.findOne({
      _id: id,
      studentId,
    });
    if (!doc) {
      return res.status(404).json({ message: "Complaint not found or access denied" });
    }
    await complaintModel.findByIdAndDelete(id);
    res.json({ message: "Complaint deleted successfully" });
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
