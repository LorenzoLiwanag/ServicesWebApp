import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/Landingpage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';
import ClientDashboard from './pages/ClientDashboardPage.jsx';
import ProviderDashboard from './pages/ProviderDashboard.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import ServiceDetailPage from './pages/ServiceDetailPage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AdminMessagesPage from './pages/AdminMessagesPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import { getStoredAuthSession, validateStoredSession } from './utils/auth.js';

const RequireAuth = ({ children }) => {
  const authSession = getStoredAuthSession();
  return authSession ? children : <Navigate to="/login" replace />;
};

const RequireRole = ({ children, role }) => {
  const authSession = getStoredAuthSession();
  if (!authSession) return <Navigate to="/login" replace />;
  if (authSession.user?.role !== role) return <Navigate to="/client-dashboard" replace />;
  return children;
};

function App() {
  useEffect(() => {
    validateStoredSession();
  }, []);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/client-dashboard"
          element={
            <RequireAuth>
              <ClientDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/provider-mode"
          element={
            <RequireAuth>
              <ProviderDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/services"
          element={
            <RequireAuth>
              <ServicesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/service/:serviceId"
          element={
            <RequireAuth>
              <ServiceDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <RequireAuth>
              <MyBookingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/messages"
          element={
            <RequireAuth>
              <MessagesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <AdminPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <RequireRole role="admin">
              <AdminMessagesPage />
            </RequireRole>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
