import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['room', 'service', 'facility', 'other']
  },
  priority: { type: String, enum: ['low', 'medium', 'high'] },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected']
  },
  attachmentUrls: [String],
  staffNote: String,
  handledBy: mongoose.Schema.Types.ObjectId,
  resolvedAt: Date
}, { timestamps: true });

complaintSchema.index({ createdAt: 1 });
complaintSchema.index({ category: 1, status: 1 });

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);

export default Complaint;

