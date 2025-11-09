import { useState, useEffect, useCallback } from "react";
import axiosClient from "../api/axiosClient";
import Loader from "../components/Loader";
import { toast } from "react-toastify";
import knifeIcon from "/icons/knifeIcon.png";


const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get("/api/orders");
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
      (order) => order.status === "processing" && order.processingTime > 0
    );

    const updates = activeOrders.map((order) =>
      axiosClient
        .patch(`/api/orders/${order._id}/processing-time`)
        .catch((err) => console.error("Error updating processing time:", err))
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
      await axiosClient.patch(`/api/orders/${orderId}/status`, {
        status: newStatus,
      });
      toast.success("Order status updated");
      fetchOrders();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Get card styling based on order type and status
  const getCardClass = (order) => {
    if (order.status === "done") {
      return order.orderType === "dine-in"
        ? "order-card-done-dinein" 
        : "order-card-done-takeaway"; 
    }
    return "order-card-processing"; 
  };

  // Get status badge info
  const getStatusBadge = (order) => {
    if (order.status === "done") {
      if (order.orderType === "dine-in") {
        return { text: "Done", subtext: "Served", class: "status-done-dinein" };
      } else {
        return {
          text: "Take Away",
          subtext: "Not Picked up",
          class: "status-done-takeaway",
        };
      }
    }

    if (order.orderType === "dine-in") {
      return {
        text: "Dine In",
        subtext: `Ongoing: ${order.processingTime} Min`,
        class: "status-processing-dinein",
      };
    } else {
      return {
        text: "Dine In",
        subtext: `Ongoing: ${order.processingTime} Min`,
        class: "status-processing-takeaway",
      };
    }
  };

  // Get button config
  const getButtonConfig = (order) => {
    if (order.status === "pending") {
      return {
        text: "Processing",
        icon: "⏱",
        onClick: () => handleStatusChange(order._id, "processing"),
        class: "btn-start-processing",
      };
    }

    if (order.status === "processing") {
      return {
        text: "Order Done",
        icon: "✓",
        onClick: () => handleStatusChange(order._id, "done"),
        class: "btn-mark-done",
      };
    }

    // Done status
    return {
      text: "Order Done",
      icon: "✓",
      onClick: null,
      class:
        order.orderType === "dine-in" ? "btn-done-dinein" : "btn-done-takeaway",
    };
  };

  if (loading) return <Loader />;

  return (
    <div>
        <div className="page-header">
        <h1>Order Line</h1>
      </div>

      <div className="page-container">
      
      {orders.length === 0 ? (
        <div className="no-data">No orders yet</div>
      ) : (
        <div className="orders-grid-redesign">
          {orders.map((order) => {
            const statusBadge = getStatusBadge(order);
            const buttonConfig = getButtonConfig(order);

            return (
              <div
                key={order._id}
                className={`order-card-redesign ${getCardClass(order)}`}
              >
                {/* Card Header */}
                <div className="order-card">
                  <div className="order-card-header-redesign">
                    <div className="order-header-left">
                     
                        <span className="order-icon-redesign">
                          <img src={knifeIcon} alt="" />
                        </span>
                        <span className="order-id-redesign">
                          # {order._id.slice(-3)}
                        </span>
                      
                      <div
                        className={`order-status-badge-redesign ${statusBadge.class}`}
                      >
                        <div className="status-main">{statusBadge.text}</div>
                        <div className="status-sub">{statusBadge.subtext}</div>
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="order-meta-summary">
                      {order.orderType === "dine-in" && (
                        <div className="table-no">
                          Table-{String(order.tableNumber).padStart(2, "0")}
                        </div>
                      )}
                      <div className="order-time">
                        {new Date(order.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </div>

                      <div className="order-items-count">
                        {order.items.length} Item
                        {order.items.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="order-info-redesign">
                    <div className="order-items-list-redesign">
                      {order.items.map((item, index) => (
                        <div key={index} className="order-item-row-redesign">
                          <span className="item-quantity-redesign">
                            {item.quantity} x
                          </span>
                          <span className="item-name-redesign">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Action Button */}
                  <div className="processing-btn">
                    <button
                      className={`order-action-btn-redesign ${buttonConfig.class}`}
                      onClick={buttonConfig.onClick}
                      disabled={!buttonConfig.onClick}
                    >
                      {buttonConfig.text} {buttonConfig.icon}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
      </div>
    
  );
};

export default Orders;
