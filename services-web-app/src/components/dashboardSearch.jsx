import "../styles/dashboardSearch.css";
import { useState } from "react";

const DashboardSearch = () => {
    const [showFilters, setShowFilters] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({
        rating: "all",
        price: "all",
        availability: "all",
        category: "all"
    });

    const handleFilterChange = (filterType, value) => {
        setSelectedFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    return (
        <div className="search-container">
            <div className="group">
                <svg
                    className="icon"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                >
                    <g>
                        <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path>
                    </g>
                </svg>

                <input
                    placeholder="Browse services, categories, providers..."
                    type="search"
                    className="input"
                />

                <button 
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
            </div>

            {showFilters && (
                <div className="filters-menu">
                    <div className="filter-group">
                        <label>Service Category</label>
                        <select 
                            value={selectedFilters.category}
                            onChange={(e) => handleFilterChange("category", e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            <option value="cleaning">Cleaning</option>
                            <option value="handyman">Handyman</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Rating</label>
                        <select 
                            value={selectedFilters.rating}
                            onChange={(e) => handleFilterChange("rating", e.target.value)}
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4+ Stars</option>
                            <option value="3">3+ Stars</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Price Range</label>
                        <select 
                            value={selectedFilters.price}
                            onChange={(e) => handleFilterChange("price", e.target.value)}
                        >
                            <option value="all">All Prices</option>
                            <option value="low">Budget ($)</option>
                            <option value="mid">Mid-Range ($$)</option>
                            <option value="high">Premium ($$$)</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Availability</label>
                        <select 
                            value={selectedFilters.availability}
                            onChange={(e) => handleFilterChange("availability", e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="available">Available Now</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>

                </div>
            )}
        </div>
    );
};

export default DashboardSearch;
