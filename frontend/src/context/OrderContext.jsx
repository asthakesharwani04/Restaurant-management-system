import { createContext, useState, useContext } from 'react';

const OrderContext = createContext();

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <OrderContext.Provider value={{ 
      orders, 
      setOrders, 
      refreshTrigger, 
      triggerRefresh 
    }}>
      {children}
    </OrderContext.Provider>
  );
};
