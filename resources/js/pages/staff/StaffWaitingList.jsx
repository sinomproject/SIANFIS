import React, { useState, useEffect } from 'react';
import { staffApi } from '@/services/api';
import StaffLayout from './StaffLayout';
import { Loader2, RefreshCw, Search } from 'lucide-react';

const STATUS_CHIP  = { waiting: 'chip-waiting', called: 'chip-called', done: 'chip-done', skipped: 'chip-skipped' };
const STATUS_LABEL = { waiting: 'Menunggu', called: 'Dipanggil', done: 'Selesai', skipped: 'Dilewati' };

const StaffWaitingList = () => {
  const [queues,   setQueues]   = useState([]);
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState({ status: '', service_id: '' });

  useEffect(() => {
    staffApi.getServices().then(r => setServices(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => { fetchQueues(); }, [filter]);

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status)     params.status     = filter.status;
      if (filter.service_id) params.service_id = filter.service_id;
      const res = await staffApi.getAllQueues(params);
      setQueues(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StaffLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Daftar Tunggu</h1>
            <p className="text-muted-foreground mt-1">Semua antrian hari ini (read-only)</p>
          </div>
          <button onClick={fetchQueues} className="material-button-tonal flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select
            value={filter.status}
            onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}
            className="material-select w-44"
          >
            <option value="">Semua Status</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select
            value={filter.service_id}
            onChange={e => setFilter(p => ({ ...p, service_id: e.target.value }))}
            className="material-select w-52"
          >
            <option value="">Semua Layanan</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="material-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-muted-foreground">No</th>
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-muted-foreground">Nama</th>
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-muted-foreground">Layanan</th>
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-muted-foreground">Loket</th>
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-muted-foreground">Jam</th>
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {queues.map(q => (
                  <tr key={q.id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                    <td className="px-5 py-3.5 font-bold text-primary">{q.queue_number}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{q.visitor?.name}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{q.service?.name}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{q.counter_name || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{q.called_at || q.created_at}</td>
                    <td className="px-5 py-3.5">
                      <span className={STATUS_CHIP[q.status]}>{STATUS_LABEL[q.status]}</span>
                    </td>
                  </tr>
                ))}
                {queues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      Tidak ada data antrian
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffWaitingList;
