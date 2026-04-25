import React, { useState } from 'react';
import { staffApi } from '@/services/api';
import StaffLayout from './StaffLayout';
import { Loader2, Check, Eye, EyeOff, User, Mail, Shield, Monitor } from 'lucide-react';

const StaffProfile = () => {
  const staffUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

  const [form, setForm] = useState({
    current_password:          '',
    new_password:              '',
    new_password_confirmation: '',
  });
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState(null);
  const [show,     setShow]     = useState({ cur: false, new: false, conf: false });

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError(null);
    setSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.new_password_confirmation) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await staffApi.changePassword(form);
      setSuccess(true);
      setForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setSaving(false);
    }
  };

  const pwField = (label, name, vis, onToggle) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      <div className="relative">
        <input
          type={vis ? 'text' : 'password'}
          name={name}
          value={form[name]}
          onChange={handleChange}
          required
          className="material-input pr-10"
          placeholder="••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {vis ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <StaffLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Profil Saya</h1>

        {/* Info card */}
        <div className="material-card p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Informasi Akun</h2>
          {[
            { icon: <User className="w-4 h-4" />,    label: 'Nama',  value: staffUser.name },
            { icon: <Mail className="w-4 h-4" />,    label: 'Email', value: staffUser.email },
            { icon: <Shield className="w-4 h-4" />,  label: 'Role',  value: staffUser.role },
            { icon: <Monitor className="w-4 h-4" />, label: 'Loket', value: staffUser.counter_name || '—' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground capitalize">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Password change card */}
        <div className="material-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Ubah Password</h2>

          {success && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
              <Check className="w-4 h-4" />
              Password berhasil diubah
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">{error}</div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {pwField('Password Lama', 'current_password',
              show.cur, () => setShow(p => ({ ...p, cur: !p.cur })))}
            {pwField('Password Baru (min. 6 karakter)', 'new_password',
              show.new, () => setShow(p => ({ ...p, new: !p.new })))}
            {pwField('Konfirmasi Password Baru', 'new_password_confirmation',
              show.conf, () => setShow(p => ({ ...p, conf: !p.conf })))}

            <button
              type="submit"
              disabled={saving}
              className="w-full material-button-filled py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Ubah Password
            </button>
          </form>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffProfile;
