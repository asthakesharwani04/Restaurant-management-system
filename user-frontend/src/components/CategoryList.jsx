import { useState, useEffect } from 'react';

const CategoryList = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="category-list">
      <button
        className={`category-btn ${!selectedCategory ? 'active' : ''}`}
        onClick={() => onSelectCategory(null)}
      >
        All Items
      </button>
      {categories.map(category => (
        <button
          key={category}
          className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
          onClick={() => onSelectCategory(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryList;