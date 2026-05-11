import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";

const AdminPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <DashboardNavbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f2a44", marginBottom: 24 }}>
          Admin Dashboard
        </h1>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <li>
            <button
              onClick={() => navigate("/admin/messages")}
              style={{
                padding: "14px 24px",
                background: "#0d6efd",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Contact Submissions
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPage;
