// backend/models/MenuItem.js - Modern JS
import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  averagePreparationTime: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Burger', 'Pizza', 'Drink', 'French fries', 'Veggies', 'Salads', 'Pasta', 'Sandwiches', 'Desserts'],
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  image: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});


// Index for faster queries
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;