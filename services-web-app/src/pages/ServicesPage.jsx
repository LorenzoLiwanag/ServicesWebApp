import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import ServicesSearchBar from "../components/services/ServicesSearchBar";
import ServicesSortBar from "../components/services/ServicesSortBar";
import "../styles/services/servicesPage.css";

const ServicesPage = () => {
  const navigate = useNavigate();

  // Mock data matching ERD structure
  const mockProviderServices = [
    {
      providerServiceId: 1,
      serviceName: "House Cleaning",
      categoryName: "Cleaning",
      providerName: "John's Cleaning Service",
      pricingType: "hourly",
      rateAmount: 500,
      rateCurrency: "PHP",
      avgRating: 4.8,
      reviewCount: 24,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Professional house cleaning with eco-friendly products"
    },
    {
      providerServiceId: 2,
      serviceName: "Plumbing Repair",
      categoryName: "Plumbing",
      providerName: "Expert Plumbers Co.",
      pricingType: "hourly",
      rateAmount: 700,
      rateCurrency: "PHP",
      avgRating: 4.9,
      reviewCount: 42,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Licensed plumbers for residential and commercial"
    },
    {
      providerServiceId: 3,
      serviceName: "Electrical Work",
      categoryName: "Electrical",
      providerName: "SafeElectric Solutions",
      pricingType: "hourly",
      rateAmount: 650,
      rateCurrency: "PHP",
      avgRating: 4.7,
      reviewCount: 18,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Certified electrician for all your electrical needs"
    },
    {
      providerServiceId: 4,
      serviceName: "Painting Services",
      categoryName: "Painting",
      providerName: "Color & Design Studio",
      pricingType: "fixed",
      rateAmount: 3500,
      rateCurrency: "PHP",
      avgRating: 4.6,
      reviewCount: 31,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Interior and exterior painting with premium finishes"
    },
    {
      providerServiceId: 5,
      serviceName: "Carpentry Work",
      categoryName: "Carpentry",
      providerName: "Master Carpenter",
      pricingType: "hourly",
      rateAmount: 800,
      rateCurrency: "PHP",
      avgRating: 4.5,
      reviewCount: 15,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Custom furniture and wood installation"
    },
    {
      providerServiceId: 6,
      serviceName: "HVAC Maintenance",
      categoryName: "HVAC",
      providerName: "Cool Air Systems",
      pricingType: "hourly",
      rateAmount: 550,
      rateCurrency: "PHP",
      avgRating: 4.4,
      reviewCount: 22,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Air conditioning and heating system maintenance"
    },
    {
      providerServiceId: 7,
      serviceName: "Locksmith Services",
      categoryName: "Security",
      providerName: "SecureKey Locksmiths",
      pricingType: "hourly",
      rateAmount: 480,
      rateCurrency: "PHP",
      avgRating: 4.7,
      reviewCount: 29,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "24/7 emergency locksmith services"
    },
    {
      providerServiceId: 8,
      serviceName: "Personal Training",
      categoryName: "Fitness",
      providerName: "FitLife Trainers",
      pricingType: "hourly",
      rateAmount: 900,
      rateCurrency: "PHP",
      avgRating: 4.9,
      reviewCount: 37,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Certified fitness coaches for personalized training"
    },
    {
      providerServiceId: 9,
      serviceName: "Computer Repair",
      categoryName: "Technical",
      providerName: "TechFix Solutions",
      pricingType: "hourly",
      rateAmount: 600,
      rateCurrency: "PHP",
      avgRating: 4.6,
      reviewCount: 26,
      isProviderActive: false,
      isServiceVisible: false,
      bio: "Laptop and desktop repair services"
    },
    {
      providerServiceId: 10,
      serviceName: "Home Cleaning Deep Clean",
      categoryName: "Cleaning",
      providerName: "Sparkle Homes",
      pricingType: "fixed",
      rateAmount: 2500,
      rateCurrency: "PHP",
      avgRating: 4.7,
      reviewCount: 19,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Deep cleaning specialists for thorough home care"
    },
    {
      providerServiceId: 11,
      serviceName: "Gardening & Landscaping",
      categoryName: "Landscaping",
      providerName: "Green Thumb Landscapes",
      pricingType: "quote",
      rateAmount: null,
      rateCurrency: "PHP",
      avgRating: 4.5,
      reviewCount: 11,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Professional landscape design and maintenance"
    },
    {
      providerServiceId: 12,
      serviceName: "Hair Styling",
      categoryName: "Beauty",
      providerName: "Salon Elegance",
      pricingType: "fixed",
      rateAmount: 800,
      rateCurrency: "PHP",
      avgRating: 4.8,
      reviewCount: 45,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Professional hair styling and grooming"
    },
    {
      providerServiceId: 13,
      serviceName: "Pet Grooming",
      categoryName: "Pet Services",
      providerName: "Pawfect Grooming",
      pricingType: "fixed",
      rateAmount: 400,
      rateCurrency: "PHP",
      avgRating: 4.9,
      reviewCount: 52,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Professional dog grooming and pet care"
    },
    {
      providerServiceId: 14,
      serviceName: "Tutoring Services",
      categoryName: "Education",
      providerName: "Study Masters",
      pricingType: "hourly",
      rateAmount: 500,
      rateCurrency: "PHP",
      avgRating: 4.6,
      reviewCount: 28,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Academic tutoring in math, science, and languages"
    },
    {
      providerServiceId: 15,
      serviceName: "Photography",
      categoryName: "Photography",
      providerName: "Moments Captured",
      pricingType: "fixed",
      rateAmount: 5000,
      rateCurrency: "PHP",
      avgRating: 4.8,
      reviewCount: 33,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Professional photography for events and portraits"
    },
    {
      providerServiceId: 16,
      serviceName: "Handyman Services",
      categoryName: "Handyman",
      providerName: "Jack of All Trades",
      pricingType: "hourly",
      rateAmount: 550,
      rateCurrency: "PHP",
      avgRating: 4.4,
      reviewCount: 20,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "General repairs and home maintenance"
    },
    {
      providerServiceId: 17,
      serviceName: "Roof Repair",
      categoryName: "Construction",
      providerName: "Solid Roofing Inc.",
      pricingType: "quote",
      rateAmount: null,
      rateCurrency: "PHP",
      avgRating: 4.7,
      reviewCount: 14,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Professional roof repair and installation"
    },
    {
      providerServiceId: 18,
      serviceName: "Window Cleaning",
      categoryName: "Cleaning",
      providerName: "Crystal Clear Windows",
      pricingType: "hourly",
      rateAmount: 400,
      rateCurrency: "PHP",
      avgRating: 4.5,
      reviewCount: 16,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Professional window and glass cleaning"
    },
    {
      providerServiceId: 19,
      serviceName: "Massage Therapy",
      categoryName: "Wellness",
      providerName: "Relaxation Spa",
      pricingType: "hourly",
      rateAmount: 1000,
      rateCurrency: "PHP",
      avgRating: 4.9,
      reviewCount: 38,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Therapeutic massage and spa treatments"
    },
    {
      providerServiceId: 20,
      serviceName: "Appliance Repair",
      categoryName: "Technical",
      providerName: "AppliancePro",
      pricingType: "hourly",
      rateAmount: 750,
      rateCurrency: "PHP",
      avgRating: 4.3,
      reviewCount: 17,
      isProviderActive: true,
      isServiceVisible: true,
      bio: "Repair services for all major appliances"
    },
  ];

  // State
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

  // Extract unique categories
  const categories = Array.from(
    new Set(mockProviderServices.map((s) => s.categoryName))
  ).sort();

  // Filter logic
  const filteredServices = useMemo(() => {
    return mockProviderServices.filter((service) => {
      // Search text filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesSearch =
          service.serviceName.toLowerCase().includes(searchLower) ||
          service.providerName.toLowerCase().includes(searchLower) ||
          service.categoryName.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category !== "all" && service.categoryName !== filters.category) {
        return false;
      }

      // Rating filter
      if (filters.rating !== "all") {
        const minRating = parseFloat(filters.rating);
        if (service.avgRating < minRating) return false;
      }

      // Price range filter
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

      // Include quote filter
      if (service.pricingType === "quote" && !filters.includeQuote) {
        return false;
      }

      // Availability/Provider status filter
      if (
        filters.availability === "active" &&
        (!service.isProviderActive || !service.isServiceVisible)
      ) {
        return false;
      }

      return true;
    });
  }, [filters, mockProviderServices]);

  // Sort logic
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
    setItemsToShow(12); // Reset pagination when filters change
  };

  return (
    <div className="services-page">
      <DashboardNavbar />

      {/* Page Header */}
      <div className="services-page-header">
        <div className="header-content">
          <h1 className="page-title">Browse Services</h1>
          <p className="page-subtitle">Find trusted providers near you</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="services-page-container">
        <ServicesSearchBar
          onFiltersChange={handleFiltersChange}
          categories={categories}
        />

        {/* Sort Bar */}
        <ServicesSortBar
          sortBy={sortBy}
          onSortChange={setSortBy}
          resultCount={sortedServices.length}
        />

        {/* Results Section */}
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
                        ⭐ {service.avgRating.toFixed(1)}
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
                    <button className="btn-contact" onClick={(e) => e.stopPropagation()}>
                      Contact
                    </button>
                  </div>

                  {!service.isProviderActive && (
                    <div className="card-badge unavailable">Unavailable</div>
                  )}
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {itemsToShow < sortedServices.length && (
              <div className="load-more-container">
                <button className="btn-load-more" onClick={handleLoadMore}>
                  Load More Services
                </button>
              </div>
            )}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
