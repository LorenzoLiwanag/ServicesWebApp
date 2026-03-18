import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import ServicesSearchBar from "../components/services/ServicesSearchBar";
import ServicesSortBar from "../components/services/ServicesSortBar";
import "../styles/services/servicesPage.css";

const ServicesPage = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [filters, setFilters] = useState({
    searchText: "",
    category: "all",
    rating: "all",
    priceRange: "all",
    includeQuote: false,
    availability: "all"
  });
  const [itemsToShow, setItemsToShow] = useState(12);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/services");
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load services");
          return;
        }

        setServices(data.services || []);
      } catch (err) {
        setError("Could not connect to services");
      }
    };

    fetchServices();
  }, []);

  const categories = Array.from(
    new Set(services.map((s) => s.categoryName))
  ).sort();

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesSearch =
          service.serviceName.toLowerCase().includes(searchLower) ||
          service.providerName.toLowerCase().includes(searchLower) ||
          service.categoryName.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      if (
        filters.category !== "all" &&
        service.categoryName !== filters.category
      ) {
        return false;
      }

      if (filters.rating !== "all") {
        const minRating = parseFloat(filters.rating);
        if (service.avgRating < minRating) return false;
      }

      if (filters.priceRange !== "all") {
        if (service.pricingType === "quote" && !filters.includeQuote) {
          return false;
        }

        if (service.pricingType !== "quote") {
          const [min, max] = filters.priceRange.split("-").map(Number);
          if (max && service.rateAmount > max) return false;
          if (service.rateAmount < min) return false;
        }
      }

      if (service.pricingType === "quote" && !filters.includeQuote) {
        return false;
      }

      if (
        filters.availability === "active" &&
        (!service.isProviderActive || !service.isServiceVisible)
      ) {
        return false;
      }

      return true;
    });
  }, [filters, services]);

  const sortedServices = useMemo(() => {
    const sorted = [...filteredServices];

    switch (sortBy) {
      case "rating":
        return sorted.sort((a, b) => b.avgRating - a.avgRating);

      case "price-low":
        return sorted.sort((a, b) => {
          if (a.pricingType === "quote") return 1;
          if (b.pricingType === "quote") return -1;
          return a.rateAmount - b.rateAmount;
        });

      case "price-high":
        return sorted.sort((a, b) => {
          if (a.pricingType === "quote") return -1;
          if (b.pricingType === "quote") return 1;
          return b.rateAmount - a.rateAmount;
        });

      case "reviews":
        return sorted.sort((a, b) => b.reviewCount - a.reviewCount);

      case "recommended":
      default:
        return sorted.sort((a, b) => {
          const scoreA = a.avgRating * a.reviewCount;
          const scoreB = b.avgRating * b.reviewCount;
          return scoreB - scoreA;
        });
    }
  }, [filteredServices, sortBy]);

  const displayedServices = sortedServices.slice(0, itemsToShow);

  const handleServiceClick = (providerServiceId) => {
    navigate(`/service/${providerServiceId}`);
  };

  const handleLoadMore = () => {
    setItemsToShow((prev) => prev + 6);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setItemsToShow(12);
  };

  return (
    <div className="services-page">
      <DashboardNavbar />

      <div className="services-page-header">
        <div className="header-content">
          <h1 className="page-title">Browse Services</h1>
          <p className="page-subtitle">Find trusted providers near you</p>
        </div>
      </div>

      <div className="services-page-container">
        <ServicesSearchBar
          onFiltersChange={handleFiltersChange}
          categories={categories}
        />

        <ServicesSortBar
          sortBy={sortBy}
          onSortChange={setSortBy}
          resultCount={sortedServices.length}
        />

        {error && <p>{error}</p>}

        {displayedServices.length > 0 ? (
          <div className="services-results">
            <div className="services-grid">
              {displayedServices.map((service) => (
                <div
                  key={service.providerServiceId}
                  className="service-card"
                  onClick={() => handleServiceClick(service.providerServiceId)}
                >
                  <div className="card-header">
                    <h3 className="card-title">{service.serviceName}</h3>
                    <span className="card-category">{service.categoryName}</span>
                  </div>

                  <p className="card-provider">{service.providerName}</p>
                  <p className="card-description">{service.bio}</p>

                  <div className="card-stats">
                    <div className="stat">
                      <span className="stat-value">
                        ⭐ {Number(service.avgRating).toFixed(1)}
                      </span>
                      <span className="stat-label">
                        ({service.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="card-pricing">
                    {service.pricingType === "quote" ? (
                      <span className="price-quote">Get Quote</span>
                    ) : service.pricingType === "hourly" ? (
                      <span className="price-amount">
                        ₱{service.rateAmount}/hour
                      </span>
                    ) : (
                      <span className="price-amount">
                        ₱{service.rateAmount}
                      </span>
                    )}
                    <span className="pricing-type">
                      ({service.pricingType})
                    </span>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn-book-now"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(service.providerServiceId);
                      }}
                    >
                      Book Now
                    </button>
                    <button
                      className="btn-contact"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Contact
                    </button>
                  </div>

                  {!service.isProviderActive && (
                    <div className="card-badge unavailable">Unavailable</div>
                  )}
                </div>
              ))}
            </div>

            {itemsToShow < sortedServices.length && (
              <div className="load-more-container">
                <button className="btn-load-more" onClick={handleLoadMore}>
                  Load More Services
                </button>
              </div>
            )}
          </div>
        ) : (
          !error && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h2 className="empty-state-title">No services found</h2>
              <p className="empty-state-message">
                Try adjusting your filters to find what you're looking for.
              </p>
              <button
                className="btn-reset-filters"
                onClick={() =>
                  handleFiltersChange({
                    searchText: "",
                    category: "all",
                    rating: "all",
                    priceRange: "all",
                    includeQuote: false,
                    availability: "all"
                  })
                }
              >
                Reset Filters
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ServicesPage;