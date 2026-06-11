import { useEffect, useState } from "react";
import "../../styles/provider-mode/providerServicesWidget.css";

const API_BASE = "http://localhost:3000";

const EMPTY_FORM = {
  categoryId: "",
  title: "",
  description: "",
  pricingType: "hourly",
  priceAmount: "",
};

const LOCATION_LABELS = {
  client_home: "Client Home",
  provider_location: "My Location",
  remote: "Remote",
  flexible: "Flexible",
};

const ApprovalBadge = ({ status }) => {
  const map = {
    pending: { bg: "#fef3c7", color: "#92400e", label: "Pending Approval" },
    approved: { bg: "#d1fae5", color: "#065f46", label: "Approved" },
    rejected: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: 12,
      fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
};

const ServiceFormModal = ({ title: modalTitle, formData, categories, onChange, onSubmit, onCancel, submitting, error }) => (
  <div className="provider-modal-overlay" onClick={onCancel}>
    <div className="provider-modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
      <div className="provider-modal-header">
        <h3>{modalTitle}</h3>
        <button className="provider-modal-close" onClick={onCancel} type="button">×</button>
      </div>

      {error && (
        <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 10, background: "#fef2f2", padding: "8px 12px", borderRadius: 6 }}>
          {error}
        </p>
      )}

      <form className="provider-service-form" onSubmit={onSubmit}>
        <div className="provider-form-group">
          <label>Category</label>
          <select value={formData.categoryId} onChange={(e) => onChange("categoryId", e.target.value)} required>
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="provider-form-group">
          <label>Service Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="e.g. Deep House Cleaning"
            required
          />
        </div>

        <div className="provider-form-group">
          <label>Description</label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Describe what this service includes"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="provider-form-group">
            <label>Pricing Type</label>
            <select value={formData.pricingType} onChange={(e) => onChange("pricingType", e.target.value)}>
              <option value="hourly">Hourly</option>
              <option value="fixed">Fixed</option>
              <option value="quote">Quote</option>
            </select>
          </div>

          {formData.pricingType !== "quote" && (
            <div className="provider-form-group">
              <label>Price (PHP ₱)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={formData.priceAmount}
                onChange={(e) => onChange("priceAmount", e.target.value)}
                placeholder="e.g. 80"
                required
              />
            </div>
          )}
        </div>

        <div className="provider-form-actions">
          <button type="button" className="provider-cancel-btn" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="provider-submit-btn" disabled={submitting}>
            {submitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const ProviderServicesWidget = ({
  providerProfile,
  onAvailabilityChange,
  availabilitySaving,
  availabilityError,
}) => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM, providerServiceId: null });
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "x-user-id": user?.id ? String(user.id) : "",
    };
  };

  const flashSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 5000);
  };

  const loadServices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/provider/services`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load services");
      setServices(Array.isArray(data.services) ? data.services : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/services/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch {
      /* categories failing silently is acceptable */
    }
  };

  useEffect(() => {
    loadServices();
    loadCategories();
  }, []);

  const handleAddChange = (field, value) => setAddForm((p) => ({ ...p, [field]: value }));
  const handleEditChange = (field, value) => setEditForm((p) => ({ ...p, [field]: value }));

  const validateForm = (form) => {
    if (!form.categoryId) return "Please select a category.";
    if (!form.title.trim()) return "Please enter a service title.";
    if (form.pricingType !== "quote") {
      const n = Number(form.priceAmount);
      if (isNaN(n) || n <= 0) return "Please enter a valid price amount.";
    }
    return null;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const validationErr = validateForm(addForm);
    if (validationErr) { setFormError(validationErr); return; }
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/provider/services`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          categoryId: Number(addForm.categoryId),
          title: addForm.title.trim(),
          description: addForm.description.trim(),
          pricingType: addForm.pricingType,
          priceAmount: addForm.pricingType === "quote" ? null : Number(addForm.priceAmount),
          serviceLocationType: addForm.serviceLocationType,
          isVisible: addForm.isVisible,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add service");
      setServices((prev) => [data.service, ...prev]);
      setShowAdd(false);
      setAddForm(EMPTY_FORM);
      flashSuccess(data.message);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (service) => {
    setFormError("");
    setEditForm({
      providerServiceId: service.providerServiceId,
      categoryId: service.categoryId ? String(service.categoryId) : "",
      title: service.title || "",
      description: service.description || "",
      pricingType: service.pricingType || "hourly",
      priceAmount: service.priceAmount !== null ? String(service.priceAmount) : "",
      serviceLocationType: service.serviceLocationType || "client_home",
      isVisible: Boolean(service.isVisible),
    });
    setShowEdit(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const validationErr = validateForm(editForm);
    if (validationErr) { setFormError(validationErr); return; }
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/provider/services/${editForm.providerServiceId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          categoryId: editForm.categoryId ? Number(editForm.categoryId) : null,
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          pricingType: editForm.pricingType,
          priceAmount: editForm.pricingType === "quote" ? null : Number(editForm.priceAmount),
          serviceLocationType: editForm.serviceLocationType,
          isVisible: editForm.isVisible,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update service");
      setServices((prev) =>
        prev.map((s) => s.providerServiceId === editForm.providerServiceId ? data.service : s)
      );
      setShowEdit(false);
      flashSuccess(data.message);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (providerServiceId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/provider/services/${providerServiceId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete service");
      setServices((prev) => prev.filter((s) => s.providerServiceId !== providerServiceId));
      flashSuccess("Service deleted successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  const formatPrice = (s) => {
    if (s.pricingType === "quote") return "Get Quote";
    if (s.priceAmount === null) return "—";
    const sym = "₱";
    return s.pricingType === "hourly" ? `${sym}${s.priceAmount}/hr` : `${sym}${s.priceAmount}`;
  };

  const isAvailable = providerProfile?.isProviderActive ?? true;

  return (
    <>
      <div className="services-widget">
        <div className="services-widget-header">
          <h2 className="widget-title" style={{ margin: 0 }}>My Services</h2>
          <div className="services-widget-actions">
            <button className="btn-add-service" onClick={() => { setFormError(""); setAddForm(EMPTY_FORM); setShowAdd(true); }}>
              + Add Service
            </button>
            <div className="services-availability">
              <div className="services-availability-control">
                <span className="availability-label">Available to clients</span>
                <button
                  className={`availability-toggle ${isAvailable ? "active" : ""} ${availabilitySaving ? "saving" : ""}`}
                  onClick={() => onAvailabilityChange?.(!isAvailable)}
                  aria-label="Toggle availability"
                  aria-pressed={isAvailable}
                  disabled={availabilitySaving}
                >
                  <span className="toggle-circle"></span>
                </button>
              </div>
              <p className="availability-hint">
                {availabilitySaving
                  ? "Saving..."
                  : isAvailable
                  ? "Your services are visible to clients"
                  : "Your services are hidden from search"}
              </p>
              {availabilityError && (
                <p className="availability-save-error">{availabilityError}</p>
              )}
            </div>
          </div>
        </div>

        {success && (
          <p style={{ color: "#16a34a", background: "#f0fdf4", padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 14 }}>
            {success}
          </p>
        )}
        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading services...</p>
        ) : services.length === 0 ? (
          <p className="empty-state">No services yet. Click "+ Add Service" to get started.</p>
        ) : (
          <div className="services-table">
            <div className="table-header">
              <div>Service Title</div>
              <div>Category</div>
              <div>Price</div>
              <div>Status</div>
              <div className="col-actions">Actions</div>
            </div>
            <div className="table-body">
              {services.map((svc) => (
                <div key={svc.providerServiceId} className="table-row">
                  <div className="col-name">
                    <span className="service-name">{svc.title}</span>
                    <span style={{ display: "block", fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      {LOCATION_LABELS[svc.serviceLocationType] || svc.serviceLocationType}
                      {!svc.isVisible && " · Hidden"}
                    </span>
                  </div>
                  <div className="col-category" style={{ fontSize: 13, color: "#475569" }}>{svc.categoryName || "—"}</div>
                  <div className="col-price">
                    <span className="service-price" style={{ fontSize: 13 }}>{formatPrice(svc)}</span>
                  </div>
                  <div className="col-status">
                    <ApprovalBadge status={svc.approvalStatus} />
                  </div>
                  <div className="col-actions">
                    <button className="btn-edit" onClick={() => handleOpenEdit(svc)}>Edit</button>
                    <button
                      className="btn-edit"
                      style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                      onClick={() => handleDelete(svc.providerServiceId, svc.title)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <ServiceFormModal
          title="Add New Service"
          formData={addForm}
          categories={categories}
          onChange={handleAddChange}
          onSubmit={handleAddSubmit}
          onCancel={() => setShowAdd(false)}
          submitting={submitting}
          error={formError}
        />
      )}

      {showEdit && (
        <ServiceFormModal
          title="Edit Service"
          formData={editForm}
          categories={categories}
          onChange={handleEditChange}
          onSubmit={handleEditSubmit}
          onCancel={() => setShowEdit(false)}
          submitting={submitting}
          error={formError}
        />
      )}
    </>
  );
};

export default ProviderServicesWidget;
