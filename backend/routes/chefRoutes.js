import express from 'express';
const router = express.Router();

import {getChefs, getChefById, createChef, updateChef, deleteChef} from '../controllers/chefController.js';

//Chef routes
router.get('/', getChefs);
router.get('/:id', getChefById);
router.post('/', createChef);
router.put('/:id', updateChef);
router.delete('/:id', deleteChef);

export default router;