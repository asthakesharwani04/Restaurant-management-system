import React, { useState, useEffect, useCallback } from "react";
import RevenueChart from "../components/RevenueChart";
import OrderDistributionChart from "../components/OrderDistributionChart";
import axios from "../api/axiosClient";
import Tchef from "../assets/Tchef.png";
import Tclients from "../assets/Tclients.png";
import Torders from "../assets/Torders.png";
import Trevenue from "../assets/Trevenue.png";

const DEFAULT_CHEFS = [
  { name: "Ranveer", ordersAssigned: 0 },
  { name: "Advik", ordersAssigned: 0 },
  { name: "Nikita", ordersAssigned: 0 },
  { name: "Sumit", ordersAssigned: 0 }
];

const DEFAULT_TABLES = Array.from({ length: 30 }, (_, i) => ({
  tableNumber: i + 1,
  isReserved: false
}));

function Home() {
  const [search, setSearch] = useState("");
  const [analytics, setAnalytics] = useState({
    totalChefs: 4, totalRevenue: "0K", totalOrders: 0, totalClients: 0
  });
  const [revenueRange, setRevenueRange] = useState("daily");
  const [revenueData, setRevenueData] = useState([]);
  const [orderSummary, setOrderSummary] = useState({ served: 0, dineIn: 0, takeAway: 0 });
  const [tables, setTables] = useState(DEFAULT_TABLES);
  const [chefs, setChefs] = useState(DEFAULT_CHEFS);
  const [loading, setLoading] = useState(false);

  // FIXED: Improved search matching logic
  const searchLower = search.toLowerCase().trim();
  
  // Check if search term matches any keywords for each section
  const analyticsMatches = searchLower === "" || 
    ["chef", "revenue", "order", "client", "total", "analytic"].some(keyword =>
      keyword.includes(searchLower) || searchLower.includes(keyword)
    );
  
  const orderSummaryMatches = searchLower === "" ||
    ["order", "summary", "distribution", "served", "takeaway", "take", "away", "dine", "pie", "chart"].some(keyword =>
      keyword.includes(searchLower) || searchLower.includes(keyword)
    );
  
  const revenueChartMatches = searchLower === "" ||
    ["revenue", "chart", "graph", "bar", "daily", "monthly", "yearly"].some(keyword =>
      keyword.includes(searchLower) || searchLower.includes(keyword)
    );
  
  const tablesMatches = searchLower === "" ||
    ["table", "reserved", "available", "reserve"].some(keyword =>
      keyword.includes(searchLower) || searchLower.includes(keyword)
    );

  //  Blur if search is active AND section doesn't match
  const shouldBlur = (matches) => searchLower !== "" && !matches;

  // Use useCallback to memoize the function and prevent unnecessary re-renders
  const handleRefresh = useCallback(async (range = revenueRange) => {
    setLoading(true);
    try {
      const filterMap = { daily: "daily", monthly: "monthly", yearly: "yearly" };
      const res = await axios.get(`/api/orders/stats?filter=${filterMap[range] || "daily"}`);
      console.log("API /orders/stats response:", res);

      const payload = res.data?.data ?? res.data;

      if (!payload) {
        console.warn("No payload found at res.data.data or res.data. Check API shape.");
        setLoading(false);
        return;
      }

      // Update analytics
      setAnalytics({
        totalChefs: payload.totalChefs ?? 4,
        totalRevenue: payload.totalRevenue ?? "0K",
        totalOrders: Number(payload.totalOrders ?? 0),
        totalClients: Number(payload.totalClients ?? 0)
      });

      // Update revenue graph
      const revGraph = Array.isArray(payload.revenueGraph)
        ? payload.revenueGraph.map(item => {
            if (typeof item === "object" && item !== null) return Number(item.revenue) || 0;
            return Number(item) || 0;
          })
        : [];
      setRevenueData(revGraph);

      // Update order summary
      const os = payload.orderSummary ?? {};
      setOrderSummary({
        served: Number(os.served ?? 0),
        dineIn: Number(os.dineIn ?? 0),
        takeAway: Number(os.takeAway ?? 0)
      });

      // Update tables
      let updatedTables = [...DEFAULT_TABLES];
      if (Array.isArray(payload.tables)) {
        payload.tables.forEach(table => {
          const idx = (table.tableNumber ?? 1) - 1;
          if (idx >= 0 && idx < 30) updatedTables[idx].isReserved = !!table.isReserved;
        });
      }
      setTables(updatedTables);

      // Update chefs with API data
      if (Array.isArray(payload.chefs) && payload.chefs.length > 0) {
        setChefs(payload.chefs.map(chef => ({
          name: chef.name,
          ordersAssigned: Number(chef.ordersAssigned ?? 0)
        })));
      } else {
        setChefs(DEFAULT_CHEFS);
      }
    } catch (err) {
      console.error("handleRefresh error:", err);
    } finally {
      setLoading(false);
    }
  }, [revenueRange]);

  // Initial fetch on mount
  useEffect(() => {
    handleRefresh();
  }, []);

  // Fetch when revenue range changes
  useEffect(() => {
    handleRefresh(revenueRange);
  }, [revenueRange, handleRefresh]);

  return (
    <div>
      <div className="dashboard">
        {/* Search bar in existing toolbar */}
        <div className="navbar">
            <div className="navbar-search">
            <input
              type="text"
              placeholder="filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        <div className="main-area">

          {/* Analytics Cards Row */}
          <div
            className={`analytics-section ${shouldBlur(analyticsMatches) ? "blurred" : ""}`}
          >
            <div className="analytics-cards">
              <div className={`analytics-card  ${shouldBlur(analyticsMatches) ? "blurred" : ""}`}>
                <div className="card-value">
                  <img src={Tchef} alt="tchef" className="card-number" />
                  {analytics.totalChefs}
                </div>
                <div className="card-label">TOTAL CHEF</div>
              </div>
              <div className={`analytics-card  ${shouldBlur(analyticsMatches) ? "blurred" : ""}`}>
                <div className="card-value">
                  <img src={Tclients} alt="tclients" className="card-number" />
                  {analytics.totalRevenue}
                </div>
                <div className="card-label">TOTAL REVENUE</div>
              </div>
              <div className={`analytics-card  ${shouldBlur(analyticsMatches) ? "blurred" : ""}`}>
                <div className="card-value">
                  <img src={Torders} alt="torders" className="card-number" />
                  {analytics.totalOrders}
                </div>
                <div className="card-label">TOTAL ORDERS</div>
              </div>
              <div className={`analytics-card  ${shouldBlur(analyticsMatches) ? "blurred" : ""}`}>
                <div className="card-value">
                  <img src={Trevenue} alt="trevenue" className="card-number" />
                  {analytics.totalClients}
                </div>
                <div className="card-label">TOTAL CLIENTS</div>
              </div>
            </div>
          </div>

          {/* Analytics Section Row 2: Order Chart, Revenue Chart, Tables */}
          <div className="charts-section">
            <div className={shouldBlur(orderSummaryMatches) ? "blurred" : ""}>
              <OrderDistributionChart {...orderSummary} />
            </div>
            <div
              id="revenue-section"
              className={shouldBlur(revenueChartMatches) ? "blurred" : ""}
            >
              <div className="revenue-chart-dropdown">
                <span style={{ fontWeight: 600, fontSize: 17 }}>Revenue</span>
                <select
                  className="order-summary-filter"
                  value={revenueRange}
                  onChange={(e) => setRevenueRange(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="revenue-chart-section">
                <RevenueChart data={revenueData} range={revenueRange} />
              </div>
            </div>
            <div
              id="table-card"
              className={shouldBlur(tablesMatches) ? "blurred" : ""}
            >
              <div className="tables-widget">
                <h3 className="widget-title">Tables</h3>
                <div className="status-indicators">
                  <span className="status-dot reserved"></span>
                  <span className="status-label">Reserved</span>
                  <span className="status-dot available"></span>
                  <span className="status-label">Available</span>
                </div>

                <hr />
                <div className="tables-grid ">
                  {tables.map((table, idx) => (
                    <div
                      key={table.tableNumber}
                      className={`table-item ${
                        table.isReserved ? "reserved" : "available"
                      }`}
                    >
                      Table
                      <br />
                      {String(table.tableNumber).padStart(2, "0")}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Chef Orders Table Row - NEVER BLURRED */}
          <div className="chef-table-section">
            <table className="chef-table">
              <thead>
                <tr>
                  <th>Chef Name</th>
                  <th>Order Taken</th>
                </tr>
              </thead>
              <tbody>
                {chefs.map((chef, idx) => (
                  <tr key={idx}>
                    <td>{chef.name}</td>
                    <td>{String(chef.ordersAssigned).padStart(2, "0")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default Home;