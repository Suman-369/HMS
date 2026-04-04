import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true
  },
  fullname: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    }
  }
}, { 
  timestamps: true,
  // Don't save to DB - projection only
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for 'name' field (used in populate('staffId', 'name'))
userSchema.virtual('name').get(function() {
  return `${this.fullname.firstName} ${this.fullname.lastName}`;
});

// Ensure virtuals in populate
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
