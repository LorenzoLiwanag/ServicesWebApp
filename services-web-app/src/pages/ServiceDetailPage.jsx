import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import BookModal from "../components/booking/BookModal";
import ContactModal from "../components/messaging/ContactModal";
import { fetchServiceDetail } from "../api/services.js";
import "../styles/pages/serviceDetailPage.css";

const ServiceDetailPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [bookModal, setBookModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setNotFound(false);

    fetchServiceDetail(serviceId)
      .then((data) => {
        if (!cancelled) setService(data);
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.message === "not_found") setNotFound(true);
          else setError(err.message);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [serviceId]);

  const handleBookSuccess = () => {
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
  };

  if (loading) {
    return (
      <div className="sdp-page">
        <DashboardNavbar />
        <div className="sdp-container"><p className="sdp-loading">Loading service…</p></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="sdp-page">
        <DashboardNavbar />
        <div className="sdp-container sdp-not-found">
          <h2>Service not found</h2>
          <p>This service may have been removed or is no longer available.</p>
          <button className="sdp-btn-back" onClick={() => navigate("/services")}>Back to Browse</button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sdp-page">
        <DashboardNavbar />
        <div className="sdp-container sdp-error">
          <p>Error: {error}</p>
          <button className="sdp-btn-back" onClick={() => navigate("/services")}>Back to Browse</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sdp-page">
      <DashboardNavbar />

      {successToast && (
        <div className="sdp-toast" role="status">
          Booking request sent! The provider will respond shortly.
        </div>
      )}

      <div className="sdp-container">
        <button className="sdp-btn-back" onClick={() => navigate(-1)}>← Back</button>

        <div className="sdp-card">
          <div className="sdp-header">
            <div>
              <span className="sdp-category">{service.categoryName}</span>
              <h1 className="sdp-title">{service.serviceName}</h1>
            </div>
            {!service.isProviderActive && (
              <span className="sdp-unavailable-badge">Unavailable</span>
            )}
          </div>

          <div className="sdp-body">
            <div className="sdp-main">
              <section className="sdp-section">
                <h2 className="sdp-section-heading">About this service</h2>
                <p className="sdp-description">{service.description}</p>
              </section>

              <section className="sdp-section sdp-pricing-section">
                <h2 className="sdp-section-heading">Pricing</h2>
                <div className="sdp-pricing">
                  {service.pricingType === "quote" ? (
                    <span className="sdp-price-quote">Get a Quote</span>
                  ) : service.pricingType === "hourly" ? (
                    <span className="sdp-price-amount">₱{service.rateAmount}<span className="sdp-price-unit">/hour</span></span>
                  ) : (
                    <span className="sdp-price-amount">₱{service.rateAmount}<span className="sdp-price-unit"> fixed</span></span>
                  )}
                  {service.serviceLocationType && (
                    <span className="sdp-location-type">
                      {service.serviceLocationType === "client_home" && "At your location"}
                      {service.serviceLocationType === "provider_location" && "At provider's location"}
                      {service.serviceLocationType === "remote" && "Remote / Online"}
                    </span>
                  )}
                </div>
              </section>
            </div>

            <aside className="sdp-sidebar">
              <div className="sdp-provider-card">
                <h2 className="sdp-section-heading">Provider</h2>
                <p className="sdp-provider-name">{service.providerName}</p>
                {service.providerBio && (
                  <p className="sdp-provider-bio">{service.providerBio}</p>
                )}
                <div className="sdp-rating">
                  <span className="sdp-stars">⭐ {service.reviewCount > 0 ? service.avgRating.toFixed(1) : "New"}</span>
                  <span className="sdp-review-count">
                    {service.reviewCount > 0 ? `(${service.reviewCount} reviews)` : "(No reviews yet)"}
                  </span>
                </div>

                <div className="sdp-actions">
                  <button
                    className="sdp-btn-book"
                    onClick={() => setBookModal(true)}
                    disabled={!service.isProviderActive}
                  >
                    Book Now
                  </button>
                  <button
                    className="sdp-btn-contact"
                    onClick={() => setContactModal(true)}
                    disabled={!service.isProviderActive}
                  >
                    Contact
                  </button>
                  {!service.isProviderActive && (
                    <p className="sdp-unavailable-hint">
                      This provider is currently unavailable.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <BookModal
        isOpen={bookModal}
        onClose={() => setBookModal(false)}
        service={service}
        onSuccess={handleBookSuccess}
      />

      <ContactModal
        isOpen={contactModal}
        onClose={() => setContactModal(false)}
        serviceId={service.providerServiceId}
      />
    </div>
  );
};

export default ServiceDetailPage;
