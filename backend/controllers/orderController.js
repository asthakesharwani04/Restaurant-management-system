import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import Chef from '../models/Chef.js';
import MenuItem from '../models/MenuItem.js';
import {assignChefToOrder, getDateRange} from '../utils/helpers.js'; 

// Create new order with billing calculation
 export const createOrder = async (req, res) => {
  try {
    const orderData = { ...req.body };
    console.log('Received order data:', orderData);

    // Calculate processing time from menu items
    if (orderData.items && orderData.items.length > 0) {
      const menuItemIds = orderData.items.map(item => item.menuItemId);
      const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
       console.log("menu items are received",menuItems);
      // Get max preparation time
      const maxPrepTime = Math.max(
        ...orderData.items.map(orderItem => {
          const menuItem = menuItems.find(
            mi => mi._id.toString() === orderItem.menuItemId.toString()
          );
          return menuItem?.averagePreparationTime || 0;
        })
      );
      
      orderData.processingTime = maxPrepTime;

      console.log("max prep time is calculated", maxPrepTime)
    }

    // Assign chef to order
    orderData.chefId = await assignChefToOrder();

    console.log("order assigned",orderData.chefId);
    // If dine-in, reserve table
    if (orderData.orderType === 'dine-in' && orderData.tableNumber) {
      const table = await Table.findOne({ tableNumber: orderData.tableNumber });
      
      if (!table) {
        return res.status(404).json({ success: false, message: 'Table not found' });
      }
      
      if (table.isReserved) {
        return res.status(400).json({ success: false, message: 'Table is already reserved' });
      }
      
      await Table.findByIdAndUpdate(table._id, {
        isReserved: true,
        reservedBy: orderData.customerPhone,
        numberOfMembers: orderData.numberOfMembers
      });
    }

    // Create order (billing calculated in model pre-hook)
    const order = await Order.create(orderData);
    
    res.status(201).json({ 
      success: true, 
      data: order,
      message: `Order #${order.orderId} created successfully`
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('chefId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single order
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('chefId', 'name')
      .populate('items.menuItemId', 'name category');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;

    // If order is done, release table and decrement chef count
    if (status === 'done') {
      const updates = [];
      
      if (order.orderType === 'dine-in' && order.tableNumber) {
        updates.push(
          Table.findOneAndUpdate(
            { tableNumber: order.tableNumber },
            { isReserved: false, reservedBy: '', numberOfMembers: 0 }
          )
        );
      }

      if (order.chefId) {
        updates.push(
          Chef.findByIdAndUpdate(order.chefId, { $inc: { currentOrderCount: -1 } })
        );
      }

      await Promise.all(updates);
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update processing time (decrements on refresh)
export const updateProcessingTime = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.processingTime > 0) {
      order.processingTime -= 1;
    }

    // Auto-complete when time reaches 0
    if (order.processingTime === 0 && order.status !== 'done') {
      order.status = 'done';
      
      const updates = [];

      if (order.orderType === 'dine-in' && order.tableNumber) {
        updates.push(
          Table.findOneAndUpdate(
            { tableNumber: order.tableNumber },
            { isReserved: false, reservedBy: '', numberOfMembers: 0 }
          )
        );
      }

      if (order.chefId) {
        updates.push(
          Chef.findByIdAndUpdate(order.chefId, { $inc: { currentOrderCount: -1 } })
        );
      }

      await Promise.all(updates);
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get analytics stats
export const getAnalytics = async (req, res) => {
  try {
    const { filter = 'daily' } = req.query;
    const startDate = getDateRange(filter);

    // Run all aggregations in parallel
    const [totalRevenueResult, totalOrders, uniqueClients, chefs, tables, ordersSummary, revenueGraph] = await Promise.all([
      // Total revenue using grandTotal (all time)
      Order.aggregate([
        { $match: { status: 'done' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      
      // Total orders (all time)
      Order.countDocuments(),
      
      // Total unique clients
      Order.distinct('customerPhone'),
      
      // Chef stats
      Chef.find({ status: 'active' }),

      // Get table data
      Table.find(),
      
      // Orders summary with filter
      Order.aggregate([
        { $match: { 
        createdAt: { $gte: startDate },
        status: { $in: ['pending', 'processing', 'done'] } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            served: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
            dineIn: { $sum: { $cond: [{ $eq: ['$orderType', 'dine-in'] }, 1, 0] } },
            takeaway: { $sum: { $cond: [{ $eq: ['$orderType', 'takeaway'] }, 1, 0] } },
            revenue: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, '$grandTotal', 0] } }
          }
        }
      ]),
      
      // Revenue graph data using grandTotal
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: 'done' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$grandTotal' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);


     console.log("=== ANALYTICS RESULTS ===");
    console.log("Total Orders:", totalOrders);
    console.log("Orders Summary:", ordersSummary);
    console.log("uniqueClients",uniqueClients)



    // Format chef stats with ordersAssigned key
   const chefStats = chefs.map(chef => ({
      name: chef.name,
      ordersAssigned: chef.currentOrderCount || 0
    }));

    console.log("chef stats",chefStats)

    //Format revenue for display
    const totalRev = totalRevenueResult[0]?.total || 0;
    let revenueDisplay;
    if (totalRev >= 100000) {
      revenueDisplay = `${(totalRev / 100000).toFixed(1)}L`;
    } else if (totalRev >= 1000) {
      revenueDisplay = `${(totalRev / 1000).toFixed(1)}K`;
    } else {
      revenueDisplay = totalRev.toString();
    }
     console.log("revenue display", revenueDisplay);
     const analytics = {
      totalChefs: chefs.length,
      totalRevenue: revenueDisplay,
      totalOrders,
      totalClients: uniqueClients.length,
      chefs:chefStats,  
      tables: tables.map(t => ({
        tableNumber: t.tableNumber,
        isReserved: t.isReserved
      })),

      orderSummary: ordersSummary[0] || { 
        served: 0, 
        dineIn: 0, 
        takeaway: 0, 
        revenue: 0 
      },
      revenueGraph: revenueGraph.map(({ _id, revenue }) => revenue)
    };
        console.log("analytics", analytics)
       console.log("Revenue Graph:", revenueGraph);
    console.log("=== FINAL ANALYTICS ===");
    console.log(analytics);

    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

