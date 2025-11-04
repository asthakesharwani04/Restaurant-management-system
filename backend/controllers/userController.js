// backend/controllers/userController.js
import User from '../models/User.js';

// Get user by phone number
export const getUserByPhone = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone || phone.length !== 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid 10-digit phone number' 
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Create or update user
export const createOrUpdateUser = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, phone, and address are required' 
      });
    }

    if (phone.length !== 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid 10-digit phone number' 
      });
    }

    // Check if user exists
    let user = await User.findOne({ phone });

    if (user) {
      // Update existing user
      user.name = name;
      user.address = address;
      user.lastOrderDate = new Date();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        name,
        phone,
        address,
        lastOrderDate: new Date()
      });
    }

    res.status(user.isNew ? 201 : 200).json({ 
      success: true, 
      data: user,
      message: user.isNew ? 'User created successfully' : 'User updated successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ lastOrderDate: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};