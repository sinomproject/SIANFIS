import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages
import PublicForm from './pages/PublicForm';
import TicketDisplay from './pages/TicketDisplay';
import PublicDisplay from './pages/PublicDisplay';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import QueueManagement from './pages/admin/QueueManagement';
import QueueHistory from './pages/admin/QueueHistory';
import ServiceManagement from './pages/admin/ServiceManagement';
import LocationSettings from './pages/admin/LocationSettings';
import AppSettings from './pages/admin/AppSettings';
import AudioSettings from './pages/admin/AudioSettings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicForm />} />
        <Route path="/form" element={<PublicForm />} />
        <Route path="/ticket/:id" element={<TicketDisplay />} />
        <Route path="/display" element={<PublicDisplay />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/queue" element={<QueueManagement />} />
        <Route path="/admin/history" element={<QueueHistory />} />
        <Route path="/admin/services" element={<ServiceManagement />} />
        <Route path="/admin/location-settings" element={<LocationSettings />} />
        <Route path="/admin/app-settings" element={<AppSettings />} />
        <Route path="/admin/audio-settings" element={<AudioSettings />} />
      </Routes>
    </BrowserRouter>
  );
}

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);