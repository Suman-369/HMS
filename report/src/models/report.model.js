import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: [true, 'Month is required (1-12)'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 2000
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: {
      values: ['complaints', 'rooms', 'occupancy', 'maintenance', 'finance'],
      message: 'Invalid service type'
    }
  },
  stats: {
    total: { type: Number, default: 0 },
    resolved: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    avgResolutionDays: { type: Number, default: 0 },
    trends: [{ monthDay: Number, count: Number }] // e.g., daily/weekly trends
  },
  pdfUrl: {
    type: String,
    trim: true
  },

  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient monthly/service queries
reportSchema.index({ serviceType: 1, year: 1, month: 1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ createdAt: -1 });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

export default Report;

