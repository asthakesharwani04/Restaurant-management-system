import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';
import timeIcon from '/icons/timeIcon.png'
import doneIcon from '/icons/doneIcon.png'
import knifeIcon from '/icons/knifeIcon.png'

const STATUS_COLORS = {
  pending: '#FFE3BC',
  processing: '#FFE3BC',
  done: '#B9F8C9'
};

const STATUS_TEXT_COLORS = {
  pending: '#D87300',
  processing: '#4682B4',
  done: '#228B22'
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/api/orders');
      setOrders(data.data || []);
    } catch (error) {
      toast.error(error.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProcessingTimes = useCallback(async () => {
    const activeOrders = orders.filter(
      order => order.status === 'processing' && order.processingTime > 0
    );

    const updates = activeOrders.map(order =>
      axiosClient.patch(`/api/orders/${order._id}/processing-time`).catch(err => 
        console.error('Error updating processing time:', err)
      )
    );

    await Promise.all(updates);
    fetchOrders();
  }, [orders, fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const interval = setInterval(updateProcessingTimes, 60000);
    return () => clearInterval(interval);
  }, [updateProcessingTimes]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axiosClient.patch(`/api/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStatusButton = (order) => {
    const { _id, status } = order;
    
    const buttons = {
      pending: (
        <button
          className="order-action-btn pending"
          onClick={() => handleStatusChange(_id, 'processing')}
        >
          Processing 
          <img src={timeIcon}/>
        </button>
      ),
      processing: (
        <button
          className="order-action-btn processing"
          onClick={() => handleStatusChange(_id, 'done')}
        >
          Done 
          <img src={doneIcon} alt="" />
        </button>
      ),
      done: (
        <button className="order-action-btn done" disabled>
          Done 
           <img src={doneIcon} alt="" />
        </button>
      )
    };

    return buttons[status] ?? null;
  };

  if (loading) return <Loader />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Order Line</h1>
      </div>

      {orders.length === 0 ? (
        <div className="no-data">No orders yet</div>
      ) : (
        <div className="orders-grid">
          {orders.map(order => (
            <div 
              key={order._id} 
              className="order-card"
              style={{ 
                backgroundColor: STATUS_COLORS[order.status] || '#f5f5f5'
              }}
            >
              {/* Card Header */}
              <div className="order-card-header">
                <div className="order-icon">
                  <img src={knifeIcon} alt="" />
                </div>
                <div className="order-id-badge">
                  # {order._id.slice(-4).toUpperCase()}
                </div>
              </div>

              {/* Order Type & Table */}
              <div className="order-type-section">
                <div className="order-type">
                  {order.orderType === 'dine-in' ? 'Dine In' : 'Takeaway'}
                </div>
                {order.orderType === 'dine-in' && (
                  <div className="order-table">
                    Table {order.tableNumber}
                  </div>
                )}
              </div>

              {/* Timing Info */}
              <div className="order-timing">
                <div className="timing-row">
                  <span className="timing-label">Order</span>
                  <span className="timing-value">
                    {new Date(order.createdAt).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="timing-row">
                  <span className="timing-label">Prep Time</span>
                  <span className="timing-value">{order.processingTime} min</span>
                </div>
              </div>

              {/* Items List */}
              <div className="order-items-section">
                <div className="items-header">Items ({order.items.length})</div>
                <div className="items-list">
                  {order.items.slice(0, 4).map((item, index) => (
                    <div key={index} className="item-row">
                      <span className="item-bullet">•</span>
                      <span className="item-name">{item.name}</span>
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="item-row">
                      <span className="item-bullet">•</span>
                      <span className="item-name">+{order.items.length - 4} more...</span>
                    </div>
                  )}
                </div>
              </div>

             

              {/* Action Button */}
              <div className="order-card-footer">
                {getStatusButton(order)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;