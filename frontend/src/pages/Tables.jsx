import { useState, useEffect, useCallback, useRef } from "react";
import axiosClient from "../api/axiosClient";
import Loader from "../components/Loader";
import { toast } from "react-toastify";
import deleteIcon from "../assets/deleteIcon.png"
import chairIcon from "../assets/chairIcon.png"

const TABLE_SIZES = [2, 4, 6, 8];
const MAX_TABLES = 30;

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
 
  const [formData, setFormData] = useState({ size: 2, name: "" });

  const formRef = useRef(null);

  // Close the form if click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setShowModal(false);
      }
    }

    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal]);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get("/api/tables");
      setTables(Array.isArray(data.tables) ? data.tables : []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch tables");
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleShowForm = () => {
    // FIXED: Reset to default values with consistent property name
    setFormData({ size: 2, name: "" });
    setShowModal(true);
  };

  const handleAddTable = async (e) => {
    e.preventDefault();

    if (tables.length >= MAX_TABLES) {
      toast.error(`Maximum ${MAX_TABLES} tables allowed`);
      return;
    }

    // FIXED: Validate size
    if (!formData.size || formData.size < 1 || formData.size > 8) {
      toast.error("Please select a valid number of chairs (1-8)");
      return;
    }

    try {
      console.log('Submitting table data:', formData); // Debug log
      
      await axiosClient.post("/api/tables", {
        size: Number(formData.size), 
        name: formData.name || "",
      });
      
      toast.success("Table added successfully");
      setFormData({ size: 2, name: "" });
      setShowModal(false);
      fetchTables();
    } catch (error) {
      console.error('Add table error:', error);
      toast.error(error.response?.data?.message || error.message || "Failed to add table");
    }
  };

  const handleDeleteTable = async (id) => {
    const table = tables.find((t) => t._id === id);

    if (!table) {
      toast.error("Table not found");
      return;
    }

    if (table.isReserved) {
      toast.error("Cannot delete reserved table");
      return;
    }

    if (!window.confirm("Are you sure? This will reshuffle all table numbers."))
      return;

    try {
      await axiosClient.delete(`/api/tables/${id}`);
      toast.success("Table deleted and numbers reshuffled");
      fetchTables();
    } catch (error) {
      toast.error(error.message || "Failed to delete table");
    }
  };

  const handleReleaseTable = async (id) => {
    try {
      await axiosClient.patch(`/api/tables/${id}/release`);
      toast.success("Table released");
      fetchTables();
    } catch (error) {
      toast.error(error.message || "Failed to release table");
    }
  };

  if (loading) return <Loader />;

  const isMaxTables = tables.length >= MAX_TABLES;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Tables</h1>
      </div>

      <div className="tables-grid2">
        {tables.length === 0 ? (
          <p className="no-data">
            No tables available. Click "Add Table" to create one.
          </p>
        ) : (
          tables.map((table) => (
            <div
              key={table._id}
              className={`table-card2 ${
                table.isReserved ? "reserved" : "available"
              }`}
            >
              {table.isReserved ? (
                <button
                  className="btn-small btn-warning"
                  onClick={() => handleReleaseTable(table._id)}
                >
                  
                </button>
              ) : (
                <button
                  className="btn-small btn-delete"
                  onClick={() => handleDeleteTable(table._id)}
                >
                  <img src={deleteIcon} alt="" />
                </button>
              )}
              <div className="table-card-header">
                <div className="table-number">Table 
                  <div id="table-num">{table.tableNumber}</div>
                </div>

                <div className="table-card-body">
                  {table.name && <div className="table-name">{table.name}</div>}

                  {table.isReserved ? (
                    <div className="reservation-info">
                      <div className="info-item">
                        {/* <small> {table.numberOfMembers || 0}</small> */}
                      </div>
                    </div>
                  ) : (
                    <div className="available-info">
                      <br />
                    </div>
                  )}
                </div>
              </div>
              <div className="table-size">
                <img src={chairIcon}/> 0{table.size}
              </div>
            </div>
          ))
        )}
      
        {/* Add Table placeholder box */}
        {tables.length < MAX_TABLES && (
          <div className="table-card2 table-add-placeholder" onClick={() => setShowModal(true)}>
            <div className="plus-icon">+</div>
            {showModal && (
              <div className="table-add-form-pop" ref={formRef}>
                <form onSubmit={handleAddTable}>
                  <div className="add-table-fields">
                    <label>
                      Table Name (optional)
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Window Table"
                        style={{ marginLeft: 8, marginTop: 10, width: 120 }}
                      />
                    </label>
                    <label style={{ marginTop: 10 }}>
                      Chairs:
                      <br />
                      <select
                        value={formData.size}
                        onChange={e => {
                          let newSize = Number(e.target.value);
                          
                          // Auto-convert odd numbers to even (add 1)
                          if (newSize % 2 !== 0) {
                            newSize = newSize + 1;
                          }
                        
                          setFormData({ ...formData, size: newSize });
                        }}
                        className="chair-add"
                      >
                        {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="add-table-actions" style={{ marginTop: 12 }}>
                    <button type="submit" className="btn-add">
                      Create
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tables;