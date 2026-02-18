import React from "react";
import "../../styles/services/ServicesSortBar.css";

const ServicesSortBar = ({ sortBy, onSortChange, resultCount }) => {
  return (
    <div className="sort-bar">
      <div className="sort-bar-left">
        <p className="result-count">Showing {resultCount} services</p>
      </div>

      <div className="sort-bar-right">
        <label htmlFor="sort-select" className="sort-label">
          Sort by:
        </label>
        <select
          id="sort-select"
          className="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="recommended">Recommended</option>
          <option value="rating">Top Rated</option>
          <option value="price-low">Lowest Price</option>
          <option value="price-high">Highest Price</option>
          <option value="reviews">Most Reviewed</option>
        </select>
      </div>
    </div>
  );
};

export default ServicesSortBar;
