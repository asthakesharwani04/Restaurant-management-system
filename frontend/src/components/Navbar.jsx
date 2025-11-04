import { useState } from 'react';


const Navbar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <nav className="navbar">
      
        
        <div className="navbar-search">
          <input
            type="text"
            placeholder="Filter..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
    
    </nav>
  );
};

export default Navbar;
