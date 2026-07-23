import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminNavbar from "../components/dashboard/AdminNavbar";
import {
  fetchPendingUsers,
  approveUser,
  rejectUser,
  fetchPendingServices,
  approveProviderService,
  rejectProviderService,
  fetchCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
  reactivateCategory,
  deleteCategory,
} from "../api/admin.js";
import { getContactSubmissions, updateContactSubmission } from "../api/contact.js";
import "../styles/admin/adminPanel.css";

const StatusBadge = ({ label, bg, color }) => (
  <span className="ap-badge" style={{ background: bg, color }}>
    {label}
  </span>
);

const TABS = ["Users", "Services", "Categories", "Inquiries", "Messages"];

const LoadingSkeleton = () => (
  <div className="ap-skeleton" aria-label="Loading">
    <div className="ap-skeleton-row" />
    <div className="ap-skeleton-row" />
    <div className="ap-skeleton-row" />
  </div>
);

const EmptyState = ({ icon, text }) => (
  <div className="ap-empty">
    <span className="ap-empty-icon" aria-hidden="true">{icon}</span>
    <p className="ap-empty-text">{text}</p>
  </div>
);

// Closes on Escape / backdrop click unless the modal is mid-request
const useModalDismiss = (onClose, busy) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  return (e) => {
    if (e.target === e.currentTarget && !busy) onClose();
  };
};

// ── Category form modal ──────────────────────────────────────────────────────

const CategoryFormModal = ({ mode, initial, activeCategories, onSave, onClose, saving, error }) => {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [parentCategoryId, setParentCategoryId] = useState(initial?.parentCategoryId ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);

  const handleBackdrop = useModalDismiss(onClose, saving);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, description, parentCategoryId: parentCategoryId || null, sortOrder: Number(sortOrder) });
  };

  return (
    <div className="ap-modal-overlay" onMouseDown={handleBackdrop}>
      <div className="ap-modal" role="dialog" aria-modal="true">
        <h3 className="ap-modal-title">
          {mode === "create" ? "Add Category" : "Edit Category"}
        </h3>
        {error && <p className="ap-modal-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="ap-form-group">
            <label className="ap-label">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              required
              className="ap-input"
            />
          </div>
          <div className="ap-form-group">
            <label className="ap-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="ap-textarea"
            />
          </div>
          <div className="ap-form-group">
            <label className="ap-label">Parent Category</label>
            <select
              value={parentCategoryId}
              onChange={(e) => setParentCategoryId(e.target.value)}
              className="ap-form-select"
            >
              <option value="">— None —</option>
              {activeCategories.filter((c) => c.id !== initial?.id).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="ap-form-group">
            <label className="ap-label">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="ap-input ap-input--short"
            />
          </div>
          <div className="ap-modal-actions">
            <button type="button" onClick={onClose} className="ap-btn ap-btn--secondary" style={{ padding: "8px 18px", fontSize: 13 }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={`ap-btn ap-btn--primary ${saving ? "ap-btn--loading" : ""}`}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Confirm modal ────────────────────────────────────────────────────────────

const ConfirmModal = ({ title, message, confirmLabel, confirmVariant, onConfirm, onClose, loading }) => {
  const handleBackdrop = useModalDismiss(onClose, loading);

  return (
    <div className="ap-modal-overlay" onMouseDown={handleBackdrop}>
      <div className="ap-modal ap-modal--narrow" role="dialog" aria-modal="true">
        <h3 className="ap-modal-title">{title}</h3>
        <p className="ap-modal-text">{message}</p>
        <div className="ap-modal-actions">
          <button onClick={onClose} className="ap-btn ap-btn--secondary" style={{ padding: "8px 18px", fontSize: 13 }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`ap-btn ${confirmVariant === "amber" ? "ap-btn--amber" : "ap-btn--danger"} ${loading ? "ap-btn--loading" : ""}`}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Reject modal (with optional reason) ─────────────────────────────────────

const RejectModal = ({ title, itemLabel, onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState("");
  const handleBackdrop = useModalDismiss(onClose, loading);

  return (
    <div className="ap-modal-overlay" onMouseDown={handleBackdrop}>
      <div className="ap-modal" role="dialog" aria-modal="true">
        <h3 className="ap-modal-title">{title}</h3>
        <p className="ap-modal-text" style={{ marginBottom: 16 }}>
          Reject <strong>{itemLabel}</strong>? The user will be notified. This cannot be undone.
        </p>
        <div className="ap-form-group">
          <label className="ap-label">
            Reason <span className="ap-label-optional">(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Incomplete profile information."
            maxLength={500}
            rows={3}
            className="ap-textarea"
          />
        </div>
        <div className="ap-modal-actions">
          <button onClick={onClose} disabled={loading} className="ap-btn ap-btn--secondary" style={{ padding: "8px 18px", fontSize: 13 }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim() || null)}
            disabled={loading}
            className={`ap-btn ap-btn--danger ${loading ? "ap-btn--loading" : ""}`}
          >
            {loading ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Categories tab ───────────────────────────────────────────────────────────

const CategoriesTab = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadCategories = () => {
    setLoading(true);
    fetchCategories()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const activeCategories = categories.filter((c) => c.isActive);

  const openCreate = () => { setModalError(""); setModal({ type: "create" }); };
  const openEdit = (cat) => { setModalError(""); setModal({ type: "edit", category: cat }); };
  const openDeactivate = (cat) => setModal({ type: "deactivate", category: cat });
  const openDelete = (cat) => setModal({ type: "delete", category: cat });
  const closeModal = () => { setModal(null); setModalError(""); };

  const handleSave = async (body) => {
    setModalSaving(true);
    setModalError("");
    try {
      if (modal.type === "create") {
        await createCategory(body);
      } else {
        await updateCategory(modal.category.id, body);
      }
      loadCategories();
      closeModal();
    } catch (e) {
      setModalError(e.message);
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setModalSaving(true);
    try {
      await deactivateCategory(modal.category.id);
      loadCategories();
      closeModal();
    } catch (e) {
      setError(e.message);
      closeModal();
    } finally {
      setModalSaving(false);
    }
  };

  const handleReactivate = async (cat) => {
    try {
      await reactivateCategory(cat.id);
      loadCategories();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async () => {
    setModalSaving(true);
    try {
      await deleteCategory(modal.category.id);
      loadCategories();
      closeModal();
    } catch (e) {
      setError(e.message);
      closeModal();
    } finally {
      setModalSaving(false);
    }
  };

  const parentName = (parentId) => {
    if (!parentId) return "—";
    const p = categories.find((c) => c.id === parentId);
    return p ? p.name : "—";
  };

  return (
    <div>
      {error && <p className="ap-banner ap-banner--error">{error}</p>}

      <div className="ap-toolbar">
        <h2 className="ap-section-title" style={{ margin: 0 }}>Service Categories</h2>
        <button onClick={openCreate} className="ap-btn ap-btn--primary">
          + Add Category
        </button>
      </div>

      {loading && <LoadingSkeleton />}
      {!loading && categories.length === 0 && (
        <EmptyState icon="🗂️" text="No categories yet." />
      )}
      {!loading && categories.length > 0 && (
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Sort</th>
                <th>Parent</th>
                <th>Services</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className={cat.isActive ? "" : "ap-row--inactive"}>
                  <td data-label="Name" className="ap-cell-strong">{cat.name}</td>
                  <td data-label="Description" className="ap-cell-clip">
                    {cat.description || "—"}
                  </td>
                  <td data-label="Status">
                    {cat.isActive
                      ? <StatusBadge label="Active" bg="#dcfce7" color="#166534" />
                      : <StatusBadge label="Inactive" bg="#f1f5f9" color="#475569" />}
                  </td>
                  <td data-label="Sort">{cat.sortOrder}</td>
                  <td data-label="Parent">{parentName(cat.parentCategoryId)}</td>
                  <td data-label="Services">
                    <span className="ap-cell-strong">{cat.serviceCount}</span>
                  </td>
                  <td data-label="Actions" className="ap-cell-actions">
                    <div className="ap-actions-row">
                      <button onClick={() => openEdit(cat)} className="ap-btn ap-btn--secondary">
                        Edit
                      </button>
                      {cat.isActive ? (
                        <button onClick={() => openDeactivate(cat)} className="ap-btn ap-btn--warn-soft">
                          Deactivate
                        </button>
                      ) : (
                        <button onClick={() => handleReactivate(cat)} className="ap-btn ap-btn--success-soft">
                          Reactivate
                        </button>
                      )}
                      <span title={cat.serviceCount > 0 ? `Cannot delete — ${cat.serviceCount} service${cat.serviceCount === 1 ? "" : "s"} reference this category. Deactivate it instead.` : ""}>
                        <button
                          onClick={() => cat.serviceCount === 0 && openDelete(cat)}
                          disabled={cat.serviceCount > 0}
                          className="ap-btn ap-btn--danger-soft"
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ── */}
      {(modal?.type === "create" || modal?.type === "edit") && (
        <CategoryFormModal
          mode={modal.type}
          initial={modal.category}
          activeCategories={activeCategories}
          onSave={handleSave}
          onClose={closeModal}
          saving={modalSaving}
          error={modalError}
        />
      )}
      {modal?.type === "deactivate" && (
        <ConfirmModal
          title="Deactivate Category"
          message={`Deactivating "${modal.category.name}" will hide ${modal.category.serviceCount} service${modal.category.serviceCount === 1 ? "" : "s"} from client browse until they are reassigned or this category is reactivated. Providers will no longer see this category when adding new services. Are you sure?`}
          confirmLabel="Deactivate"
          confirmVariant="amber"
          onConfirm={handleDeactivate}
          onClose={closeModal}
          loading={modalSaving}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title="Delete Category"
          message={`Permanently delete "${modal.category.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={closeModal}
          loading={modalSaving}
        />
      )}
    </div>
  );
};

// ── Main AdminPage ───────────────────────────────────────────────────────────

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("Users");

  const [pendingUsers, setPendingUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [usersSuccess, setUsersSuccess] = useState("");
  const [approvingUserId, setApprovingUserId] = useState(null);
  const [rejectUserModal, setRejectUserModal] = useState(null);
  const [rejectingUserId, setRejectingUserId] = useState(null);

  const [pendingServices, setPendingServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [servicesSuccess, setServicesSuccess] = useState("");
  const [approvingServiceId, setApprovingServiceId] = useState(null);
  const [rejectServiceModal, setRejectServiceModal] = useState(null);
  const [rejectingServiceId, setRejectingServiceId] = useState(null);

  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [inquiriesError, setInquiriesError] = useState("");
  const [updatingInquiryId, setUpdatingInquiryId] = useState(null);
  const [inquiryFilter, setInquiryFilter] = useState("all");
  const [newInquiryCount, setNewInquiryCount] = useState(0);

  const loadInquiries = (status) => {
    setInquiriesLoading(true);
    const token = localStorage.getItem("token");
    getContactSubmissions(token, status)
      .then((data) => {
        setInquiries(data.submissions);
        if (status === "all") {
          setNewInquiryCount(data.submissions.filter((s) => s.status === "new").length);
        }
      })
      .catch((e) => setInquiriesError(e.message))
      .finally(() => setInquiriesLoading(false));
  };

  useEffect(() => {
    fetchPendingUsers()
      .then(setPendingUsers)
      .catch((e) => setUsersError(e.message))
      .finally(() => setUsersLoading(false));

    fetchPendingServices()
      .then(setPendingServices)
      .catch((e) => setServicesError(e.message))
      .finally(() => setServicesLoading(false));

    loadInquiries("all");
  }, []);

  const handleApproveUser = async (userId) => {
    setApprovingUserId(userId);
    setUsersError("");
    setUsersSuccess("");
    try {
      await approveUser(userId);
      setUsersSuccess(`User #${userId} approved successfully.`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      setUsersError(e.message);
    } finally {
      setApprovingUserId(null);
    }
  };

  const handleRejectUser = async (reason) => {
    const userId = rejectUserModal.id;
    setRejectingUserId(userId);
    setUsersError("");
    setUsersSuccess("");
    try {
      await rejectUser(userId, reason);
      setUsersSuccess(`User #${userId} rejected.`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      setRejectUserModal(null);
    } catch (e) {
      setUsersError(e.message);
      setRejectUserModal(null);
    } finally {
      setRejectingUserId(null);
    }
  };

  const handleApproveService = async (serviceId) => {
    setApprovingServiceId(serviceId);
    setServicesError("");
    setServicesSuccess("");
    try {
      await approveProviderService(serviceId);
      setServicesSuccess(`Service #${serviceId} approved successfully.`);
      setPendingServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
    } catch (e) {
      setServicesError(e.message);
    } finally {
      setApprovingServiceId(null);
    }
  };

  const handleRejectService = async (reason) => {
    const serviceId = rejectServiceModal.serviceId;
    setRejectingServiceId(serviceId);
    setServicesError("");
    setServicesSuccess("");
    try {
      await rejectProviderService(serviceId, reason);
      setServicesSuccess(`Service #${serviceId} rejected.`);
      setPendingServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
      setRejectServiceModal(null);
    } catch (e) {
      setServicesError(e.message);
      setRejectServiceModal(null);
    } finally {
      setRejectingServiceId(null);
    }
  };

  const handleUpdateInquiryStatus = async (id, status) => {
    setUpdatingInquiryId(id);
    const token = localStorage.getItem("token");
    try {
      await updateContactSubmission(token, id, status);
      setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    } catch (e) {
      setInquiriesError(e.message);
    } finally {
      setUpdatingInquiryId(null);
    }
  };

  const handleFilterChange = (status) => {
    setInquiryFilter(status);
    loadInquiries(status);
  };

  const inquiryStatusBadge = (status) => {
    const map = {
      new:      { bg: "#dbeafe", color: "#1e40af" },
      read:     { bg: "#e0e7ff", color: "#3730a3" },
      resolved: { bg: "#dcfce7", color: "#166534" },
      archived: { bg: "#f1f5f9", color: "#475569" },
    };
    const s = map[status] || map.new;
    return <StatusBadge label={status} bg={s.bg} color={s.color} />;
  };

  const formatPrice = (svc) => {
    if (svc.pricingType === "quote") return "Get Quote";
    if (svc.priceAmount === null) return "—";
    const symbols = { PHP: "₱", CAD: "CA$", USD: "$" };
    const sym = symbols[svc.currency] || `${svc.currency || ""} `;
    return svc.pricingType === "hourly" ? `${sym}${svc.priceAmount}/hr` : `${sym}${svc.priceAmount}`;
  };

  const tabCounts = {
    Users: pendingUsers.length,
    Services: pendingServices.length,
    Inquiries: newInquiryCount,
  };

  return (
    <div className="ap-page">
      <AdminNavbar />
      <div className="ap-container">

        <h1 className="ap-title">Admin Panel</h1>

        {/* ── Stat cards ── */}
        <div className="ap-stats">
          <div className="ap-stat-card">
            <span className="ap-stat-icon ap-stat-icon--warn" aria-hidden="true">👤</span>
            <div>
              <p className="ap-stat-label">Pending Users</p>
              <p className="ap-stat-value">{usersLoading ? "—" : pendingUsers.length}</p>
            </div>
          </div>
          <div className="ap-stat-card">
            <span className="ap-stat-icon" aria-hidden="true">🛠️</span>
            <div>
              <p className="ap-stat-label">Pending Services</p>
              <p className="ap-stat-value">{servicesLoading ? "—" : pendingServices.length}</p>
            </div>
          </div>
          <div className="ap-stat-card">
            <span className="ap-stat-icon ap-stat-icon--info" aria-hidden="true">✉️</span>
            <div>
              <p className="ap-stat-label">New Inquiries</p>
              <p className="ap-stat-value">{inquiriesLoading ? "—" : newInquiryCount}</p>
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="ap-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`ap-tab ${activeTab === tab ? "active" : ""}`}
              role="tab"
              aria-selected={activeTab === tab}
            >
              {tab}
              {tabCounts[tab] > 0 && <span className="ap-tab-badge">{tabCounts[tab]}</span>}
            </button>
          ))}
        </div>

        {/* ── Users tab ── */}
        {activeTab === "Users" && (
          <section>
            <h2 className="ap-section-title">Pending User Registrations</h2>
            {usersSuccess && <p className="ap-banner ap-banner--success">{usersSuccess}</p>}
            {usersError && <p className="ap-banner ap-banner--error">{usersError}</p>}
            {usersLoading && <LoadingSkeleton />}
            {!usersLoading && pendingUsers.length === 0 && (
              <EmptyState icon="✅" text="No pending registrations." />
            )}
            {!usersLoading && pendingUsers.length > 0 && (
              <div className="ap-table-wrap">
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>First Name</th><th>Last Name</th>
                      <th>Email</th><th>Registered</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((u) => (
                      <tr key={u.id}>
                        <td data-label="ID">{u.id}</td>
                        <td data-label="First Name">{u.first_name}</td>
                        <td data-label="Last Name">{u.last_name}</td>
                        <td data-label="Email">{u.email}</td>
                        <td data-label="Registered">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td data-label="Status"><StatusBadge label="pending" bg="#fef3c7" color="#92400e" /></td>
                        <td data-label="Actions" className="ap-cell-actions">
                          <div className="ap-actions-row">
                            <button
                              onClick={() => handleApproveUser(u.id)}
                              disabled={approvingUserId === u.id || rejectingUserId === u.id}
                              className={`ap-btn ap-btn--approve ${approvingUserId === u.id ? "ap-btn--loading" : ""}`}
                            >
                              {approvingUserId === u.id ? "Approving..." : "Approve"}
                            </button>
                            <button
                              onClick={() => setRejectUserModal(u)}
                              disabled={approvingUserId === u.id || rejectingUserId === u.id}
                              className={`ap-btn ap-btn--reject ${rejectingUserId === u.id ? "ap-btn--loading" : ""}`}
                            >
                              {rejectingUserId === u.id ? "Rejecting..." : "Reject"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── Services tab ── */}
        {activeTab === "Services" && (
          <section>
            <h2 className="ap-section-title">Pending Service Approvals</h2>
            {servicesSuccess && <p className="ap-banner ap-banner--success">{servicesSuccess}</p>}
            {servicesError && <p className="ap-banner ap-banner--error">{servicesError}</p>}
            {servicesLoading && <LoadingSkeleton />}
            {!servicesLoading && pendingServices.length === 0 && (
              <EmptyState icon="✅" text="No pending service approvals." />
            )}
            {!servicesLoading && pendingServices.length > 0 && (
              <div className="ap-table-wrap">
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Provider</th><th>Title</th>
                      <th>Category</th><th>Pricing</th><th>Location</th>
                      <th>Submitted</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingServices.map((svc) => (
                      <tr key={svc.serviceId}>
                        <td data-label="ID">{svc.serviceId}</td>
                        <td data-label="Provider">
                          <span className="ap-cell-strong">{svc.providerFirstName} {svc.providerLastName}</span>
                          <span className="ap-cell-sub">{svc.providerEmail}</span>
                        </td>
                        <td data-label="Title">
                          <span className="ap-cell-strong">{svc.title}</span>
                          {svc.description && (
                            <span className="ap-cell-sub ap-cell-clip" style={{ color: "#64748b" }}>
                              {svc.description}
                            </span>
                          )}
                        </td>
                        <td data-label="Category">{svc.categoryName || "—"}</td>
                        <td data-label="Pricing">{formatPrice(svc)}</td>
                        <td data-label="Location">{svc.serviceLocationType?.replace("_", " ") || "—"}</td>
                        <td data-label="Submitted">{new Date(svc.updatedAt).toLocaleDateString()}</td>
                        <td data-label="Status"><StatusBadge label="pending" bg="#fef3c7" color="#92400e" /></td>
                        <td data-label="Actions" className="ap-cell-actions">
                          <div className="ap-actions-row">
                            <button
                              onClick={() => handleApproveService(svc.serviceId)}
                              disabled={approvingServiceId === svc.serviceId || rejectingServiceId === svc.serviceId}
                              className={`ap-btn ap-btn--approve ${approvingServiceId === svc.serviceId ? "ap-btn--loading" : ""}`}
                            >
                              {approvingServiceId === svc.serviceId ? "Approving..." : "Approve"}
                            </button>
                            <button
                              onClick={() => setRejectServiceModal(svc)}
                              disabled={approvingServiceId === svc.serviceId || rejectingServiceId === svc.serviceId}
                              className={`ap-btn ap-btn--reject ${rejectingServiceId === svc.serviceId ? "ap-btn--loading" : ""}`}
                            >
                              {rejectingServiceId === svc.serviceId ? "Rejecting..." : "Reject"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── Categories tab ── */}
        {activeTab === "Categories" && <CategoriesTab />}

        {/* ── Inquiries tab ── */}
        {activeTab === "Inquiries" && (
          <section>
            <h2 className="ap-section-title">Contact Inquiries</h2>
            <div className="ap-filter-row">
              {["all", "new", "read", "resolved", "archived"].map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`ap-chip ${inquiryFilter === f ? "active" : ""}`}
                >
                  {f}
                </button>
              ))}
            </div>
            {inquiriesError && <p className="ap-banner ap-banner--error">{inquiriesError}</p>}
            {inquiriesLoading && <LoadingSkeleton />}
            {!inquiriesLoading && inquiries.length === 0 && (
              <EmptyState icon="📭" text="No inquiries found." />
            )}
            {!inquiriesLoading && inquiries.length > 0 && (
              <div className="ap-table-wrap">
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Name</th><th>Email</th>
                      <th>Subject</th><th>Message</th><th>Date</th>
                      <th>Status</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((inq) => (
                      <tr key={inq.id}>
                        <td data-label="ID">{inq.id}</td>
                        <td data-label="Name">{inq.name}</td>
                        <td data-label="Email">{inq.email}</td>
                        <td data-label="Subject">{inq.subject}</td>
                        <td data-label="Message" style={{ maxWidth: 240 }}>
                          <span className="ap-cell-clamp">{inq.message}</span>
                        </td>
                        <td data-label="Date">{new Date(inq.created_at).toLocaleDateString()}</td>
                        <td data-label="Status">{inquiryStatusBadge(inq.status)}</td>
                        <td data-label="Action" className="ap-cell-actions">
                          <select
                            value={inq.status}
                            disabled={updatingInquiryId === inq.id}
                            onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                            className="ap-select"
                          >
                            <option value="new">new</option>
                            <option value="read">read</option>
                            <option value="resolved">resolved</option>
                            <option value="archived">archived</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── Messages tab ── */}
        {activeTab === "Messages" && (
          <section>
            <h2 className="ap-section-title">Message Logs</h2>
            <p className="ap-section-note">
              View all in-app messages sent between users.
            </p>
            <Link to="/admin/messages" className="ap-btn ap-btn--primary" style={{ textDecoration: "none" }}>
              View Message Logs
            </Link>
          </section>
        )}

      </div>

      {/* ── Reject user modal ── */}
      {rejectUserModal && (
        <RejectModal
          title="Reject User Registration"
          itemLabel={`${rejectUserModal.first_name} ${rejectUserModal.last_name} (${rejectUserModal.email})`}
          onConfirm={handleRejectUser}
          onClose={() => setRejectUserModal(null)}
          loading={rejectingUserId === rejectUserModal.id}
        />
      )}

      {/* ── Reject service modal ── */}
      {rejectServiceModal && (
        <RejectModal
          title="Reject Service Submission"
          itemLabel={rejectServiceModal.title}
          onConfirm={handleRejectService}
          onClose={() => setRejectServiceModal(null)}
          loading={rejectingServiceId === rejectServiceModal.serviceId}
        />
      )}
    </div>
  );
};

export default AdminPage;
