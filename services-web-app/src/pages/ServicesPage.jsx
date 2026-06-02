import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import ServicesSearchBar from "../components/services/ServicesSearchBar";
import ContactModal from "../components/messaging/ContactModal";
import BookModal from "../components/booking/BookModal";
import { fetchBrowseServices } from "../api/services.js";
import "../styles/services/servicesPage.css";

const ServicesPage = () => {
  const navigate = useNavigate();
  const categoryRowRefs = useRef({});

  const [providerServices, setProviderServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [contactModal, setContactModal] = useState(null);
  const [bookModal, setBookModal] = useState(null);
  const [successToast, setSuccessToast] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [filters, setFilters] = useState({
    searchText: "",
    category: "all",
    paymentType: "all",
    priceMode: "all",
    minPrice: "",
    maxPrice: ""
  });

  useEffect(() => {
    fetchBrowseServices()
      .then(setProviderServices)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = Array.from(
    new Set(providerServices.map((s) => s.categoryName).filter(Boolean))
  ).sort();

  const filteredServices = useMemo(() => {
    return providerServices.filter((service) => {
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesSearch =
          service.serviceName.toLowerCase().includes(searchLower) ||
          service.providerName.toLowerCase().includes(searchLower) ||
          (service.categoryName || "").toLowerCase().includes(searchLower) ||
          (service.description || "").toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.category !== "all" && service.categoryName !== filters.category) {
        return false;
      }

      if (filters.paymentType !== "all" && service.pricingType !== filters.paymentType) {
        return false;
      }

      if (filters.priceMode === "custom") {
        if (service.pricingType === "quote" || service.rateAmount === null) {
          return false;
        }

        const minPrice = filters.minPrice === "" ? null : Number(filters.minPrice);
        const maxPrice = filters.maxPrice === "" ? null : Number(filters.maxPrice);

        if (minPrice !== null && service.rateAmount < minPrice) return false;
        if (maxPrice !== null && service.rateAmount > maxPrice) return false;
      }

      return true;
    });
  }, [filters, providerServices]);

  const sortedServices = useMemo(() => {
    const sorted = [...filteredServices];

    switch (filters.priceMode) {
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
      case "recommended":
      default:
        return sorted.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
    }
  }, [filteredServices, filters.priceMode]);

  const categorySections = useMemo(() => {
    const groups = sortedServices.reduce((acc, service) => {
      const categoryName = service.categoryName || "Other Services";
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(service);
      return acc;
    }, {});

    return Object.entries(groups).sort(([categoryA], [categoryB]) =>
      categoryA.localeCompare(categoryB)
    );
  }, [sortedServices]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setExpandedCategory(null);
  };

  const scrollCategoryRow = (categoryName, direction) => {
    const row = categoryRowRefs.current[categoryName];
    if (!row) return;

    row.scrollBy({
      left: direction * row.clientWidth,
      behavior: "smooth",
    });
  };

  const handleBookSuccess = () => {
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
  };

  const toggleExpandedCategory = (categoryName) => {
    setExpandedCategory((currentCategory) =>
      currentCategory === categoryName ? null : categoryName
    );
  };

  const renderServiceCard = (service) => (
    <div
      key={service.providerServiceId}
      className="service-card"
      onClick={() => navigate(`/service/${service.providerServiceId}`)}
    >
      <div className="card-header">
        <h3 className="card-title">{service.serviceName}</h3>
      </div>

      <p className="card-provider">{service.providerName}</p>
      <p className="card-description">{service.description}</p>

      <div className="card-pricing">
        {service.pricingType === "quote" ? (
          <span className="price-quote">Get Quote</span>
        ) : service.pricingType === "hourly" ? (
          <span className="price-amount">
            {"\u20b1"}{service.rateAmount}/hour
          </span>
        ) : (
          <span className="price-amount">
            {"\u20b1"}{service.rateAmount}
          </span>
        )}
        <span className="pricing-type">({service.pricingType})</span>
      </div>

      <div className="card-actions">
        <button
          className="btn-book-now"
          onClick={(e) => {
            e.stopPropagation();
            setBookModal(service);
          }}
        >
          Book Now
        </button>
        <button
          className="btn-contact"
          onClick={(e) => {
            e.stopPropagation();
            setContactModal({ serviceId: service.providerServiceId });
          }}
        >
          Contact
        </button>
      </div>

      {!service.isProviderActive && (
        <div className="card-badge unavailable">Unavailable</div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="services-page">
        <DashboardNavbar />
        <div className="services-page-container">
          <p>Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="services-page">
        <DashboardNavbar />
        <div className="services-page-container">
          <p style={{ color: "red" }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="services-page">
      <DashboardNavbar />

      {successToast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #0d6efd, #60a5fa)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            zIndex: 2000,
            boxShadow: "0 8px 24px rgba(13,110,253,0.3)",
            whiteSpace: "nowrap"
          }}
          role="status"
        >
          Booking request sent! The provider will respond shortly.
        </div>
      )}

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

        {sortedServices.length > 0 ? (
          <div className="services-results">
            {categorySections.map(([categoryName, services]) => {
              if (expandedCategory && expandedCategory !== categoryName) {
                return null;
              }

              const isExpanded = expandedCategory === categoryName;

              return (
              <section className="service-category-section" key={categoryName}>
                <div className="service-category-header">
                  <div>
                    <h2 className="service-category-title">{categoryName}</h2>
                    <button
                      className="service-category-view-all"
                      type="button"
                      onClick={() => toggleExpandedCategory(categoryName)}
                    >
                      {isExpanded ? "Back to all categories" : "View all"}
                    </button>
                  </div>

                  {!isExpanded && (
                    <div className="service-category-controls">
                    <button
                      className="service-row-arrow"
                      type="button"
                      aria-label={`Scroll ${categoryName} services left`}
                      onClick={() => scrollCategoryRow(categoryName, -1)}
                    >
                      {"<"}
                    </button>
                    <button
                      className="service-row-arrow"
                      type="button"
                      aria-label={`Scroll ${categoryName} services right`}
                      onClick={() => scrollCategoryRow(categoryName, 1)}
                    >
                      {">"}
                    </button>
                  </div>
                  )}
                </div>

                {isExpanded ? (
                  <div className="services-grid services-grid-expanded">
                    {services.map(renderServiceCard)}
                  </div>
                ) : (
                  <div className="service-category-carousel">
                  <button
                    className="service-row-arrow service-row-arrow-side service-row-arrow-left"
                    type="button"
                    aria-label={`Scroll ${categoryName} services left`}
                    onClick={() => scrollCategoryRow(categoryName, -1)}
                  >
                    {"<"}
                  </button>

                  <div
                    className="services-row"
                    ref={(node) => {
                      categoryRowRefs.current[categoryName] = node;
                    }}
                  >
                    {services.map(renderServiceCard)}
                  </div>

                  <button
                    className="service-row-arrow service-row-arrow-side service-row-arrow-right"
                    type="button"
                    aria-label={`Scroll ${categoryName} services right`}
                    onClick={() => scrollCategoryRow(categoryName, 1)}
                  >
                    {">"}
                  </button>
                </div>
                )}
              </section>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">Search</div>
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
                  paymentType: "all",
                  priceMode: "all",
                  minPrice: "",
                  maxPrice: ""
                })
              }
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <ContactModal
        isOpen={contactModal !== null}
        onClose={() => setContactModal(null)}
        serviceId={contactModal?.serviceId}
      />

      <BookModal
        isOpen={bookModal !== null}
        onClose={() => setBookModal(null)}
        service={bookModal}
        onSuccess={handleBookSuccess}
      />
    </div>
  );
};

export default ServicesPage;
