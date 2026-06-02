import React, { useState } from "react";
import "../../styles/services/servicesSearchBar.css";

const DEFAULT_FILTERS = {
  category: "all",
  paymentType: "all",
  priceMode: "all",
  minPrice: "",
  maxPrice: "",
};

const ServicesSearchBar = ({ onFiltersChange, categories }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState(DEFAULT_FILTERS);

  const emitFilters = (nextSearchText, nextFilters) => {
    onFiltersChange({ searchText: nextSearchText, ...nextFilters });
  };

  const handleFilterChange = (filterType, value) => {
    const updatedFilters = {
      ...selectedFilters,
      [filterType]: value,
    };

    if (filterType === "priceMode" && value !== "custom") {
      updatedFilters.minPrice = "";
      updatedFilters.maxPrice = "";
    }

    setSelectedFilters(updatedFilters);
    emitFilters(searchText, updatedFilters);
  };

  const handleSearchChange = (e) => {
    const text = e.target.value;
    setSearchText(text);
    emitFilters(text, selectedFilters);
  };

  const handleClearFilters = () => {
    setSearchText("");
    setSelectedFilters(DEFAULT_FILTERS);
    emitFilters("", DEFAULT_FILTERS);
  };

  return (
    <div className="services-search-container">
      <div className="search-input-group">
        <svg className="search-icon" aria-hidden="true" viewBox="0 0 24 24">
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
          type="button"
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
              <label className="filter-label">Payment Type</label>
              <select
                className="filter-select"
                value={selectedFilters.paymentType}
                onChange={(e) => handleFilterChange("paymentType", e.target.value)}
              >
                <option value="all">All payment types</option>
                <option value="hourly">Hourly</option>
                <option value="fixed">Fixed</option>
                <option value="quote">Quote</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Price</label>
              <select
                className="filter-select"
                value={selectedFilters.priceMode}
                onChange={(e) => handleFilterChange("priceMode", e.target.value)}
              >
                <option value="all">Any price</option>
                <option value="price-high">Highest price</option>
                <option value="price-low">Lowest price</option>
                <option value="custom">Min / max price</option>
              </select>

              {selectedFilters.priceMode === "custom" && (
                <div className="price-range-inputs">
                  <input
                    className="filter-input"
                    type="number"
                    min="0"
                    inputMode="decimal"
                    placeholder="Min"
                    value={selectedFilters.minPrice}
                    onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  />
                  <input
                    className="filter-input"
                    type="number"
                    min="0"
                    inputMode="decimal"
                    placeholder="Max"
                    value={selectedFilters.maxPrice}
                    onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="filters-actions">
            <button className="btn-clear-filters" onClick={handleClearFilters} type="button">
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesSearchBar;
