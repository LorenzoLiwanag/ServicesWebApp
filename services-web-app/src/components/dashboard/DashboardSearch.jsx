// DashboardSearch.jsx
import "../../styles/dashboard/dashboardSearch.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DashboardSearch = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    rating: "all",
    price: "all",
    availability: "all",
    category: "all"
  });

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (searchText.trim()) {
      params.set("search", searchText.trim());
    }

    if (selectedFilters.category !== "all") {
      params.set("category", selectedFilters.category);
    }

    if (selectedFilters.rating !== "all") {
      params.set("rating", selectedFilters.rating);
    }

    if (selectedFilters.price !== "all") {
      params.set("price", selectedFilters.price);
    }

    if (selectedFilters.availability !== "all") {
      params.set("availability", selectedFilters.availability);
    }

    navigate(`/services?${params.toString()}`);
  };

  return (
    <div className="search-container">
      <form className="group" onSubmit={handleSearchSubmit}>
        <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
          <g>
            <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path>
          </g>
        </svg>

        <input
          placeholder="Browse services, categories, providers..."
          type="search"
          className="input"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <button
          type="button"
          className="filter-btn"
          onClick={() => setShowFilters(!showFilters)}
          title="Toggle filters"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>
      </form>

      {showFilters && (
        <div className="filters-menu">
          <div className="filter-group">
            <label>Service Category</label>
            <select
              value={selectedFilters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Landscaping">Landscaping</option>
              <option value="Handyman">Handyman</option>
              <option value="Painting">Painting</option>
              <option value="Appliance Repair">Appliance Repair</option>
              <option value="Pest Control">Pest Control</option>
              <option value="Moving">Moving</option>
              <option value="Aircon Services">Aircon Services</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Rating</label>
            <select
              value={selectedFilters.rating}
              onChange={(e) => handleFilterChange("rating", e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Price Range</label>
            <select
              value={selectedFilters.price}
              onChange={(e) => handleFilterChange("price", e.target.value)}
            >
              <option value="all">All Prices</option>
              <option value="0-500">₱0 - ₱500</option>
              <option value="500-1000">₱500 - ₱1000</option>
              <option value="1000">₱1000+</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Availability</label>
            <select
              value={selectedFilters.availability}
              onChange={(e) => handleFilterChange("availability", e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active Only</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSearch;