import React, { useState, useEffect } from 'react';
import { staffApi } from '@/services/api';
import StaffLayout from './StaffLayout';
import { Users, Clock, UserCheck, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

const StaffDashboard = () => {
  const [stats,      setStats]      = useState(null);
  const [daily,      setDaily]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const staffUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        staffApi.getStats(),
        staffApi.getDailyStats(),
      ]);
      setStats(sRes.data.data?.total || sRes.data.data);
      setDaily(dRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Hari Ini', key: 'total',   icon: Users,      color: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Menunggu',       key: 'waiting',  icon: Clock,      color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Dipanggil',      key: 'called',   icon: UserCheck,  color: 'text-cyan-600',  bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { label: 'Selesai',        key: 'done',     icon: CheckCircle,color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  ];

  const maxDay = Math.max(...daily.map(d => d.total), 1);

  return (
    <StaffLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Staff</h1>
            <p className="text-muted-foreground mt-1">
              {staffUser.counter_name ? `Loket: ${staffUser.counter_name}` : 'Selamat datang'}
            </p>
          </div>
          <button onClick={fetchAll} className="material-button-tonal flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statCards.map(({ label, key, icon: Icon, color, bg }) => (
                <div key={key} className="material-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">{label}</span>
                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                  </div>
                  <p className={`text-4xl font-bold ${color}`}>{stats?.[key] ?? 0}</p>
                </div>
              ))}
            </div>

            {/* Daily bar chart */}
            <div className="material-card p-6">
              <h2 className="text-lg font-bold text-foreground mb-6">Antrian 7 Hari Terakhir</h2>
              <div className="flex items-end gap-3 h-40">
                {daily.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">{d.total}</span>
                    <div className="w-full flex gap-0.5 items-end">
                      <div
                        className="flex-1 rounded-t-md bg-primary/70 transition-all"
                        style={{ height: `${Math.max(4, (d.total / maxDay) * 120)}px` }}
                        title={`Total: ${d.total}`}
                      />
                      <div
                        className="flex-1 rounded-t-md bg-green-500/70 transition-all"
                        style={{ height: `${Math.max(0, (d.done / maxDay) * 120)}px` }}
                        title={`Selesai: ${d.done}`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground text-center leading-tight">{d.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded bg-primary/70" /> Total
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded bg-green-500/70" /> Selesai
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
