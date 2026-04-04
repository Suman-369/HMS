import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be low, medium or high'
    },
    default: 'medium'
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // ref auth user model
    required: [true, 'Staff is required']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'in-progress', 'completed'],
      message: 'Status must be pending, in-progress or completed'
    },
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
taskSchema.index({ staffId: 1, status: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ createdBy: 1 });

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

export default Task;

