import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContactModal from "../messaging/ContactModal";
import BookModal from "../booking/BookModal";
import { fetchBrowseServices } from "../../api/services.js";
import categoryDefaultImage from "../../assets/about-image1.jpg";
import cleaningImage from "../../assets/about-image3.jpg";
import deepCleaningImage from "../../assets/about-image4.jpg";
import handymanImage from "../../assets/about-image1.jpg";
import maintenanceImage from "../../assets/about-image2.jpg";
import "../../styles/dashboard/dashboardServicesSection.css";

const getCategoryImage = (categoryName = "", serviceName = "") => {
  const category = categoryName.toLowerCase();
  const service = serviceName.toLowerCase();

  if (service.includes("deep") || service.includes("move-out")) return deepCleaningImage;
  if (category.includes("clean") || service.includes("clean") || service.includes("laundry")) return cleaningImage;
  if (
    category.includes("handyman") ||
    category.includes("plumbing") ||
    category.includes("electrical") ||
    category.includes("painting") ||
    service.includes("repair")
  ) {
    return handymanImage;
  }
  if (
    category.includes("aircon") ||
    category.includes("appliance") ||
    category.includes("pest") ||
    category.includes("landscaping") ||
    category.includes("moving")
  ) {
    return maintenanceImage;
  }

  return categoryDefaultImage;
};

const DashboardServiceSection = () => {
  const navigate = useNavigate();
  const [featuredServices, setFeaturedServices] = useState([]);
  const [activeIndex, setActiveIndex] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contactModal, setContactModal] = useState(null); // { recipientId, serviceId }
  const [bookModal, setBookModal] = useState(null); // service object
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    fetchBrowseServices()
      .then((services) => {
        setFeaturedServices(services);
        setActiveIndex(services.length > 1 ? 1 : 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const browsePageServices = useMemo(() => {
    return featuredServices
      .filter((service) => service.pricingType !== "quote")
      .sort((a, b) => {
        const scoreA = a.avgRating * Math.max(a.reviewCount, 1);
        const scoreB = b.avgRating * Math.max(b.reviewCount, 1);
        return scoreB - scoreA;
      });
  }, [featuredServices]);

  const visibleServices = useMemo(() => {
    if (browsePageServices.length <= 1) return browsePageServices;

    const currentIndex = activeIndex % browsePageServices.length;
    const previousIndex = (currentIndex - 1 + browsePageServices.length) % browsePageServices.length;
    const nextIndex = (currentIndex + 1) % browsePageServices.length;

    return [
      browsePageServices[previousIndex],
      browsePageServices[currentIndex],
      browsePageServices[nextIndex],
    ];
  }, [activeIndex, browsePageServices]);

  const handlePrevious = () => {
    setActiveIndex((current) =>
      (current - 1 + browsePageServices.length) % browsePageServices.length
    );
  };

  const handleNext = () => {
    setActiveIndex((current) => (current + 1) % browsePageServices.length);
  };

  const handleBookSuccess = () => {
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
  };

  if (loading) {
    return (
      <div className="services-section dashboard-featured-section">
        <h2 className="services-heading">Featured Services</h2>
        <p>Loading featured services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="services-section dashboard-featured-section">
        <h2 className="services-heading">Featured Services</h2>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="services-section dashboard-featured-section">
      {successToast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #0d6efd, #60a5fa)", color: "#fff",
          padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14,
          zIndex: 2000, boxShadow: "0 8px 24px rgba(13,110,253,0.3)", whiteSpace: "nowrap"
        }} role="status">
          Booking request sent! The provider will respond shortly.
        </div>
      )}

      <h2 className="services-heading">Featured Services</h2>

      <div className="featured-carousel">
        {browsePageServices.length > 1 && (
          <button
            type="button"
            className="featured-scroll-button featured-scroll-button-left"
            aria-label="Show previous featured service"
            onClick={handlePrevious}
          >
            {"<"}
          </button>
        )}

        <div className="services-grid">
          {visibleServices.map((service, index) => (
            <div
              className={`service-card ${index === 1 ? "featured-card-primary" : "featured-card-side"}`}
              key={service.providerServiceId}
              onClick={() => navigate(`/service/${service.providerServiceId}`)}
            >
              <img
                className="featured-service-image"
                src={getCategoryImage(service.categoryName, service.serviceName)}
                alt=""
                aria-hidden="true"
              />
              <h3 className="service-title">{service.serviceName}</h3>
              <p className="service-provider">By: {service.providerName}</p>
              <p className="service-desc">{service.description}</p>
              <p className="service-rate">
                Rating: {service.reviewCount > 0 ? `${service.avgRating.toFixed(1)}/5` : "New"}
              </p>
              <p className="service-price">
                Price:{" "}
                {service.pricingType === "quote"
                  ? "Get Quote"
                  : service.pricingType === "hourly"
                  ? `${"\u20b1"}${service.rateAmount}/hour`
                  : `${"\u20b1"}${service.rateAmount}`}
              </p>

              <div className="service-buttons">
                <button
                  className="btn-contact"
                  onClick={(e) => {
                    e.stopPropagation();
                    setContactModal({ serviceId: service.providerServiceId });
                  }}
                >
                  Contact
                </button>
                <button
                  className="btn-book-now"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBookModal(service);
                  }}
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {browsePageServices.length > 1 && (
          <button
            type="button"
            className="featured-scroll-button featured-scroll-button-right"
            aria-label="Show next featured service"
            onClick={handleNext}
          >
            {">"}
          </button>
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

export default DashboardServiceSection;
