// user-frontend/src/pages/Checkout.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import searchIcon from '/icons/searchIcon.png'
import timeIcon from '/icons/timeIcon.png'
import deliveryIcon from '/icons/deliveryIcon.png'
import { useCallback } from 'react';

const Checkout = () => {
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [cookingInstructions, setCookingInstructions] = useState({});
  
  const swipeRef = useRef(null);
  const startX = useRef(0);
  const maxSwipeDistance = 200;
  const navigate = useNavigate();
  const location = useLocation();

  // Load cart and user details on mount
  useEffect(() => {
    console.log('Location state:', location.state); // Debug log

    // Get cart from navigation state or localStorage
    if (location.state?.cartData && Array.isArray(location.state.cartData) && location.state.cartData.length > 0) {
      console.log('Cart from navigation:', location.state.cartData);
      setCart(location.state.cartData);
    } else {
      const savedCart = localStorage.getItem('cart');
      console.log('Cart from localStorage:', savedCart);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            setCart(parsedCart);
          }
        } catch (error) {
          console.error('Error parsing cart:', error);
        }
      }
    }

    // Get user details
    if (location.state?.userDetails) {
      setUserDetails(location.state.userDetails);
    } else {
      const savedUserDetails = localStorage.getItem('userDetails');
      if (savedUserDetails) {
        try {
          setUserDetails(JSON.parse(savedUserDetails));
        } catch (error) {
          console.error('Error parsing user details:', error);
        }
      }
    }
  }, [location]);

  // Fetch available tables for dine-in
  useEffect(() => {
    if (orderType === 'dine-in') {
      const fetchTables = async () => {
        try {
          const { data } = await axiosClient.get('/api/tables/available');
          setTables(data.data || []);
        } catch (error) {
          toast.error('Failed to load tables');
        }
      };
      fetchTables();
    }
  }, [orderType]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

  // Update quantity
  const handleUpdateQuantity = (itemId, delta) => {
    setCart(prev => {
      const updated = prev.map(item => {
        if (item._id === itemId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity < 1) return item;
          if (newQuantity > item.stock) {
            toast.warning('Stock limit reached');
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      return updated;
    });
  };

  // Remove item
  const handleRemove = itemId => {
    setCart(prev => {
      const updated = prev.filter(item => item._id !== itemId);
      
      // Update localStorage
      if (updated.length > 0) {
        localStorage.setItem('cart', JSON.stringify(updated));
      } else {
        localStorage.removeItem('cart');
      }
      
      // Also remove cooking instructions
      setCookingInstructions(prevInst => {
        const newInstructions = { ...prevInst };
        delete newInstructions[itemId];
        return newInstructions;
      });
      
      toast.info('Item removed');
      return updated;
    });
  };

  // Open cooking instructions modal
  const openInstructionsModal = (itemId) => {
    setCurrentItemId(itemId);
    setShowInstructionsModal(true);
  };

  // Save cooking instructions
  const saveCookingInstructions = () => {
    const instruction = cookingInstructions[currentItemId] || '';
    if (instruction.trim()) {
      toast.success('Instructions added');
    }
    setShowInstructionsModal(false);
    setCurrentItemId(null);
  };

  // Swipe gesture handlers
  const handleTouchStart = e => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = e => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const distance = currentX - startX.current;
    
    if (distance > 0 && distance <= maxSwipeDistance) {
      setSwipeDistance(maxSwipeDistance);
    }
  };

  const handleTouchEnd = () => {;
    if (swipeDistance > maxSwipeDistance * 0.7) {
      handleSubmitOrder();
    }
    setSwipeDistance(0);
    setIsSwiping(false);
  };

  // Mouse events for desktop
  const handleMouseDown = e => {
    startX.current = e.clientX;
    setIsSwiping(true);
  };

  const handleMouseMove = useCallback( (e) => {
    if (!isSwiping) return;
    const currentX = e.clientX;
    const distance = currentX - startX.current;
    
    if (distance >= 0 && distance <= maxSwipeDistance) {
      setSwipeDistance(distance);
    } else if (distance > maxSwipeDistance) {
      setSwipeDistance(maxSwipeDistance);
    }
  },[maxSwipeDistance]);

  const handleMouseUp = useCallback(() => {
    if (swipeDistance > maxSwipeDistance * 0.7) {
      handleSubmitOrder();
    } else {
      setSwipeDistance(0);
    }
    setIsSwiping(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  },[swipeDistance, maxSwipeDistance]);

  // Cleanup mouse events
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Submit order
  const handleSubmitOrder = async () => {
    if (isSubmitting) return;

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!userDetails) {
      toast.error('User details not found');
      navigate('/');
      return;
    }

    if (orderType === 'dine-in' && !selectedTable) {
      toast.error('Please select a table');
      return;
    }

    setIsSubmitting(true);

    try {
      const items = cart.map(item => ({
        menuItemId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specialInstructions: cookingInstructions[item._id] || ''
      }));

      const orderData = {
        orderType,
        customerName: userDetails.name,
        customerPhone: userDetails.phone,
        items, 
        totalPrice,
        grandTotal,
        processingTime: 30 // Default value, will be recalculated by backend
      };

      if (orderType === 'dine-in') {
        orderData.tableNumber = parseInt(selectedTable);
        orderData.numberOfMembers = parseInt(userDetails.numberOfPersons || 2);
      } else {
        orderData.customerAddress = userDetails.address;
      }

      console.log('Order data to send:', orderData);

      const { data } = await axiosClient.post('/api/orders', orderData);
      
      // Clear cart and instructions
      setCart([]);
      setCookingInstructions({});
      localStorage.removeItem('cart');
      
      toast.success('Order placed successfully!');
      navigate('/thank-you', { 
        state: { 
          orderNumber: data.data._id,
          estimatedTime: data.data.processingTime 
        } 
      });
    } catch (error) {
      console.error('Order error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to place order';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharge = orderType === 'takeaway' ? 50 : 0;
  const taxes = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + deliveryCharge + taxes;

  // Show empty cart if no items
  if (!cart || cart.length === 0) {
    return (
      <div className="empty-cart-checkout">
        <div className="empty-cart-content">
          <h2>Your cart is empty</h2>
          <button className="browse-menu-btn" onClick={() => navigate('/')}>
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='checkout-container'>
       <div className="checkout-page-new">
      {/* Header */}
      <div className="checkout-header-new">
        <div className="greeting">Good evening</div>
        <div className="subtitle">Place you order here</div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon"><img src={searchIcon} alt="" /></span>
          <input 
            type="text" 
            placeholder="Search" 
            className="search-input"
          />
        </div>
      </div>

      {/* Cart Items */}
      <div className="checkout-cart-section">
        {cart.map(item => (
          <div key={item._id} className="checkout-cart-item">
            <div className="cart-item-image">
              <div className="food-placeholder">
                <img 
    src={`${import.meta.env.VITE_API_BASE_URL}${item.image}`} 
    alt={item.name}
    className="cart-item-img"
  />
              </div>
            </div>
            <div className="cart-item-details">
              <h3>{item.name}</h3>
              <p className="item-price">₹ {item.price}</p>
              <div className="quantity-controls-checkout">
                <button 
                  className="qty-btn-checkout"
                  onClick={() => handleUpdateQuantity(item._id, -1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="quantity-display">{item.quantity}</span>
                <button 
                  className="qty-btn-checkout"
                  onClick={() => handleUpdateQuantity(item._id, 1)}
                  disabled={item.quantity >= item.stock}
                >
                  +
                </button>
              </div>
              <button 
                className="add-instructions-btn"
                onClick={() => openInstructionsModal(item._id)}
              >
                {cookingInstructions[item._id] 
                  ? '✓ Instructions added' 
                  : 'Add cooking Instructions (optional)'}
              </button>
            </div>
            <button 
              className="remove-item-btn"
              onClick={() => handleRemove(item._id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Order Type Selection */}
      <div className="order-type-section-new">
        <button
          className={`order-type-btn ${orderType === 'dine-in' ? 'active' : ''}`}
          onClick={() => setOrderType('dine-in')}
        >
          Dine In
        </button>
        <button
          className={`order-type-btn ${orderType === 'takeaway' ? 'active' : ''}`}
          onClick={() => setOrderType('takeaway')}
        >
          Take Away
        </button>
      </div>

      {/* Table Selection for Dine-in */}
      {orderType === 'dine-in' && (
        <div className="table-selection-section">
          <select
            value={selectedTable}
            onChange={e => setSelectedTable(e.target.value)}
            className="table-select"
          >
            <option value="">Choose a table</option>
            {tables.map(table => (
              <option key={table._id} value={table.tableNumber}>
                Table {table.tableNumber} ({table.size} seats)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Billing Section */}
      <div className="billing-section">
        <div className="billing-row">
          <span>Item Total</span>
          <span>₹{totalPrice.toFixed(2)}</span>
        </div>
        {orderType === 'takeaway' && (
          <div className="billing-row">
            <span>Delivery Charge</span>
            <span>₹{deliveryCharge.toFixed(2)}</span>
          </div>
        )}
        <div className="billing-row">
          <span>Taxes</span>
          <span>₹{taxes.toFixed(2)}</span>
        </div>
        <div className="billing-row grand-total">
          <span>Grand Total</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* User Details */}
      {userDetails && (
        <div className="user-details-section">
          <h3>Your details</h3>
          <p className="user-name">{userDetails.name}, {userDetails.phone}</p>
          <div className="delivery-info">
            <span className="delivery-icon"><img src={deliveryIcon} alt="" /></span>
            <p>
              {orderType === 'dine-in' 
                ? `Dine-in - Table ${selectedTable || 'not selected'}`
                : `Delivery to: ${userDetails.address}`
              }
            </p>
          </div>
          <p className="delivery-time"><img src={timeIcon} alt="" className='timeicon'/>Delivery in 42 mins</p>
        </div>
      )}

      {/* Swipe to Order */}
      <div className="swipe-to-order-section">
        <div
          ref={swipeRef}
          className="swipe-container-new"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          // onMouseMove={handleMouseMove}
          // onMouseUp={handleMouseUp}
          // onMouseLeave={handleMouseUp}
        >
          <div
            className="swipe-button-new"
            style={{ 
              transform: `translateX(${swipeDistance}px)`,
              transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            <span className="swipe-arrow">→</span>
          </div>
          <div className="swipe-text-new">
            {isSubmitting ? 'Processing...' : 'Swipe to Order'}
          </div>
          <div 
            className="swipe-progress"
            style={{
              width: `${(swipeDistance / maxSwipeDistance) * 100}%`,
              transition: isSwiping ? 'none' : 'width 0.3s ease-out'
            }}
          />
        </div>
        
        {/* Desktop fallback button */}
        <button
          className="desktop-order-button"
          onClick={handleSubmitOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>

      {/* Cooking Instructions Modal */}
      {showInstructionsModal && (
        <div className="instructions-modal-overlay" onClick={() => setShowInstructionsModal(false)}>
          <div className="instructions-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close-btn"
              onClick={() => setShowInstructionsModal(false)}
            >
              ✕
            </button>
            <h2>Add Cooking instructions</h2>
            <textarea
              className="instructions-textarea"
              placeholder="Enter your cooking instructions here..."
              value={cookingInstructions[currentItemId] || ''}
              onChange={e => setCookingInstructions(prev => ({
                ...prev,
                [currentItemId]: e.target.value
              }))}
              rows={6}
              autoFocus
            />
            <p className="instructions-note">
              The restaurant will try its best to follow your request. However, refunds or cancellations in this regard won't be possible.
            </p>
            <div className="instructions-modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowInstructionsModal(false)}
              >
                Cancel
              </button>
              <button 
                className="next-btn-modal"
                onClick={saveCookingInstructions}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default Checkout;