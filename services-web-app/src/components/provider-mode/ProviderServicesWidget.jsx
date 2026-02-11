import { useState } from "react";
import "../../styles/provider-mode/providerServicesWidget.css";

const ProviderServicesWidget = () => {
  const [services, setServices] = useState([
    {
      id: 1,
      name: "House Cleaning",
      price: "$50/hr",
      isVisible: true,
    },
    {
      id: 2,
      name: "Plumbing Repairs",
      price: "$75/hr",
      isVisible: true,
    },
    {
      id: 3,
      name: "Furniture Assembly",
      price: "$60/hr",
      isVisible: false,
    },
    {
      id: 4,
      name: "Lawn Mowing",
      price: "$40/hr",
      isVisible: true,
    },
  ]);

  const handleToggleVisibility = (id) => {
    setServices(
      services.map((service) =>
        service.id === id
          ? { ...service, isVisible: !service.isVisible }
          : service
      )
    );
  };

  const handleEdit = (id) => {
    alert(`Edit service ${id} - Edit functionality coming soon`);
  };

  return (
    <div className="services-widget">
      <div className="widget-header">
        <h2 className="widget-title">My Services</h2>
        <button className="btn-add-service">+ Add Service</button>
      </div>

      <div className="services-table">
        <div className="table-header">
          <div className="col-name">Service Name</div>
          <div className="col-price">Price</div>
          <div className="col-visibility">Visibility</div>
          <div className="col-actions">Actions</div>
        </div>

        <div className="table-body">
          {services.length === 0 ? (
            <p className="empty-state">No services added yet</p>
          ) : (
            services.map((service) => (
              <div key={service.id} className="table-row">
                <div className="col-name">
                  <span className="service-name">{service.name}</span>
                </div>
                <div className="col-price">
                  <span className="service-price">{service.price}</span>
                </div>
                <div className="col-visibility">
                  <button
                    className={`visibility-toggle ${
                      service.isVisible ? "visible" : "hidden"
                    }`}
                    onClick={() => handleToggleVisibility(service.id)}
                    aria-label="Toggle visibility"
                  >
                    <span className="toggle-icon">
                      {service.isVisible ? "👁️" : "👁️‍🗨️"}
                    </span>
                  </button>
                  <span className="visibility-text">
                    {service.isVisible ? "Visible" : "Hidden"}
                  </span>
                </div>
                <div className="col-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(service.id)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderServicesWidget;
