import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileMenuBar from './components/MobileMenuBar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BloodBanks from './pages/BloodBanks';
import BloodBankDetails from './pages/BloodBankDetails';
import Dashboard from './pages/Dashboard';
import BookAppointment from './pages/BookAppointment';
import AppointmentHistory from './pages/AppointmentHistory';
import UrgentRequests from './pages/UrgentRequests';
import Notifications from './pages/Notifications';
import DonationHistory from './pages/DonationHistory';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminAdmins from './pages/AdminAdmins';
import AdminAppointments from './pages/AdminAppointments';
import AdminRequests from './pages/AdminRequests';
import AdminFeedback from './pages/AdminFeedback';
import AdminInventory from './pages/AdminInventory';
import './App.css';

const AUTH_ROUTES = ['/login', '/register'];

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <Navbar
        isMenuOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen((prev) => !prev)}
      />
      <div className="flex flex-1 min-w-0">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/blood-banks" element={<BloodBanks />} />
            <Route path="/blood-banks/:id" element={<BloodBankDetails />} />
            <Route path="/book-appointment" element={
              <ProtectedRoute><BookAppointment /></ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute><AppointmentHistory /></ProtectedRoute>
            } />
            <Route path="/urgent-requests" element={<UrgentRequests />} />
            <Route path="/notifications" element={
              <ProtectedRoute><Notifications /></ProtectedRoute>
            } />
            <Route path="/donation-history" element={
              <ProtectedRoute><DonationHistory /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute><AdminDashboard /></AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute><AdminUsers /></AdminRoute>
            } />
            <Route path="/admin/admins" element={
              <AdminRoute><AdminAdmins /></AdminRoute>
            } />
            <Route path="/admin/appointments" element={
              <AdminRoute><AdminAppointments /></AdminRoute>
            } />
            <Route path="/admin/requests" element={
              <AdminRoute><AdminRequests /></AdminRoute>
            } />
            <Route path="/admin/feedback" element={
              <AdminRoute><AdminFeedback /></AdminRoute>
            } />
            <Route path="/admin/inventory" element={
              <AdminRoute><AdminInventory /></AdminRoute>
            } />
          </Routes>
        </main>
      </div>
      <MobileMenuBar onOpenMenu={() => setSidebarOpen(true)} />
    </div>
  );
}

function App() {
  const location = useLocation();
  const isAuth = AUTH_ROUTES.includes(location.pathname);

  if (isAuth) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }

  return <AppLayout />;
}

export default App;
