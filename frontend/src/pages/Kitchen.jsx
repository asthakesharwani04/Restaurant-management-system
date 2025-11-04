import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/orders');
      setOrders(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time countdown - updates every second
  useEffect(() => {
    const interval = setInterval(async () => {
      const activeOrders = orders.filter(
        order => order.status === 'processing' && order.processingTime > 0
      );

      if (activeOrders.length > 0) {
        const updates = activeOrders.map(order =>
          axiosClient.patch(`/orders/${order._id}/processing-time`).catch(err =>
            console.error('Error updating processing time:', err)
          )
        );

        await Promise.all(updates);
        fetchOrders();
      }
    }, 60000); // Update every minute (change to 1000 for every second in production)

    return () => clearInterval(interval);
  }, [orders, fetchOrders]);

  const getOrderCardClass = order => {
    if (order.status === 'done') {
      return order.orderType === 'takeaway' ? 'order-card-takeaway-done' : 'order-card-done';
    }
    return order.orderType === 'dine-in' ? 'order-card-dine-in' : 'order-card-takeaway';
  };

  const getStatusBadge = order => {
    if (order.status === 'done') {
      return {
        text: order.orderType === 'takeaway' ? 'Take Away\nNot Picked up' : 'Done\nServed',
        icon: '✓',
        class: 'status-done'
      };
    }
    
    return {
      text: order.orderType === 'dine-in' 
        ? `Dine In\nOngoing: ${order.processingTime} Min`
        : `Take Away\nNot Picked up`,
      icon: '⏱',
      class: 'status-processing'
    };
  };

  const getOrderTypeText = order => {
    if (order.orderType === 'dine-in') {
      return `Table-${order.tableNumber}`;
    }
    return 'Take Away';
  };

  const formatTime = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) return <Loader />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Order Line</h1>
        <button className="btn-primary" onClick={fetchOrders}>
          🔄 Refresh
        </button>
      </div>

      <div className="kitchen-grid">
        {orders.length === 0 ? (
          <p className="no-data">No orders in kitchen</p>
        ) : (
          orders.map(order => {
            const statusBadge = getStatusBadge(order);
            
            return (
              <div key={order._id} className={`kitchen-card ${getOrderCardClass(order)}`}>
                {/* Card Header */}
                <div className="kitchen-card-header">
                  <div className="kitchen-card-title">
                    <span className="kitchen-icon">🍽️</span>
                    <span className="kitchen-order-id">#{order.orderId || order._id.slice(-6)}</span>
                  </div>
                  
                  <div className={`kitchen-status-badge ${statusBadge.class}`}>
                    <div className="status-badge-text">
                      {statusBadge.text.split('\n').map((line, idx) => (
                        <div key={idx}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="kitchen-card-info">
                  <div className="kitchen-info-item">
                    <strong>{getOrderTypeText(order)}</strong>
                  </div>
                  <div className="kitchen-info-item">
                    {formatTime(order.createdAt)}
                  </div>
                  <div className="kitchen-info-item">
                    <strong>{order.items.length} Item</strong>
                  </div>
                </div>

                {/* Items List */}
                <div className="kitchen-items-list">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="kitchen-item">
                      <span className="item-quantity">{item.quantity}x</span>
                      <span className="item-name">{item.name}</span>
                    </div>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="kitchen-card-footer">
                  <button 
                    className={`kitchen-status-btn ${
                      order.status === 'done' ? 'btn-done' : 'btn-processing'
                    }`}
                  >
                    {order.status === 'done' ? (
                      <>Order Done ✓</>
                    ) : (
                      <>Processing ⏱</>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Kitchen;