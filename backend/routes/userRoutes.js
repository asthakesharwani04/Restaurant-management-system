// backend/routes/userRoutes.js
import express from 'express';
import { 
  getUserByPhone, 
  createOrUpdateUser, 
  getAllUsers 
} from '../controllers/userController.js';

const router = express.Router();

// Get user by phone number
router.get('/phone/:phone', getUserByPhone);

// Create or update user
router.post('/', createOrUpdateUser);

// Get all users
router.get('/', getAllUsers);

export default router;