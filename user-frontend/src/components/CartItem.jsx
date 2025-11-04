import React from "react";

const categories = [
  "Burger", "Pizza", "Drink", "French fries", "Veggies",
  "Salads", "Pasta", "Sandwiches", "Desserts"
];

export default function CategoryList({ selected, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          style={{
            padding: "8px 22px",
            borderRadius: "14px",
            background: selected === cat ? "#2563eb" : "#f4f4f4",
            color: selected === cat ? "#fff" : "#222",
            fontWeight: "600",
            border: "none",
            cursor: "pointer"
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
