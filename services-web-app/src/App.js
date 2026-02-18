import {Routes, Route} from 'react-router-dom';
import './App.css';
import LandingPage from './pages/Landingpage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';  
import ClientDashboard from './pages/ClientDashboardPage.jsx';
import ProviderDashboard from './pages/ProviderDashboard.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/provider-mode" element={<ProviderDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/services" element={<ServicesPage />} />
      </Routes>
    </div>
  );
}

export default App;
