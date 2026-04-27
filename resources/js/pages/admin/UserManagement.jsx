import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminApi } from '@/services/api';
import {
  LayoutDashboard, FileText, Settings, LogOut,
  Loader2, Calendar, MapPin, Type, Volume2, ImageIcon,
  Monitor, Users, Plus, Pencil, Trash2, X, Eye, EyeOff,
} from 'lucide-react';

// ── Sidebar (shared pattern with AdminDashboard) ────────────────────────────
const Sidebar = ({ user, navigate, handleLogout }) => {
  const loc = useLocation().pathname;
  const navItem = (path, icon, label) => (
    <button
      key={path}
      onClick={() => navigate(path)}
      className={`material-nav-item w-full ${loc === path ? 'active' : ''}`}
    >
      {icon}
      {label}
    </button>
  );
  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border flex flex-col shadow-material-2 z-40">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-center gap-4 mb-3">
          <img src="/assets/LOGO_UMA.png" alt="Logo" className="h-12 object-contain" />
          <img src="/assets/unggul.png" alt="Logo" className="h-12 object-contain" />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold text-foreground">SIANFIS</h1>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItem('/admin/dashboard',         <LayoutDashboard className="w-5 h-5" />, 'Dashboard')}
        {navItem('/admin/queue',             <FileText className="w-5 h-5" />, 'Antrian')}
        {navItem('/admin/history',           <Calendar className="w-5 h-5" />, 'Riwayat')}
        {navItem('/admin/services',          <Settings className="w-5 h-5" />, 'Layanan')}
        {navItem('/admin/location-settings', <MapPin className="w-5 h-5" />, 'Lokasi')}
        {navItem('/admin/app-settings',      <Type className="w-5 h-5" />, 'Header & Logo')}
        {navItem('/admin/audio-settings',    <Volume2 className="w-5 h-5" />, 'Suara')}
        {navItem('/admin/display-background',<ImageIcon className="w-5 h-5" />, 'Background')}
        {navItem('/admin/display-control',   <Monitor className="w-5 h-5" />, 'Display Control')}
        {navItem('/admin/users',             <Users className="w-5 h-5" />, 'Manajemen User')}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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
  );
};

// ── Role badge ──────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const styles = {
    admin:      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    superadmin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    staff:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    operator:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[role] || styles.operator}`}>
      {role}
    </span>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────
const UserManagement = () => {
  const navigate    = useNavigate();
  const [user, setUser]         = useState(null);
  const [users, setUsers]       = useState([]);
  const [counters, setCounters] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState({ open: false, mode: 'create', data: null });
  const [form, setForm]         = useState({ name:'', email:'', password:'', role:'staff', counter_id:'' });
  const [saving, setSaving]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('admin_user');
    if (u) setUser(JSON.parse(u));
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getCounters(),
      ]);
      setUsers(uRes.data.data || []);
      setCounters(cRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await adminApi.logout(); } catch {}
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin-sinom');
  };

  const openCreate = () => {
    setForm({ name:'', email:'', password:'', role:'staff', counter_id:'' });
    setError(null);
    setModal({ open: true, mode: 'create', data: null });
  };

  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password:'', role: u.role, counter_id: u.counter_id || '' });
    setError(null);
    setModal({ open: true, mode: 'edit', data: u });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name:       form.name,
        email:      form.email,
        role:       form.role,
        counter_id: form.counter_id || null,
      };
      if (form.password) payload.password = form.password;

      if (modal.mode === 'create') {
        await adminApi.createUser({ ...payload, password: form.password });
      } else {
        await adminApi.updateUser(modal.data.id, payload);
      }
      setModal({ open: false });
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.deleteUser(id);
      setDeleteConfirm(null);
      fetchAll();
    } catch (e) {
      alert(e.response?.data?.message || 'Gagal menghapus user');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} navigate={navigate} handleLogout={handleLogout} />

      <main className="ml-72 flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manajemen User</h1>
              <p className="text-muted-foreground mt-1">Kelola akun admin dan staff loket</p>
            </div>
            <button
              onClick={openCreate}
              className="material-button-filled flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Tambah User
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="material-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Nama</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Email</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Role</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Loket</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{u.counter_name || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(u)}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        Belum ada user
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {modal.mode === 'create' ? 'Tambah User' : 'Edit User'}
              </h2>
              <button onClick={() => setModal({ open: false })} className="p-2 rounded-lg hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nama</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="material-input"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="material-input"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Password {modal.mode === 'edit' && <span className="text-muted-foreground font-normal">(kosongkan jika tidak diubah)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="material-input pr-10"
                    placeholder={modal.mode === 'create' ? 'Min. 6 karakter' : '••••••'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="material-select"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {form.role === 'staff' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Loket</label>
                  <select
                    value={form.counter_id}
                    onChange={e => setForm(p => ({ ...p, counter_id: e.target.value }))}
                    className="material-select"
                  >
                    <option value="">— Pilih Loket —</option>
                    {counters.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.kode_loket})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal({ open: false })}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 material-button-filled py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
            <h2 className="text-xl font-bold text-foreground mb-2">Hapus User?</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Hapus akun <strong>{deleteConfirm.name}</strong>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
