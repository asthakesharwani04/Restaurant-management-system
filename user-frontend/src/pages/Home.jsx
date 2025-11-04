import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import CategoryList from "../components/CategoryList.jsx";
import MenuItem from "../components/MenuItem.jsx";
import { toast } from "react-toastify";
import searchIcon from "/icons/searchIcon.png";

const CATEGORIES_CONFIG = [
   { id: 'burger', label: 'Burger', icon: '🍔' },
  { id: 'pizza', label: 'Pizza', icon: '🍕' },
  { id: 'drink', label: 'Drink', icon: '🥤' },
  { id: 'french-fries', label: 'French fries', icon: '🍟' },
  { id: 'veggies', label: 'Veggies', icon: '🥗' },
  { id: 'desserts', label: 'Desserts', icon: '🍰' },
  { id: 'pasta', label: 'Pasta', icon: '🍝' }

];

const Home = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: "",
    phone: "",
    numberOfPersons: "2",
    address: "",
  });
  const [isEditingPhone, setIsEditingPhone] = useState(true);

  const observer = useRef();
  const navigate = useNavigate();

  // Load cart and user details from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    const savedUserDetails = localStorage.getItem("userDetails");
    if (savedUserDetails) {
      const details = JSON.parse(savedUserDetails);
      setUserDetails(details);
      setIsEditingPhone(false);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axiosClient.get("/api/menu/categories");
        console.log(data);
        // const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/menu/categories`);
        // const data1 = await res.json();
        // console.log(data1);
        setCategories(data.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // Fetch menu items with infinite scroll - MEMOIZED with useCallback
  const fetchMenuItems = useCallback(
    async (pageNum = 1, category = null, search = "") => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const params = { page: pageNum, limit: 20 };
        if (category) params.category = category;
        if (search) params.search = search;

        const { data } = await axiosClient.get("/api/menu", { params });

        if (pageNum === 1) {
          setMenuItems(data.data || []);
        } else {
          setMenuItems((prev) => [...prev, ...(data.data || [])]);
        }

        setHasMore(data.pagination?.page < data.pagination?.pages);
      } catch (error) {
        console.error("Error fetching menu items:", error);
        toast.error("Failed to load menu items");
        setMenuItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    setPage(1);
    setMenuItems([]);
    fetchMenuItems(1, selectedCategory, searchTerm);
  }, [selectedCategory, searchTerm, fetchMenuItems]);

  // Infinite scroll - last element observer
  const lastMenuItemRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore]
  );

  // Load more items when page changes
  useEffect(() => {
    if (page > 1) {
      fetchMenuItems(page, selectedCategory, searchTerm);
    }
  }, [page, fetchMenuItems, selectedCategory, searchTerm]);

  // Handle search input
  const handleSearchChange = (e) => {
    e.preventDefault();
    const value = e.target.value;
    setSearchTerm(value);
    // Clear category when user starts typing
    if (value && selectedCategory) {
      setSelectedCategory(null);
    }
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    // Clear search when category is selected
    setSearchTerm("");
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  // Check if user exists by phone number
  const checkUserByPhone = async (phone) => {
    if (phone.length !== 10) return;

    try {
      const { data } = await axiosClient.get(`/api/users/phone/${phone}`);
      if (data.success) {
        setUserDetails({
          ...data.data,
          numberOfPersons: "2",
        });
        setIsEditingPhone(false);
        toast.success("Welcome back!");
      }
    } catch (error) {
      setIsEditingPhone(false);
    }
  };

  // Handle phone input
  const handlePhoneChange = (e) => {
    const phone = e.target.value.replace(/\D/g, "").slice(0, 10);
    setUserDetails({ ...userDetails, phone });

    if (phone.length === 10) {
      checkUserByPhone(phone);
    }
  };

  // Save user details
  const handleSaveDetails = () => {
    if (
      !userDetails.name ||
      !userDetails.phone ||
      !userDetails.numberOfPersons ||
      !userDetails.address
    ) {
      toast.error("Please fill all fields");
      return;
    }

    if (userDetails.phone.length !== 10) {
      toast.error("Please enter valid 10-digit phone number");
      return;
    }

    localStorage.setItem("userDetails", JSON.stringify(userDetails));
    setShowDetailsModal(false);
    toast.success("Details saved!");
  };

  // Add to cart
  const handleAddToCart = (item) => {
    if (!userDetails.name || !userDetails.phone || !userDetails.address) {
      setShowDetailsModal(true);
      toast.info("Please enter your details first");
      return;
    }

    const existingItem = cart.find((cartItem) => cartItem._id === item._id);

    if (existingItem) {
      if (existingItem.quantity >= item.stock) {
        toast.warning("Cannot add more, stock limit reached");
        return;
      }
      setCart((prev) =>
        prev.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
      toast.success("Quantity updated");
    } else {
      setCart((prev) => [...prev, { ...item, quantity: 1 }]);
      toast.success("Added to cart");
    }
  };

  // Go to checkout
  const handleNext = () => {
    if (!userDetails.name || !userDetails.phone || !userDetails.address) {
      setShowDetailsModal(true);
      toast.info("Please enter your details first");
      return;
    }

    if (cart.length === 0) {
      toast.warning("Please add items to cart");
      return;
    }

    console.log("Navigating to checkout with cart:", cart);
    navigate("/checkout", { state: { userDetails, cartData: cart } });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading && page === 1) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="user-app-new">
      {/* Header */}
      <div className="app-header-new">
        <div className="greeting">Good evening</div>
        <div className="subtitle">Place you order here</div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon">
            <img src={searchIcon} alt="" />
          </span>
          <input
            type="text"
            placeholder="Search"
            className="search-input"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Category Icons */}
      <div className="category-icons-flex">
        {CATEGORIES_CONFIG.map((cat) => (
          <div
            key={cat.id}
            className={`category-icon-box ${
              selectedCategory === cat.label ? "active" : ""
            }`}
            onClick={() => handleCategorySelect(cat.label)}
          >
            <div className="category-icon">
              <img src={cat.icon} alt="" />
            </div>
            <div className="category-label">{cat.label}</div>
          </div>
        ))}
      </div>

      {/* Current Category Title */}
      {selectedCategory && (
        <div className="current-category-title">{selectedCategory}</div>
      )}

      {/* User Details Modal/Card */}
      {showDetailsModal && (
        <div
          className="details-modal-overlay"
          onClick={() => setShowDetailsModal(false)}
        >
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Enter Your Details</h2>
            <form
              className="details-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveDetails();
              }}
            >
              <div className="form-field">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="full name"
                  value={userDetails.name}
                  onChange={(e) =>
                    setUserDetails({ ...userDetails, name: e.target.value })
                  }
                  disabled={!isEditingPhone && userDetails.name}
                />
              </div>

              <div className="form-field">
                <label>Number of Person</label>
                <input
                  type="text"
                  placeholder="2,4,6"
                  value={userDetails.numberOfPersons}
                  onChange={(e) =>
                    setUserDetails({
                      ...userDetails,
                      numberOfPersons: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label>Address</label>
                <input
                  type="text"
                  placeholder="address"
                  value={userDetails.address}
                  onChange={(e) =>
                    setUserDetails({ ...userDetails, address: e.target.value })
                  }
                  disabled={!isEditingPhone && userDetails.address}
                />
              </div>

              <div className="form-field">
                <label>Contact</label>
                <input
                  type="tel"
                  placeholder="phone"
                  value={userDetails.phone}
                  onChange={handlePhoneChange}
                  maxLength={10}
                />
              </div>

              <button type="submit" className="order-now-btn">
                Order Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="menu-items-container">
        {menuItems.length === 0 ? (
          <p className="no-items-msg">No items available</p>
        ) : (
          <div className="menu-items-grid-new">
            {menuItems.map((item, index) => {
              if (menuItems.length === index + 1) {
                return (
                  <div key={item._id} ref={lastMenuItemRef}>
                    <MenuItem item={item} onAddToCart={handleAddToCart} />
                  </div>
                );
              } else {
                return (
                  <MenuItem
                    key={item._id}
                    item={item}
                    onAddToCart={handleAddToCart}
                  />
                );
              }
            })}
          </div>
        )}
      </div>

      {loadingMore && (
        <div className="loading-more">
          <div className="spinner-small"></div>
          <p>Loading more...</p>
        </div>
      )}

      {/* Next Button */}
      <div className="next-button-container">
        <button className="next-btn" onClick={handleNext}>
          Next
          {cartCount > 0 && (
            <span className="cart-count-badge">{cartCount}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Home;
