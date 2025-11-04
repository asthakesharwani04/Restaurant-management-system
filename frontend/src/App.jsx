import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { OrderProvider } from './context/OrderContext';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Tables from './pages/Tables';
import Orders from './pages/Orders';
import Menu from './pages/Menu';

function App() {
  return (
    <OrderProvider>
      <Router>
        <div className="app">
          <div className="app-body">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tables" element={<Tables />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/menu" element={<Menu />} />
              </Routes>
            </main>
          </div>
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </OrderProvider>
  );
}

export default App;