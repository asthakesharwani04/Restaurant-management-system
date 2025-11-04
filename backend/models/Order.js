
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },specialInstructions: {  
    type: String,
    trim: true,
    maxlength: [500, 'Special instructions cannot exceed 500 characters'],
    default: ''
  }
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
     orderId: {
      type: String,
      required: true,
      unique: true,
      default: () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
     },
    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway'],
      required: true
    },
    tableNumber: {
      type: Number,
      validate: {
        validator: function(v) {
          return this.orderType === 'takeaway' || (v != null && v > 0);
        },
        message: 'Table number is required for dine-in orders'
      }
    },
    items: [orderItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    grandTotal: {  
      type: Number,
      required: true,
      min: 0
    },
    processingTime: {
      type: Number, // countdown in minutes
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'done'],
      default: 'pending'
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true
    },
    customerAddress: {
      type: String,
      trim: true,
      default: '' ,
      validate: {
        validator: function(v) {
          return this.orderType === 'dine-in' || (v && v.length > 0);
        },
        message: 'Address is required for takeaway orders'
      }
    },
    numberOfMembers: {
      type: Number,
      min: 1,
      default: 1,
      validate: {
        validator: function(v) {
          return this.orderType === 'takeaway' || v > 0;
        },
        message: 'Number of members is required for dine-in orders'
      }
    },
    cookingInstructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Instructions cannot exceed 500 characters'],
      default: ''
    },
    chefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chef'
    }
  },
  {
    timestamps: true
  }
);

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
  // Calculate totalPrice from items
  if (this.items && this.items.length > 0) {
    this.totalPrice = this.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // Calculate grandTotal (totalPrice + taxes + delivery)
    const taxes = this.totalPrice * 0.05;
    const deliveryCharge = this.orderType === 'takeaway' ? 50 : 0;
    this.grandTotal = this.totalPrice + taxes + deliveryCharge;
  }

  next();
});

// Indexes
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ chefId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;