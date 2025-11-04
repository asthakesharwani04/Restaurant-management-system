import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = ["#5b5b5b", "#2c2c2c", "#828282"];

const OrderDistributionChart = ({ served = 0, dineIn = 0, takeAway = 0 }) => {
  const data = [
    { name: "Served", value: served },
    { name: "Dine In", value: dineIn },
    { name: "Take Away", value: takeAway }
  ];
  const total = served + dineIn + takeAway;
  function percent(val) { return total === 0 ? 0 : Math.round((val / total) * 100); }
  return (
    <div className="order-summary-card">
      <div className="order-summary-header">
        <h3 className="order-summary-title">Order Summary</h3>
        <select className="order-summary-filter" >
          <option>Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
          <option value="Yearly">Yearly</option>
        </select>
      </div>
      <div className="hr-line"/>
      <div className="order-summary-stats">
        <div className="stat-box"><div className="stat-value">{String(served).padStart(2, "0")}</div><div className="stat-label">Served</div></div>
        <div className="stat-box"><div className="stat-value">{String(dineIn).padStart(2, "0")}</div><div className="stat-label">Dine In</div></div>
        <div className="stat-box"><div className="stat-value">{String(takeAway).padStart(2, "0")}</div><div className="stat-label">Take Away</div></div>
      </div>
      <div className="order-summary-chart-section">
        <div className="order-summary-doughnut">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                startAngle={90} endAngle={-270}
                innerRadius={40} outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={false}
              >
                {data.map((entry, idx) => (
                  <Cell key={entry.name} fill={COLORS[idx]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="order-summary-progress-bars">
          {data.map((d, idx) => (
            <div className="progress-item" key={d.name}>
              <div className="progress-label">
                <span>{d.name}</span>
                <span className="progress-percentage">({percent(d.value)}%)</span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${percent(d.value)}%`, background: COLORS[idx] }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default OrderDistributionChart;


//  '#828282',
//           '#2C2C2C',
//           '#5B5B5B'