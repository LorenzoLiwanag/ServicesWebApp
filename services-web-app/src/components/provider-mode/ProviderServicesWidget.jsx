import { useEffect, useState } from "react";
import "../../styles/provider-mode/providerServicesWidget.css";

const ProviderServicesWidget = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizeService = (service) => ({
    providerServiceId: service.providerServiceId,
    name: service.serviceName,
    price: Number(service.rateAmount),
    isVisible: Boolean(service.isServiceVisible)
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const loadServices = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/api/provider/services", {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Failed to load provider services");
      const data = await res.json();
      const list = Array.isArray(data.services) ? data.services : [];
      setServices(list.map(normalizeService));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const updateService = async (updatedService) => {
    try {
      const response = await fetch(`http://localhost:3000/api/provider/services/${updatedService.providerServiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: updatedService.name,
          price: updatedService.price,
          isVisible: updatedService.isVisible
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update service');
      }

      const data = await response.json();
      setServices((prev) => prev.map((item) => item.providerServiceId === updatedService.providerServiceId ? normalizeService(data.service) : item));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleVisibility = async (providerServiceId) => {
    const service = services.find((svc) => svc.providerServiceId === providerServiceId);
    if (!service) return;

    const toggled = { ...service, isVisible: !service.isVisible };

    try {
      setServices((prev) => prev.map((item) => item.providerServiceId === providerServiceId ? toggled : item));
      await updateService(toggled);
    } catch (err) {
      setError(err.message);
      setServices((prev) => prev.map((item) => item.providerServiceId === providerServiceId ? service : item));
    }
  };

  const handleAddService = async () => {
    const name = window.prompt('Service name:');
    if (!name) return;

    const priceRaw = window.prompt('Price amount (PHP):');
    if (priceRaw == null || priceRaw.trim() === '') return;
    const price = Number(priceRaw);
    if (Number.isNaN(price) || price <= 0) {
      alert('Enter a valid positive number for price.');
      return;
    }

    const visibility = window.confirm('Make service visible to clients? OK = visible');

    try {
      const response = await fetch('http://localhost:3000/api/provider/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ name, price, isVisible: visibility })
      });

      if (!response.ok) {
        throw new Error('Failed to add service');
      }

      const data = await response.json();
      setServices((prev) => [...prev, normalizeService(data.service)]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = async (providerServiceId) => {
    const service = services.find((svc) => svc.providerServiceId === providerServiceId);
    if (!service) return;

    const name = window.prompt('Service name:', service.name);
    if (!name) return;

    const priceRaw = window.prompt('Price amount (PHP):', String(service.price));
    if (priceRaw == null || priceRaw.trim() === '') return;
    const price = Number(priceRaw);
    if (Number.isNaN(price) || price <= 0) {
      alert('Enter a valid positive number for price.');
      return;
    }

    const isVisible = window.confirm('Make service visible to clients? OK = visible');

    await updateService({ providerServiceId, name, price, isVisible });
  };

  const handleDelete = async (providerServiceId) => {
    if (!window.confirm('Delete this service?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/provider/services/${providerServiceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      setServices((prev) => prev.filter((svc) => svc.providerServiceId !== providerServiceId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="services-widget">
      <div className="widget-header">
        <h2 className="widget-title">My Services</h2>
        <button className="btn-add-service" onClick={handleAddService}>+ Add Service</button>
      </div>
      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p>Loading services...</p>
      ) : (
        <>
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
                  <div key={service.providerServiceId} className="table-row">
                    <div className="col-name">
                      <span className="service-name">{service.name}</span>
                    </div>
                    <div className="col-price">
                      <span className="service-price">₱{service.price}/hr</span>
                    </div>
                    <div className="col-visibility">
                      <button
                        className={`visibility-toggle ${
                          service.isVisible ? "visible" : "hidden"
                        }`}
                        onClick={() => handleToggleVisibility(service.providerServiceId)}
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
                        onClick={() => handleEdit(service.providerServiceId)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(service.providerServiceId)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProviderServicesWidget;
