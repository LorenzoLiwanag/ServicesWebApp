import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContactModal from "../messaging/ContactModal";
import BookModal from "../booking/BookModal";
import { fetchBrowseServices } from "../../api/services.js";
import "../../styles/dashboard/dashboardServicesSection.css";

const DashboardServiceSection = () => {
  const navigate = useNavigate();
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contactModal, setContactModal] = useState(null); // { recipientId, serviceId }
  const [bookModal, setBookModal] = useState(null); // service object
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    fetchBrowseServices()
      .then((services) => setFeaturedServices(services.slice(0, 6)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleBookSuccess = () => {
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
  };

  if (loading) {
    return (
      <div className="services-section">
        <h2 className="services-heading">Featured Services</h2>
        <p>Loading featured services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="services-section">
        <h2 className="services-heading">Featured Services</h2>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="services-section">
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

      <div className="services-grid">
        {featuredServices.map((service) => (
          <div
            className="service-card"
            key={service.providerServiceId}
            onClick={() => navigate(`/service/${service.providerServiceId}`)}
          >
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
                ? `₱${service.rateAmount}/hour`
                : `₱${service.rateAmount}`}
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
