import { useState, useEffect, useCallback, useMemo } from 'react';
import axiosClient from '../api/axiosClient';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const CATEGORIES = ['Burger', 'Pizza', 'Drink', 'French fries', 'Veggies', 'Salads', 'Pasta', 'Sandwiches', 'Desserts'];

const INITIAL_FORM_STATE = {
  name: '',
  description: '',
  price: '',
  averagePreparationTime: '',
  category: 'Burger',
  stock: ''
};

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState([]); // Store all items
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Get dynamic image URL from environment variable
  const getImageUrl = (imagePath) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const cleanBaseURL = baseURL.replace('/api', '');
    return `${cleanBaseURL}${imagePath}`;
  };

  // Fetch all menu items ONCE on component mount
  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/api/menu');
      const items = data.data || [];
      setAllMenuItems(items); // Store all items
      setMenuItems(items); // Display all items initially
    } catch (error) {
      toast.error(error.message);
      setAllMenuItems([]);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, []); 

  // Initial fetch on mount
  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Client-side filtering 
  const filteredMenuItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return allMenuItems; // Show all if search is empty
    }

    const searchLower = searchTerm.toLowerCase().trim();
    
    return allMenuItems.filter(item => {
      // Search by name (case-insensitive)
      return item.name.toLowerCase().includes(searchLower);
    });
  }, [searchTerm, allMenuItems]);

  // Update displayed items when filter changes
  useEffect(() => {
    setMenuItems(filteredMenuItems);
  }, [filteredMenuItems]);

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!selectedImage) {
      toast.error('Please select an image');
      return;
    }

    try {
      const formDataToSend = new FormData();
      const numericFields = ['price', 'averagePreparationTime', 'stock'];
      
      Object.keys(formData).forEach(key => {
        let value = formData[key];
        if (numericFields.includes(key)) {
          value = Number(value);
        }
        formDataToSend.append(key, value);
      });
      
      formDataToSend.append('image', selectedImage);

      await axiosClient.post('/menu', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Menu item added successfully');
      resetForm();
      fetchMenuItems(); // Refresh all items after adding
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setSelectedImage(null);
    setImagePreview(null);
    setShowModal(false);
  };

  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <Loader />;

  return (
    <div className="page-container menu-board">
      {/* Search Bar */}
      <div className="menu-search-container">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="menu-search-input"
        />
      </div>

      {/* Menu Items Grid */}
      <div className="menu-items-grid">
        {menuItems.length === 0 ? (
          <p className="no-data">
            {searchTerm 
              ? `No menu items found matching "${searchTerm}"`
              : 'No menu items found'}
          </p>
        ) : (
          menuItems.map(item => (
            <div key={item._id} className="menu-item-card">
              <div className="menu-item-image">
                <img 
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  onError={e => e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'}
                />
              </div>
              <div className="menu-item-details">
                <div className="menu-item-row">
                  <strong>Name:</strong> {item.name}
                </div>
                <div className="menu-item-row">
                  <strong>Description:</strong> {item.description}
                </div>
                <div className="menu-item-row">
                  <strong>Price:</strong> ₹{item.price}
                </div>
                <div className="menu-item-row">
                  <strong>Average Prep Time:</strong> {item.averagePreparationTime} Mins
                </div>
                <div className="menu-item-row">
                  <strong>Category:</strong> {item.category}
                </div>
                <div className="menu-item-row">
                  <strong>InStock:</strong> {item.stock > 0 ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Create Button */}
      <button className="btn-create-item" onClick={() => setShowModal(true)}>
        + Create New Item
      </button>

      {/* Add Item Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal modal-add-item" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Menu Item</h2>
              <button className="modal-close" onClick={resetForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter item name"
                  value={formData.name}
                  onChange={e => updateFormField('name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  required
                  placeholder="Enter item description"
                  value={formData.description}
                  onChange={e => updateFormField('description', e.target.value)}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="199"
                    value={formData.price}
                    onChange={e => updateFormField('price', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Prep Time (min) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="20"
                    value={formData.averagePreparationTime}
                    onChange={e => updateFormField('averagePreparationTime', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => updateFormField('category', e.target.value)}
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="10"
                    value={formData.stock}
                    onChange={e => updateFormField('stock', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image * (Max 2MB, JPG/PNG only)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageChange}
                  required
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
