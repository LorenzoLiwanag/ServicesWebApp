import { useEffect, useState } from "react";
import "../../styles/dashboard/dashboardServicesSection.css";

const DashboardServiceSection = () => {
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");

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

  return (
    <div className="services-section">
      <h2 className="services-heading">Browse Popular</h2>

      {error && <p>{error}</p>}

      <div className="services-grid">
        {services.map((service) => (
          <div className="service-card" key={service.providerServiceId}>
            <h3 className="service-title">{service.serviceName}</h3>
            <p className="service-provider">By: {service.providerName}</p>
            <p className="service-desc">{service.categoryName}</p>
            <p className="service-rate">Rating: {service.avgRating}/5</p>
            <p className="service-price">
              Price:{" "}
              {service.pricingType === "quote"
                ? "Get Quote"
                : `${service.rateCurrency} ${service.rateAmount}${
                    service.pricingType === "hourly" ? "/hr" : ""
                  }`}
            </p>
            <div className="service-buttons">
              <button className="btn-contact">Contact</button>
              <button className="btn-book-now">Book Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardServiceSection;