import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContactModal from "../messaging/ContactModal";
import "../../styles/dashboard/dashboardServicesSection.css";

const DashboardServiceSection = () => {
  const navigate = useNavigate();
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { recipientId, serviceId }

  useEffect(() => {
    const fetchFeaturedServices = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/services/browse");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch featured services");
        }

        setFeaturedServices((data.services || []).slice(0, 6));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedServices();
  }, []);

  const handleServiceClick = (providerServiceId) => {
    navigate(`/service/${providerServiceId}`);
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
      <h2 className="services-heading">Featured Services</h2>

      <div className="services-grid">
        {featuredServices.map((service) => (
          <div
            className="service-card"
            key={service.providerServiceId}
            onClick={() => handleServiceClick(service.providerServiceId)}
          >
            <h3 className="service-title">{service.serviceName}</h3>
            <p className="service-provider">By: {service.providerName}</p>
            <p className="service-desc">{service.bio}</p>
            <p className="service-rate">
              Rating: {service.reviewCount > 0 ? `${service.avgRating}/5` : "New"}
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
                  setModal({ recipientId: service.providerId, serviceId: service.providerServiceId });
                }}
              >
                Contact
              </button>
              <button
                className="btn-book-now"
                onClick={(e) => {
                  e.stopPropagation();
                  handleServiceClick(service.providerServiceId);
                }}
              >
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>
      <ContactModal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        recipientId={modal?.recipientId}
        serviceId={modal?.serviceId}
      />
    </div>
  );
};

export default DashboardServiceSection;