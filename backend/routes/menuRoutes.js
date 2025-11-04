import express from 'express';
const router = express.Router();
import upload from '../middleware/upload.js';
import {getAllMenuItems,
  getCategories,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem} from '../controllers/menuController.js';

  // Category route
router.get('/categories', getCategories);

// Menu item routes
router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);
router.post('/', upload.single('image'), createMenuItem);
router.put('/:id', upload.single('image'), updateMenuItem);
router.delete('/:id', deleteMenuItem);

export default router;