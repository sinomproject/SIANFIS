/**
 * StaffLayout — shared sidebar + layout wrapper for all staff pages.
 * Usage: <StaffLayout active="/staff/queue">...</StaffLayout>
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminApi } from '@/services/api';
import {
  LayoutDashboard, FileText, List, BarChart2,
  User, LogOut,
} from 'lucide-react';

const NAV = [
  { path: '/staff/dashboard',    icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { path: '/staff/queue',        icon: <FileText className="w-5 h-5" />,        label: 'Antrian Saya' },
  { path: '/staff/waiting-list', icon: <List className="w-5 h-5" />,            label: 'Daftar Tunggu' },
  { path: '/staff/report',       icon: <BarChart2 className="w-5 h-5" />,       label: 'Laporan' },
  { path: '/staff/profile',      icon: <User className="w-5 h-5" />,            label: 'Profil' },
];

const StaffLayout = ({ children }) => {
  const navigate  = useNavigate();
  const loc       = useLocation().pathname;
  const staffUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

  const handleLogout = async () => {
    try { await adminApi.logout(); } catch {}
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col shadow-material-2 z-40">
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/assets/LOGO_UMA.png" alt="Logo" className="h-10 object-contain" />
            <img src="/assets/unggul.png" alt="Logo" className="h-10 object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-base font-bold text-foreground">SIANFIS</h1>
            <p className="text-xs text-muted-foreground">Staff Panel</p>
          </div>
        </div>

        {/* Counter badge */}
        {staffUser.counter_name && (
          <div className="mx-4 mt-4 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold text-center">
            Loket: {staffUser.counter_name}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2">
          {NAV.map(n => (
            <button
              key={n.path}
              onClick={() => navigate(n.path)}
              className={`material-nav-item w-full ${loc === n.path ? 'active' : ''}`}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {staffUser.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{staffUser.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{staffUser.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
};

export default StaffLayout;
