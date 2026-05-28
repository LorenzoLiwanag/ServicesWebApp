import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import { fetchPendingUsers, approveUser, fetchPendingServices, approveProviderService } from "../api/admin.js";

const th = { padding: "11px 14px", fontWeight: 700, fontSize: 12, color: "#374151", textTransform: "uppercase", letterSpacing: "0.4px" };
const td = { padding: "11px 14px", fontSize: 13, color: "#374151" };

const StatusBadge = ({ label, bg, color }) => (
  <span style={{ background: bg, color, padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
    {label}
  </span>
);

const AdminPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [usersSuccess, setUsersSuccess] = useState("");
  const [approvingUserId, setApprovingUserId] = useState(null);

  const [pendingServices, setPendingServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [servicesSuccess, setServicesSuccess] = useState("");
  const [approvingServiceId, setApprovingServiceId] = useState(null);

  useEffect(() => {
    fetchPendingUsers()
      .then(setPendingUsers)
      .catch((e) => setUsersError(e.message))
      .finally(() => setUsersLoading(false));

    fetchPendingServices()
      .then(setPendingServices)
      .catch((e) => setServicesError(e.message))
      .finally(() => setServicesLoading(false));
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

  const formatPrice = (svc) => {
    if (svc.pricingType === "quote") return "Get Quote";
    if (svc.priceAmount === null) return "—";
    const sym = svc.currency === "CAD" ? "CA$" : (svc.currency || "");
    return svc.pricingType === "hourly" ? `${sym}${svc.priceAmount}/hr` : `${sym}${svc.priceAmount}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <DashboardNavbar />
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "40px 24px" }}>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f2a44", marginBottom: 8 }}>
          Welcome Admin
        </h1>
        <hr style={{ marginBottom: 36, borderColor: "#e2e8f0" }} />

        {/* ── Pending User Registrations ── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 14 }}>
            Pending User Registrations
          </h2>

          {usersSuccess && (
            <p style={{ color: "#16a34a", background: "#f0fdf4", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 14 }}>
              {usersSuccess}
            </p>
          )}
          {usersError && (
            <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 14 }}>
              {usersError}
            </p>
          )}

          {usersLoading && <p style={{ color: "#64748b", fontSize: 14 }}>Loading...</p>}
          {!usersLoading && pendingUsers.length === 0 && (
            <p style={{ color: "#64748b", fontStyle: "italic", fontSize: 14 }}>No pending registrations.</p>
          )}
          {!usersLoading && pendingUsers.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <thead>
                <tr style={{ background: "#e2e8f0" }}>
                  <th style={th}>ID</th>
                  <th style={th}>First Name</th>
                  <th style={th}>Last Name</th>
                  <th style={th}>Email</th>
                  <th style={th}>Registered</th>
                  <th style={th}>Status</th>
                  <th style={th}>Action</th>
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
                    <td style={td}>
                      <button
                        onClick={() => handleApproveUser(u.id)}
                        disabled={approvingUserId === u.id}
                        style={{ padding: "5px 14px", background: approvingUserId === u.id ? "#94a3b8" : "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: approvingUserId === u.id ? "not-allowed" : "pointer" }}
                      >
                        {approvingUserId === u.id ? "Approving..." : "Approve"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* ── Pending Service Approvals ── */}
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 14 }}>
            Pending Service Approvals
          </h2>

          {servicesSuccess && (
            <p style={{ color: "#16a34a", background: "#f0fdf4", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 14 }}>
              {servicesSuccess}
            </p>
          )}
          {servicesError && (
            <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, marginBottom: 14, fontSize: 14 }}>
              {servicesError}
            </p>
          )}

          {servicesLoading && <p style={{ color: "#64748b", fontSize: 14 }}>Loading...</p>}
          {!servicesLoading && pendingServices.length === 0 && (
            <p style={{ color: "#64748b", fontStyle: "italic", fontSize: 14 }}>No pending service approvals.</p>
          )}
          {!servicesLoading && pendingServices.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <thead>
                <tr style={{ background: "#e2e8f0" }}>
                  <th style={th}>ID</th>
                  <th style={th}>Provider</th>
                  <th style={th}>Title</th>
                  <th style={th}>Category</th>
                  <th style={th}>Pricing</th>
                  <th style={th}>Location</th>
                  <th style={th}>Submitted</th>
                  <th style={th}>Status</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingServices.map((svc) => (
                  <tr key={svc.serviceId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={td}>{svc.serviceId}</td>
                    <td style={td}>
                      <span style={{ fontWeight: 600 }}>{svc.providerFirstName} {svc.providerLastName}</span>
                      <br />
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{svc.providerEmail}</span>
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
                    <td style={td}>
                      <button
                        onClick={() => handleApproveService(svc.serviceId)}
                        disabled={approvingServiceId === svc.serviceId}
                        style={{ padding: "5px 14px", background: approvingServiceId === svc.serviceId ? "#94a3b8" : "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: approvingServiceId === svc.serviceId ? "not-allowed" : "pointer" }}
                      >
                        {approvingServiceId === svc.serviceId ? "Approving..." : "Approve"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* ── Message Logs ── */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 14 }}>
            Message Logs
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 14 }}>
            View all in-app messages sent between users.
          </p>
          <Link
            to="/admin/messages"
            style={{
              display: "inline-block",
              padding: "8px 20px",
              background: "#1e3a5f",
              color: "#fff",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            View Message Logs
          </Link>
        </section>

      </div>
    </div>
  );
};

export default AdminPage;
