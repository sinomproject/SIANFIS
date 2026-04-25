import React, { useState, useEffect } from 'react';
import { staffApi } from '@/services/api';
import StaffLayout from './StaffLayout';
import { Loader2, Download, Search } from 'lucide-react';

const STATUS_LABEL = { waiting: 'Menunggu', called: 'Dipanggil', done: 'Selesai', skipped: 'Dilewati' };

const StaffReport = () => {
  const today = new Date().toISOString().split('T')[0];
  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [exporting,   setExporting]   = useState(false);
  const [filter, setFilter] = useState({ start_date: today, end_date: today });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.start_date) params.append('start_date', filter.start_date);
      if (filter.end_date)   params.append('end_date',   filter.end_date);
      const res = await staffApi.getHistory(Object.fromEntries(params));
      setRows(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await staffApi.exportReport({
        start_date: filter.start_date,
        end_date:   filter.end_date,
      });
      const blob     = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = `laporan-antrian-${filter.start_date}-${filter.end_date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Gagal export laporan');
    } finally {
      setExporting(false);
    }
  };

  return (
    <StaffLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Laporan</h1>
            <p className="text-muted-foreground mt-1">Data kunjungan berdasarkan filter tanggal</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="material-card p-5 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={filter.start_date}
              onChange={e => setFilter(p => ({ ...p, start_date: e.target.value }))}
              className="material-input w-44"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={filter.end_date}
              onChange={e => setFilter(p => ({ ...p, end_date: e.target.value }))}
              className="material-input w-44"
            />
          </div>
          <button
            onClick={fetchData}
            className="material-button-tonal flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl"
          >
            <Search className="w-4 h-4" />
            Cari
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || rows.length === 0}
            className="material-button-filled flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl ml-auto disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground mb-4">{rows.length} data ditemukan</p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="material-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-muted-foreground">Tanggal</th>
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-muted-foreground">No Antrian</th>
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-muted-foreground">Jam Panggil</th>
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-muted-foreground">Nama</th>
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-muted-foreground">Keperluan</th>
                    <th className="text-left px-5 py-3.5 text-sm font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(q => (
                    <tr key={q.id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{q.queue_date}</td>
                      <td className="px-5 py-3.5 font-bold text-primary">{q.queue_number}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">{q.called_at || '—'}</td>
                      <td className="px-5 py-3.5 font-medium text-foreground">{q.visitor?.name}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground max-w-xs truncate">{q.visitor?.purpose}</td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground capitalize">{STATUS_LABEL[q.status] || q.status}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                        Tidak ada data untuk filter ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffReport;
