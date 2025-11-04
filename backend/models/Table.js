import mongoose from 'mongoose'
const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true,
    unique: true
  },
  size: {
    type: Number,
    enum: [2, 4, 6, 8],
    required: true
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  isReserved: {
    type: Boolean,
    default: false
  },
  reservedBy: {
    type: String,
    default: ''
  },
  numberOfMembers: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Table', tableSchema);