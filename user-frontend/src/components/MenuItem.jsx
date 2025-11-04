// user-frontend/src/components/MenuItem.jsx
const MenuItem = ({ item, onAddToCart }) => {
  const isOutOfStock = item.stock <= 0;

  return (
    <div className={`menu-card-new ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <div className="menu-card-image">
        <div className="menu-item-image-new">
        <img 
          src={`${import.meta.env.VITE_API_BASE_URL}${item.image}`} 
          alt={item.name}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
          }}
        />
      </div>
      </div>
      <div className="menu-card-info">
        <h3 className="menu-card-title">{item.name}</h3>
        <div className="menu-card-footer">
          <span className="menu-card-price">₹ {item.price}</span>
          {!isOutOfStock && (
            <button className="add-icon-btn" onClick={() => onAddToCart(item)}>
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItem;
