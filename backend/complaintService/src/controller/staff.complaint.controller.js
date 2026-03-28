import mongoose from "mongoose";
import complaintModel from "../models/complaint.model.js";
import config from "../config/config.js";
import { formatStudentRef, getAuthUserModel } from "../models/userRef.model.js";

function studentPopulateOptions() {
  return {
    path: "studentId",
    model: getAuthUserModel(),
    select: "email fullname role",
  };
}

function resolveStudentRef(sid) {
  if (sid && typeof sid === "object" && sid._id) {
    return formatStudentRef(sid);
  }
  if (sid != null) {
    return { id: String(sid) };
  }
  return null;
}

function applyStudentPopulate(query) {
  if (!config.AUTH_DB_NAME) {
    return query;
  }
  return query.populate(studentPopulateOptions());
}

function toComplaintJson(doc, studentRef = null) {
  const o = doc.toObject ? doc.toObject() : doc;
  const base = {
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
  if (studentRef !== undefined) {
    base.student = studentRef;
  }
  return base;
}

export async function listAllComplaints(req, res, next) {
  try {
    const status = req.query.status;
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20),
    );
    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const [total, items] = await Promise.all([
      complaintModel.countDocuments(filter),
      applyStudentPopulate(
        complaintModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
      ).lean(),
    ]);

    const complaints = items.map((row) => {
      const sid = row.studentId;
      const plain = { ...row, studentId: sid?._id ?? row.studentId };
      return toComplaintJson(plain, resolveStudentRef(sid));
    });

    res.json({
      complaints,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
}

export async function getComplaintById(req, res, next) {
  try {
    const doc = await applyStudentPopulate(complaintModel.findById(req.params.id)).lean();

    if (!doc) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const sid = doc.studentId;
    const plain = { ...doc, studentId: sid?._id ?? doc.studentId };

    res.json({ complaint: toComplaintJson(plain, resolveStudentRef(sid)) });
  } catch (err) {
    next(err);
  }
}

export async function updateComplaintAction(req, res, next) {
  try {
    const { status, staffNote } = req.body;
    const doc = await complaintModel.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const staffId = new mongoose.Types.ObjectId(req.user.id);

    if (status != null && status !== "") {
      doc.status = status;
      doc.handledBy = staffId;
      if (status === "resolved" || status === "rejected") {
        doc.resolvedAt = new Date();
      } else if (status === "pending" || status === "in_progress") {
        doc.resolvedAt = undefined;
      }
    }

    if (staffNote != null && String(staffNote).trim() !== "") {
      doc.staffNote = String(staffNote).trim();
      doc.handledBy = staffId;
    }

    await doc.save();

    const populated = await applyStudentPopulate(complaintModel.findById(doc._id)).lean();

    const sid = populated.studentId;
    const plain = { ...populated, studentId: sid?._id ?? populated.studentId };

    res.json({ complaint: toComplaintJson(plain, resolveStudentRef(sid)) });
  } catch (err) {
    next(err);
  }
}
