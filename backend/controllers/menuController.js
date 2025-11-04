// backend/controllers/menuController.js - Modern JS
import MenuItem from '../models/MenuItem.js';

// Get all menu items with filters
export const getAllMenuItems = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [items, total] = await Promise.all([
      MenuItem.find(filter)
        .sort({ category: 1, name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MenuItem.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category');
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get menu item by ID
export const getMenuItemById = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Create menu item
export const createMenuItem = async (req, res) => {
  try {
    // Handle file upload
    const imagePath = req.file ? `/uploads/${req.file.filename}` : req.body.image;
    
    const menuItemData = {
      ...req.body,
      image: imagePath
    };

    // Convert numeric fields
    const numericFields = ['price', 'averagePreparationTime', 'stock'];
    numericFields.forEach(field => {
      if (menuItemData[field]) {
        menuItemData[field] = Number(menuItemData[field]);
      }
    });

    const item = await MenuItem.create(menuItemData);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update menu item 
export const updateMenuItem = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle file upload if new image is provided
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    // Convert numeric fields
    const numericFields = ['price', 'averagePreparationTime', 'stock'];
    numericFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = Number(updateData[field]);
      }
    });

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};