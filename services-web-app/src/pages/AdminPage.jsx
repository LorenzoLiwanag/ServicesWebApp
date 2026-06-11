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

const th = { padding: "11px 14px", fontWeight: 700, fontSize: 12, color: "#374151", textTransform: "uppercase", letterSpacing: "0.4px" };
const td = { padding: "11px 14px", fontSize: 13, color: "#374151" };

const StatusBadge = ({ label, bg, color }) => (
  <span style={{ background: bg, color, padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
    {label}
  </span>
);

const TABS = ["Users", "Services", "Categories", "Inquiries", "Messages"];

// ── Category form modal ──────────────────────────────────────────────────────

const CategoryFormModal = ({ mode, initial, activeCategories, onSave, onClose, saving, error }) => {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [parentCategoryId, setParentCategoryId] = useState(initial?.parentCategoryId ?? "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, description, parentCategoryId: parentCategoryId || null, sortOrder: Number(sortOrder) });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 460, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f2a44", marginBottom: 20 }}>
          {mode === "create" ? "Add Category" : "Edit Category"}
        </h3>
        {error && (
          <p style={{ color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: 7, fontSize: 13, marginBottom: 14 }}>{error}</p>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              required
              style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box", resize: "vertical" }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Parent Category</label>
            <select
              value={parentCategoryId}
              onChange={(e) => setParentCategoryId(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
            >
              <option value="">— None —</option>
              {activeCategories.filter((c) => c.id !== initial?.id).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ width: 100, padding: "8px 10px", borderRadius: 7, border: "1px solid #cbd5e1", fontSize: 13 }}
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 18px", borderRadius: 7, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: saving ? "#94a3b8" : "#1e3a5f", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Confirm modal ────────────────────────────────────────────────────────────

const ConfirmModal = ({ title, message, confirmLabel, confirmColor, onConfirm, onClose, loading }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
    <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 420, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f2a44", marginBottom: 14 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 7, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading} style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: loading ? "#94a3b8" : (confirmColor || "#dc2626"), color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "..." : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ── Reject modal (with optional reason) ─────────────────────────────────────

const RejectModal = ({ title, itemLabel, onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 440, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f2a44", marginBottom: 10 }}>{title}</h3>
        <p style={{ fontSize: 14, color: "#374151", marginBottom: 16 }}>
          Reject <strong>{itemLabel}</strong>? The user will be notified. This cannot be undone.
        </p>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
            Reason <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Incomplete profile information."
            maxLength={500}
            rows={3}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box", resize: "vertical" }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={loading} style={{ padding: "8px 18px", borderRadius: 7, border: "1px solid #cbd5e1", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim() || null)}
            disabled={loading}
            style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: loading ? "#94a3b8" : "#dc2626", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
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
      {error && (
        <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f" }}>Service Categories</h2>
        <button
          onClick={openCreate}
          style={{ padding: "7px 18px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          + Add Category
        </button>
      </div>

      {loading && <p style={{ color: "#64748b", fontSize: 14 }}>Loading...</p>}
      {!loading && categories.length === 0 && (
        <p style={{ color: "#64748b", fontStyle: "italic", fontSize: 14 }}>No categories yet.</p>
      )}
      {!loading && categories.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <thead>
              <tr style={{ background: "#e2e8f0" }}>
                <th style={th}>Name</th>
                <th style={th}>Description</th>
                <th style={th}>Status</th>
                <th style={th}>Sort</th>
                <th style={th}>Parent</th>
                <th style={th}>Services</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  style={{ borderBottom: "1px solid #e2e8f0", opacity: cat.isActive ? 1 : 0.55 }}
                >
                  <td style={{ ...td, fontWeight: 600 }}>{cat.name}</td>
                  <td style={{ ...td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b" }}>
                    {cat.description || "—"}
                  </td>
                  <td style={td}>
                    {cat.isActive
                      ? <StatusBadge label="Active" bg="#dcfce7" color="#166534" />
                      : <StatusBadge label="Inactive" bg="#f1f5f9" color="#475569" />}
                  </td>
                  <td style={td}>{cat.sortOrder}</td>
                  <td style={td}>{parentName(cat.parentCategoryId)}</td>
                  <td style={td}>
                    <span style={{ fontWeight: 600 }}>{cat.serviceCount}</span>
                  </td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <button
                      onClick={() => openEdit(cat)}
                      style={{ marginRight: 6, padding: "4px 12px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    {cat.isActive ? (
                      <button
                        onClick={() => openDeactivate(cat)}
                        style={{ marginRight: 6, padding: "4px 12px", borderRadius: 6, border: "none", background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(cat)}
                        style={{ marginRight: 6, padding: "4px 12px", borderRadius: 6, border: "none", background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Reactivate
                      </button>
                    )}
                    <span title={cat.serviceCount > 0 ? `Cannot delete — ${cat.serviceCount} service${cat.serviceCount === 1 ? "" : "s"} reference this category. Deactivate it instead.` : ""}>
                      <button
                        onClick={() => cat.serviceCount === 0 && openDelete(cat)}
                        disabled={cat.serviceCount > 0}
                        style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: cat.serviceCount > 0 ? "#e2e8f0" : "#fef2f2", color: cat.serviceCount > 0 ? "#94a3b8" : "#dc2626", fontSize: 12, fontWeight: 600, cursor: cat.serviceCount > 0 ? "not-allowed" : "pointer" }}
                      >
                        Delete
                      </button>
                    </span>
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
          confirmColor="#d97706"
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
          confirmColor="#dc2626"
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

  const loadInquiries = (status) => {
    setInquiriesLoading(true);
    const token = localStorage.getItem("token");
    getContactSubmissions(token, status)
      .then((data) => setInquiries(data.submissions))
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

  const tabStyle = (name) => ({
    padding: "8px 20px",
    borderRadius: 8,
    border: "none",
    background: activeTab === name ? "#1e3a5f" : "transparent",
    color: activeTab === name ? "#fff" : "#475569",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  });

  const actionBtnBase = { padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--app-bg)", backgroundAttachment: "fixed" }}>
      <AdminNavbar />
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px" }}>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f2a44", marginBottom: 8 }}>
          Admin Panel
        </h1>
        <hr style={{ marginBottom: 24, borderColor: "#e2e8f0" }} />

        {/* ── Tab bar ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, borderBottom: "2px solid #e2e8f0", paddingBottom: 4, overflowX: "auto" }}>
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Users tab ── */}
        {activeTab === "Users" && (
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 14 }}>
              Pending User Registrations
            </h2>
            {usersSuccess && (
              <p style={{ color: "#16a34a", background: "#f0fdf4", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 14 }}>{usersSuccess}</p>
            )}
            {usersError && (
              <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 14 }}>{usersError}</p>
            )}
            {usersLoading && <p style={{ color: "#64748b", fontSize: 14 }}>Loading...</p>}
            {!usersLoading && pendingUsers.length === 0 && (
              <p style={{ color: "#64748b", fontStyle: "italic", fontSize: 14 }}>No pending registrations.</p>
            )}
            {!usersLoading && pendingUsers.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <thead>
                    <tr style={{ background: "#e2e8f0" }}>
                      <th style={th}>ID</th><th style={th}>First Name</th><th style={th}>Last Name</th>
                      <th style={th}>Email</th><th style={th}>Registered</th><th style={th}>Status</th><th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={td}>{u.id}</td>
                        <td style={td}>{u.first_name}</td>
                        <td style={td}>{u.last_name}</td>
                        <td style={td}>{u.email}</td>
                        <td style={td}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td style={td}><StatusBadge label="pending" bg="#fef3c7" color="#92400e" /></td>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>
                          <button
                            onClick={() => handleApproveUser(u.id)}
                            disabled={approvingUserId === u.id || rejectingUserId === u.id}
                            style={{ ...actionBtnBase, marginRight: 6, background: approvingUserId === u.id ? "#94a3b8" : "#16a34a", color: "#fff" }}
                          >
                            {approvingUserId === u.id ? "Approving..." : "Approve"}
                          </button>
                          <button
                            onClick={() => setRejectUserModal(u)}
                            disabled={approvingUserId === u.id || rejectingUserId === u.id}
                            style={{ ...actionBtnBase, background: rejectingUserId === u.id ? "#94a3b8" : "#fef2f2", color: rejectingUserId === u.id ? "#fff" : "#dc2626", border: "1px solid #fca5a5" }}
                          >
                            {rejectingUserId === u.id ? "Rejecting..." : "Reject"}
                          </button>
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
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 14 }}>
              Pending Service Approvals
            </h2>
            {servicesSuccess && (
              <p style={{ color: "#16a34a", background: "#f0fdf4", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 14 }}>{servicesSuccess}</p>
            )}
            {servicesError && (
              <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 14 }}>{servicesError}</p>
            )}
            {servicesLoading && <p style={{ color: "#64748b", fontSize: 14 }}>Loading...</p>}
            {!servicesLoading && pendingServices.length === 0 && (
              <p style={{ color: "#64748b", fontStyle: "italic", fontSize: 14 }}>No pending service approvals.</p>
            )}
            {!servicesLoading && pendingServices.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <thead>
                    <tr style={{ background: "#e2e8f0" }}>
                      <th style={th}>ID</th><th style={th}>Provider</th><th style={th}>Title</th>
                      <th style={th}>Category</th><th style={th}>Pricing</th><th style={th}>Location</th>
                      <th style={th}>Submitted</th><th style={th}>Status</th><th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingServices.map((svc) => (
                      <tr key={svc.serviceId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={td}>{svc.serviceId}</td>
                        <td style={td}>
                          <span style={{ fontWeight: 600 }}>{svc.providerFirstName} {svc.providerLastName}</span>
                          <br /><span style={{ fontSize: 11, color: "#94a3b8" }}>{svc.providerEmail}</span>
                        </td>
                        <td style={td}>
                          <span style={{ fontWeight: 600 }}>{svc.title}</span>
                          {svc.description && (
                            <span style={{ display: "block", fontSize: 11, color: "#64748b", marginTop: 2, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {svc.description}
                            </span>
                          )}
                        </td>
                        <td style={td}>{svc.categoryName || "—"}</td>
                        <td style={td}>{formatPrice(svc)}</td>
                        <td style={td}>{svc.serviceLocationType?.replace("_", " ") || "—"}</td>
                        <td style={td}>{new Date(svc.updatedAt).toLocaleDateString()}</td>
                        <td style={td}><StatusBadge label="pending" bg="#fef3c7" color="#92400e" /></td>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>
                          <button
                            onClick={() => handleApproveService(svc.serviceId)}
                            disabled={approvingServiceId === svc.serviceId || rejectingServiceId === svc.serviceId}
                            style={{ ...actionBtnBase, marginRight: 6, background: approvingServiceId === svc.serviceId ? "#94a3b8" : "#16a34a", color: "#fff" }}
                          >
                            {approvingServiceId === svc.serviceId ? "Approving..." : "Approve"}
                          </button>
                          <button
                            onClick={() => setRejectServiceModal(svc)}
                            disabled={approvingServiceId === svc.serviceId || rejectingServiceId === svc.serviceId}
                            style={{ ...actionBtnBase, background: rejectingServiceId === svc.serviceId ? "#94a3b8" : "#fef2f2", color: rejectingServiceId === svc.serviceId ? "#fff" : "#dc2626", border: "1px solid #fca5a5" }}
                          >
                            {rejectingServiceId === svc.serviceId ? "Rejecting..." : "Reject"}
                          </button>
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
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 14 }}>Contact Inquiries</h2>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {["all", "new", "read", "resolved", "archived"].map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid #cbd5e1", background: inquiryFilter === f ? "#1e3a5f" : "#fff", color: inquiryFilter === f ? "#fff" : "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}
                >
                  {f}
                </button>
              ))}
            </div>
            {inquiriesError && (
              <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 14 }}>{inquiriesError}</p>
            )}
            {inquiriesLoading && <p style={{ color: "#64748b", fontSize: 14 }}>Loading...</p>}
            {!inquiriesLoading && inquiries.length === 0 && (
              <p style={{ color: "#64748b", fontStyle: "italic", fontSize: 14 }}>No inquiries found.</p>
            )}
            {!inquiriesLoading && inquiries.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <thead>
                    <tr style={{ background: "#e2e8f0" }}>
                      <th style={th}>ID</th><th style={th}>Name</th><th style={th}>Email</th>
                      <th style={th}>Subject</th><th style={th}>Message</th><th style={th}>Date</th>
                      <th style={th}>Status</th><th style={th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((inq) => (
                      <tr key={inq.id} style={{ borderBottom: "1px solid #e2e8f0", verticalAlign: "top" }}>
                        <td style={td}>{inq.id}</td>
                        <td style={td}>{inq.name}</td>
                        <td style={td}>{inq.email}</td>
                        <td style={td}>{inq.subject}</td>
                        <td style={{ ...td, maxWidth: 240 }}>
                          <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {inq.message}
                          </span>
                        </td>
                        <td style={td}>{new Date(inq.created_at).toLocaleDateString()}</td>
                        <td style={td}>{inquiryStatusBadge(inq.status)}</td>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>
                          <select
                            value={inq.status}
                            disabled={updatingInquiryId === inq.id}
                            onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                            style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, cursor: "pointer" }}
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
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 14 }}>Message Logs</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 14 }}>
              View all in-app messages sent between users.
            </p>
            <Link
              to="/admin/messages"
              style={{ display: "inline-block", padding: "8px 20px", background: "#1e3a5f", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}
            >
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
