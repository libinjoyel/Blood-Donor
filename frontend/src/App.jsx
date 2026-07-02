import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BloodBanks from './pages/BloodBanks';
import BloodBankDetails from './pages/BloodBankDetails';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import BookAppointment from './pages/BookAppointment';
import AppointmentHistory from './pages/AppointmentHistory';
import UrgentRequests from './pages/UrgentRequests';
import Notifications from './pages/Notifications';
import DonationHistory from './pages/DonationHistory';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminAppointments from './pages/AdminAppointments';
import AdminRequests from './pages/AdminRequests';
import AdminFeedback from './pages/AdminFeedback';
import AdminBloodBanks from './pages/AdminBloodBanks';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="app-body">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/blood-banks" element={<BloodBanks />} />
            <Route path="/blood-banks/:id" element={<BloodBankDetails />} />
            <Route path="/book-appointment" element={
              <ProtectedRoute>
                <BookAppointment />
              </ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute>
                <AppointmentHistory />
              </ProtectedRoute>
            } />
            <Route path="/urgent-requests" element={<UrgentRequests />} />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/donation-history" element={
              <ProtectedRoute>
                <DonationHistory />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } />
            <Route path="/admin/appointments" element={
              <AdminRoute>
                <AdminAppointments />
              </AdminRoute>
            } />
            <Route path="/admin/requests" element={
              <AdminRoute>
                <AdminRequests />
              </AdminRoute>
            } />
            <Route path="/admin/feedback" element={
              <AdminRoute>
                <AdminFeedback />
              </AdminRoute>
            } />
            <Route path="/admin/blood-banks" element={
              <AdminRoute>
                <AdminBloodBanks />
              </AdminRoute>
            } />
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
