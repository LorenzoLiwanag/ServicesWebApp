import React from "react";
import "../../styles/services/servicesSearchBar.css";
import { useState } from "react";

const ServicesSearchBar = ({ onFiltersChange, categories }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    category: "all",
    priceRange: "all",
    includeQuote: false,
    availability: "all"
  });

  const handleFilterChange = (filterType, value) => {
    const updatedFilters = {
      ...selectedFilters,
      [filterType]: value
    };
    setSelectedFilters(updatedFilters);
    onFiltersChange({ searchText, ...updatedFilters });
  };

  const handleSearchChange = (e) => {
    const text = e.target.value;
    setSearchText(text);
    onFiltersChange({ searchText: text, ...selectedFilters });
  };

  const handleClearFilters = () => {
    setSearchText("");
    setSelectedFilters({
      category: "all",
      priceRange: "all",
      includeQuote: false,
      availability: "all"
    });
    onFiltersChange({
      searchText: "",
      category: "all",
      priceRange: "all",
      includeQuote: false,
      availability: "all"
    });
  };

  return (
    <div className="services-search-container">
      <div className="search-input-group">
        <svg
          className="search-icon"
          aria-hidden="true"
          viewBox="0 0 24 24"
        >
          <g>
            <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path>
          </g>
        </svg>

        <input
          placeholder="Search services, categories, providers..."
          type="search"
          className="search-input"
          value={searchText}
          onChange={handleSearchChange}
        />

        <button
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
          title="Toggle filters"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Service Category</label>
              <select
                className="filter-select"
                value={selectedFilters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Price Range</label>
              <select
                className="filter-select"
                value={selectedFilters.priceRange}
                onChange={(e) => handleFilterChange("priceRange", e.target.value)}
              >
                <option value="all">All Prices</option>
                <option value="0-500">₱0 - ₱500</option>
                <option value="500-1000">₱500 - ₱1000</option>
                <option value="1000">₱1000+</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Provider Status</label>
              <select
                className="filter-select"
                value={selectedFilters.availability}
                onChange={(e) => handleFilterChange("availability", e.target.value)}
              >
                <option value="all">All Providers</option>
                <option value="active">Active Only</option>
              </select>
            </div>
          </div>

          <div className="filter-checkbox">
            <input
              type="checkbox"
              id="include-quote"
              checked={selectedFilters.includeQuote}
              onChange={(e) => handleFilterChange("includeQuote", e.target.checked)}
            />
            <label htmlFor="include-quote">Include quote-based services</label>
          </div>

          <div className="filters-actions">
            <button className="btn-clear-filters" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesSearchBar;
