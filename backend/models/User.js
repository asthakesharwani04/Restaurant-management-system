// backend/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    lastOrderDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Index for faster phone lookup
userSchema.index({ phone: 1 });

const User = mongoose.model('User', userSchema);

export default User;