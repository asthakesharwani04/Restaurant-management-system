import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const MAX_CHEFS = 4;
const INITIAL_FORM_STATE = { name: '', status: 'active' };

const Chefs = () => {
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChef, setEditingChef] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const fetchChefs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/api/chefs');
      setChefs(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChefs();
  }, [fetchChefs]);

  const handleSubmit = async e => {
    e.preventDefault();
    
    const activeChefs = chefs.filter(c => c.status === 'active').length;
    if (!editingChef && activeChefs >= MAX_CHEFS) {
      toast.error(`Maximum ${MAX_CHEFS} active chefs allowed`);
      return;
    }

    try {
      const endpoint = editingChef ? `/chefs/${editingChef._id}` : '/chefs';
      const method = editingChef ? 'put' : 'post';
      
      await axiosClient[method](endpoint, formData);
      toast.success(`Chef ${editingChef ? 'updated' : 'added'}`);
      resetForm();
      fetchChefs();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = chef => {
    setEditingChef(chef);
    setFormData({ name: chef.name, status: chef.status });
    setShowModal(true);
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this chef?')) return;

    try {
      await axiosClient.delete(`/chefs/${id}`);
      toast.success('Chef deleted');
      fetchChefs();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingChef(null);
    setShowModal(false);
  };

  if (loading) return <Loader />;

  const activeChefs = chefs.filter(c => c.status === 'active');
  const isMaxChefs = activeChefs.length >= MAX_CHEFS;

  const assignmentRules = [
    'Orders are automatically assigned to chef with fewest orders',
    'If multiple chefs have same order count, assignment is random',
    'Chef order count decreases when order is completed'
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Chef Configuration</h1>
        <div className="header-info">
          <span className="chef-count">Active Chefs: {activeChefs.length}/{MAX_CHEFS}</span>
          <button 
            className="btn-primary" 
            onClick={() => setShowModal(true)}
            disabled={isMaxChefs}
          >
            ➕ Add Chef
          </button>
        </div>
      </div>

      <div className="info-box">
        <h3>Order Assignment Logic:</h3>
        <ul>
          {assignmentRules.map((rule, idx) => (
            <li key={idx}>✓ {rule}</li>
          ))}
        </ul>
      </div>

      <div className="chefs-grid">
        {chefs.length === 0 ? (
          <p className="no-data">No chefs available</p>
        ) : (
          chefs.map(chef => (
            <div key={chef._id} className={`chef-card ${chef.status}`}>
              <div className="chef-card-header">
                <div className="chef-avatar">👨‍🍳</div>
                <div className="chef-info">
                  <h3>{chef.name}</h3>
                  <span className={`status-badge ${chef.status}`}>
                    {chef.status}
                  </span>
                </div>
              </div>

              <div className="chef-card-body">
                <div className="chef-stat">
                  <span className="stat-label">Current Orders:</span>
                  <span className="stat-value">{chef.currentOrderCount}</span>
                </div>
              </div>

              <div className="chef-card-actions">
                <button className="btn-edit" onClick={() => handleEdit(chef)}>
                  ✏️ Edit
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => handleDelete(chef._id)}
                  disabled={chef.currentOrderCount > 0}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingChef ? 'Edit Chef' : 'Add New Chef'}</h2>
              <button className="modal-close" onClick={resetForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Chef Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter chef name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  {['active', 'inactive'].map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingChef ? 'Update' : 'Add'} Chef
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chefs;
