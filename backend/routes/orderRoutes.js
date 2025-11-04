import express from 'express';
const router = express.Router();
import {createOrder, getOrders,
  getOrderById,
  updateOrderStatus,
  updateProcessingTime,
  getAnalytics} from '../controllers/orderController.js';

  //Analytics route
  router.get('/stats', getAnalytics);

  //Order routes
  router.post('/', createOrder);
  router.get('/', getOrders);
  router.get('/:id', getOrderById);
  router.patch('/:id/status', updateOrderStatus);
  router.patch('/:id/processing-time', updateProcessingTime);

    export default router;
