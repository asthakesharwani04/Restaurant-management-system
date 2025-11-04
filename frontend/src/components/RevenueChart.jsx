import React from "react";
import {
  BarChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

// Color utility: returns a more saturated blue for higher values
function getBarColor(value, max) {
  const minSaturation = 40;
  const maxSaturation = 90;
  const saturation =
    max === 0
      ? minSaturation
      : Math.round(minSaturation + ((value / max) * (maxSaturation - minSaturation)));
  return `hsl(220, ${saturation}%, 56%)`;
}

const RevenueChart = ({ data = [], range = "daily" }) => {
  // Format data and labels per range type
  let chartData = [];
  if (range === "daily") {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    chartData = labels.map((label, i) => ({
      label,
      revenue: data[i] ?? 0
    }));
  } else if (range === "monthly") {
    chartData = Array.from({ length: 30 }, (_, i) => ({
      label: `Day ${i + 1}`,
      revenue: data[i] ?? 0
    }));
  } else if (range === "yearly") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    chartData = months.map((label, i) => ({
      label,
      revenue: data[i] ?? 0
    }));
  }

  // For color calculation per bar
  const maxRevenue = chartData.reduce((max, curr) => Math.max(max, curr.revenue), 0);

  return (
    <div className="revenue-chart-card">
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar
            dataKey="revenue"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          >
            {chartData.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={getBarColor(entry.revenue, maxRevenue)}
              />
            ))}
          </Bar>
          {/* Line overlays revenue on top of bars */}
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="black"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;

