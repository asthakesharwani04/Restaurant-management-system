import express from 'express';
const router = express.Router();
import {getTables,
  getAvailableTablesBySize,
  createTable,
  updateTable,
  deleteTable,
  reserveTable,
  releaseTable} from '../controllers/tableController.js';

// Table routes
router.get('/', getTables);
router.get('/available', getAvailableTablesBySize);
router.post('/', createTable);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);
router.patch('/:id/reserve', reserveTable);
router.patch('/:id/release', releaseTable);

export default router;