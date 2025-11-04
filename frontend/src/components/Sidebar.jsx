// frontend/src/components/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo2.png';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { 
      path: '/', 
      icon: '/icons/home.png' 
    },
    { 
      path: '/tables', 
      icon: '/icons/tables.png'
    },
    { 
      path: '/orders', 
      icon: '/icons/order.png' 
    },
    { 
      path: '/menu', 
      icon: '/icons/menu.png'
    }
  ];

  return (
    <div>
      <div className="navbar-container">
                <div className="navbar-logo">
                  <img src={logo} alt="Logo" />
                </div>
          </div>
       <aside className="sidebar">
      <div className="sidebar-menu">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-icon">
              <img 
                src={item.icon} 
                className="sidebar-icon-img"
              />
            </span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
    </div>
  );
};

export default Sidebar;