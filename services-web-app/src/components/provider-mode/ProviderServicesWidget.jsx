import { useEffect, useState } from "react";
import "../../styles/provider-mode/providerServicesWidget.css";

const ProviderServicesWidget = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: "",
    serviceName: "",
    description: "",
    pricingType: "hourly",
    rateAmount: "",
    isVisible: true,
    providerNotes: ""
  });

  const normalizeService = (service) => ({
    providerServiceId: service.providerServiceId,
    name: service.serviceName,
    categoryName: service.categoryName || "",
    pricingType: service.pricingType || "hourly",
    price:
      service.rateAmount !== null && service.rateAmount !== undefined
        ? Number(service.rateAmount)
        : null,
    isVisible: Boolean(service.isServiceVisible),
    description: service.description || "",
    providerNotes: service.providerNotes || ""
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getLoggedInUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: "",
      serviceName: "",
      description: "",
      pricingType: "hourly",
      rateAmount: "",
      isVisible: true,
      providerNotes: ""
    });
  };

  const loadServices = async () => {
    setLoading(true);
    setError("");

    try {
      const user = getLoggedInUser();

      const res = await fetch("http://localhost:3000/api/provider/services", {
        headers: {
          ...getAuthHeaders(),
          "x-user-id": user?.id ? String(user.id) : ""
        }
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Provider services endpoint did not return JSON");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load provider services");
      }

      const list = Array.isArray(data.services) ? data.services : [];
      setServices(list.map(normalizeService));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/services/categories");
      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error("Categories endpoint did not return JSON");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load categories");
      }

      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadServices();
    loadCategories();
  }, []);

  const updateService = async (updatedService) => {
    const user = getLoggedInUser();

    const response = await fetch(
      `http://localhost:3000/api/provider/services/${updatedService.providerServiceId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
          "x-user-id": user?.id ? String(user.id) : ""
        },
        body: JSON.stringify({
          serviceName: updatedService.name,
          pricingType: updatedService.pricingType,
          rateAmount: updatedService.price,
          isVisible: updatedService.isVisible,
          providerNotes: updatedService.providerNotes || ""
        })
      }
    );

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("Update service endpoint did not return JSON");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update service");
    }

    setServices((prev) =>
      prev.map((item) =>
        item.providerServiceId === updatedService.providerServiceId
          ? normalizeService(data.service)
          : item
      )
    );
  };

  const handleToggleVisibility = async (providerServiceId) => {
    const service = services.find((svc) => svc.providerServiceId === providerServiceId);
    if (!service) return;

    const toggled = { ...service, isVisible: !service.isVisible };
    const original = service;

    setServices((prev) =>
      prev.map((item) =>
        item.providerServiceId === providerServiceId ? toggled : item
      )
    );

    try {
      await updateService(toggled);
    } catch (err) {
      setError(err.message);
      setServices((prev) =>
        prev.map((item) =>
          item.providerServiceId === providerServiceId ? original : item
        )
      );
    }
  };

  const handleEdit = async (providerServiceId) => {
    const service = services.find((svc) => svc.providerServiceId === providerServiceId);
    if (!service) return;

    const name = window.prompt("Service name:", service.name);
    if (!name) return;

    const pricingType = window.prompt(
      "Pricing type (hourly, fixed, quote):",
      service.pricingType
    );
    if (!pricingType) return;

    let price = null;
    if (pricingType !== "quote") {
      const priceRaw = window.prompt(
        "Rate amount (PHP):",
        service.price !== null ? String(service.price) : ""
      );
      if (priceRaw == null || priceRaw.trim() === "") return;

      price = Number(priceRaw);
      if (Number.isNaN(price) || price <= 0) {
        alert("Enter a valid positive number for rate amount.");
        return;
      }
    }

    const isVisible = window.confirm("Make service visible to clients? OK = visible");

    try {
      await updateService({
        ...service,
        name,
        pricingType,
        price,
        isVisible
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (providerServiceId) => {
    if (!window.confirm("Delete this service?")) return;

    try {
      const user = getLoggedInUser();

      const response = await fetch(
        `http://localhost:3000/api/provider/services/${providerServiceId}`,
        {
          method: "DELETE",
          headers: {
            ...getAuthHeaders(),
            "x-user-id": user?.id ? String(user.id) : ""
          }
        }
      );

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Delete service endpoint did not return JSON");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete service");
      }

      setServices((prev) => prev.filter((svc) => svc.providerServiceId !== providerServiceId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    if (submitting) return;
    setShowAddModal(false);
    resetForm();
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddServiceSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.categoryId) {
      setError("Please select a category.");
      return;
    }

    if (!formData.serviceName.trim()) {
      setError("Please enter a service name.");
      return;
    }

    if (formData.pricingType !== "quote") {
      const amount = Number(formData.rateAmount);
      if (Number.isNaN(amount) || amount <= 0) {
        setError("Please enter a valid positive rate amount.");
        return;
      }
    }

    try {
      setSubmitting(true);
      const user = getLoggedInUser();

      const response = await fetch("http://localhost:3000/api/provider/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
          "x-user-id": user?.id ? String(user.id) : ""
        },
        body: JSON.stringify({
          categoryId: Number(formData.categoryId),
          serviceName: formData.serviceName.trim(),
          description: formData.description.trim(),
          pricingType: formData.pricingType,
          rateAmount:
            formData.pricingType === "quote" ? null : Number(formData.rateAmount),
          isVisible: formData.isVisible,
          providerNotes: formData.providerNotes.trim()
        })
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Add service endpoint did not return JSON");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add service");
      }

      setServices((prev) => [...prev, normalizeService(data.service)]);
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="services-widget">
        <div className="widget-header">
          <h2 className="widget-title">My Services</h2>
          <button className="btn-add-service" onClick={handleOpenAddModal}>
            + Add Service
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        {loading ? (
          <p>Loading services...</p>
        ) : (
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
                      <span className="service-price">
                        {service.pricingType === "quote"
                          ? "Get Quote"
                          : service.pricingType === "hourly"
                          ? `₱${service.price}/hr`
                          : `₱${service.price}`}
                      </span>
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
        )}
      </div>

      {showAddModal && (
        <div className="provider-modal-overlay" onClick={handleCloseAddModal}>
          <div
            className="provider-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="provider-modal-header">
              <h3>Add New Service</h3>
              <button
                className="provider-modal-close"
                onClick={handleCloseAddModal}
                type="button"
              >
                ×
              </button>
            </div>

            <form className="provider-service-form" onSubmit={handleAddServiceSubmit}>
              <div className="provider-form-group">
                <label>Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleFormChange("categoryId", e.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="provider-form-group">
                <label>Service Name</label>
                <input
                  type="text"
                  value={formData.serviceName}
                  onChange={(e) => handleFormChange("serviceName", e.target.value)}
                  placeholder="e.g. Deep House Cleaning"
                  required
                />
              </div>

              <div className="provider-form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  placeholder="Describe the service"
                />
              </div>

              <div className="provider-form-group">
                <label>Pricing Type</label>
                <select
                  value={formData.pricingType}
                  onChange={(e) => handleFormChange("pricingType", e.target.value)}
                >
                  <option value="hourly">Hourly</option>
                  <option value="fixed">Fixed</option>
                  <option value="quote">Quote</option>
                </select>
              </div>

              {formData.pricingType !== "quote" && (
                <div className="provider-form-group">
                  <label>Rate Amount (PHP)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.rateAmount}
                    onChange={(e) => handleFormChange("rateAmount", e.target.value)}
                    placeholder="e.g. 500"
                    required
                  />
                </div>
              )}

              <div className="provider-form-group">
                <label>Provider Notes</label>
                <textarea
                  rows="3"
                  value={formData.providerNotes}
                  onChange={(e) => handleFormChange("providerNotes", e.target.value)}
                  placeholder="Optional notes for clients"
                />
              </div>

              <div className="provider-form-checkbox">
                <input
                  id="provider-visible-checkbox"
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) => handleFormChange("isVisible", e.target.checked)}
                />
                <label htmlFor="provider-visible-checkbox">
                  Make this service visible to clients
                </label>
              </div>

              <div className="provider-form-actions">
                <button
                  type="button"
                  className="provider-cancel-btn"
                  onClick={handleCloseAddModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="provider-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProviderServicesWidget;