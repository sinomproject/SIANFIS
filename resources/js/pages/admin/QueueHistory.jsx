import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/services/api';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import {
  LayoutDashboard, FileText, Settings, LogOut,
  RefreshCw, Loader2, Phone, Building2, User,
  Calendar, Download, Search, Eye, Camera, IdCard, X, MapPin,
  FileSpreadsheet, TrendingUp, Type, Volume2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const QueueHistory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [photoModal, setPhotoModal] = useState({ show: false, photo: null, title: '' });
  
  // Filters
  const [filter, setFilter] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    service_id: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('admin_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchServices();
    fetchHistory();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await adminApi.getServices();
      setServices(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.start_date) params.append('start_date', filter.start_date);
      if (filter.end_date) params.append('end_date', filter.end_date);
      if (filter.service_id) params.append('service_id', filter.service_id);
      if (filter.status) params.append('status', filter.status);
      if (filter.search) params.append('search', filter.search);

      const response = await adminApi.getQueueHistory(params.toString());
      setQueues(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const openPhotoModal = (photo, title) => {
    setPhotoModal({ show: true, photo, title });
  };

  const closePhotoModal = () => {
    setPhotoModal({ show: false, photo: null, title: '' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting': return <Badge variant="waiting">Menunggu</Badge>;
      case 'called': return <Badge variant="called">Dipanggil</Badge>;
      case 'done': return <Badge variant="done">Selesai</Badge>;
      case 'skipped': return <Badge variant="skipped">Dilewati</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'waiting': return 'Menunggu';
      case 'called': return 'Dipanggil';
      case 'done': return 'Selesai';
      case 'skipped': return 'Dilewati';
      default: return status;
    }
  };

  const exportToExcel = () => {
    if (queues.length === 0) return;

    const data = queues.map((q, i) => ({
      'No': i + 1,
      'Tanggal': q.queue_date,
      'Nomor Antrian': q.queue_number,
      'Kode Tiket': q.ticket_code,
      'Nama': q.visitor?.name || '-',
      'Instansi': q.visitor?.agency || '-',
      'Telepon': q.visitor?.phone || '-',
      'Layanan': q.service?.name || '-',
      'Status': getStatusText(q.status),
      'Loket': q.counter_number ? `Loket ${q.counter_number}` : '-',
      'Waktu Daftar': q.created_at,
      'Waktu Dipanggil': q.called_at || '-',
      'Waktu Selesai': q.finished_at || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Antrian');
    
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key]).length)) + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `riwayat-antrian-${filter.start_date}-${filter.end_date}.xlsx`);
  };

  const exportToPDF = () => {
    if (queues.length === 0) return;

    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text('Riwayat Antrian', 14, 15);
    doc.setFontSize(10);
    doc.text(`Periode: ${filter.start_date} s/d ${filter.end_date}`, 14, 22);
    
    const headers = [['No', 'Tanggal', 'No. Antrian', 'Kode Tiket', 'Nama', 'Instansi', 'Telepon', 'Layanan', 'Status', 'Loket', 'Waktu Daftar', 'Waktu Dipanggil', 'Waktu Selesai']];
    
    const rows = queues.map((q, i) => [
      i + 1,
      q.queue_date,
      q.queue_number,
      q.ticket_code,
      q.visitor?.name || '-',
      q.visitor?.agency || '-',
      q.visitor?.phone || '-',
      q.service?.name || '-',
      getStatusText(q.status),
      q.counter_number ? `Loket ${q.counter_number}` : '-',
      q.created_at,
      q.called_at || '-',
      q.finished_at || '-',
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 28,
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 22 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
        6: { cellWidth: 22 },
        7: { cellWidth: 25 },
        8: { cellWidth: 18 },
        9: { cellWidth: 15 },
        10: { cellWidth: 22 },
        11: { cellWidth: 22 },
        12: { cellWidth: 22 },
      },
    });

    doc.save(`riwayat-antrian-${filter.start_date}-${filter.end_date}.pdf`);
  };

  const summaryStats = [
    { 
      label: 'Total', 
      value: queues.length, 
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20'
    },
    { 
      label: 'Menunggu', 
      value: queues.filter(q => q.status === 'waiting').length, 
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgLight: 'bg-amber-50 dark:bg-amber-900/20'
    },
    { 
      label: 'Dipanggil', 
      value: queues.filter(q => q.status === 'called').length, 
      color: 'from-cyan-500 to-teal-500',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      bgLight: 'bg-cyan-50 dark:bg-cyan-900/20'
    },
    { 
      label: 'Selesai', 
      value: queues.filter(q => q.status === 'done').length, 
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-600 dark:text-green-400',
      bgLight: 'bg-green-50 dark:bg-green-900/20'
    },
    { 
      label: 'Dilewati', 
      value: queues.filter(q => q.status === 'skipped').length, 
      color: 'from-orange-500 to-red-500',
      textColor: 'text-orange-600 dark:text-orange-400',
      bgLight: 'bg-orange-50 dark:bg-orange-900/20'
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border flex flex-col shadow-material-2 z-40">
        {/* Logo Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-center gap-4 mb-3">
            <img src="/assets/LOGO_UMA.png" alt="KKP" className="h-12 object-contain" />
            <img src="/assets/unggul.png" alt="BPPMHKP" className="h-12 object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground">SIANFIS</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="material-nav-item w-full"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => navigate('/admin/queue')}
            className="material-nav-item w-full"
          >
            <FileText className="w-5 h-5" />
            Antrian
          </button>
          <button
            onClick={() => navigate('/admin/history')}
            className="material-nav-item active w-full"
          >
            <Calendar className="w-5 h-5" />
            Riwayat
          </button>
          <button
            onClick={() => navigate('/admin/services')}
            className="material-nav-item w-full"
          >
            <Settings className="w-5 h-5" />
            Layanan
          </button>
          <button
            onClick={() => navigate('/admin/location-settings')}
            className="material-nav-item w-full"
          >
            <MapPin className="w-5 h-5" />
            Lokasi
          </button>
          <button
            onClick={() => navigate('/admin/app-settings')}
            className="material-nav-item w-full"
          >
            <Type className="w-5 h-5" />
            Header & Logo
          </button>
          <button
            onClick={() => navigate('/admin/audio-settings')}
            className="material-nav-item w-full"
          >
            <Volume2 className="w-5 h-5" />
            Suara
          </button>
        </nav>

        {/* User Profile Section */}
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

      {/* Main Content */}
      <main className="ml-72 flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Riwayat Antrian</h1>
            <p className="text-muted-foreground mt-1">Lihat data antrian historis</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchHistory}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={exportToExcel} 
              disabled={queues.length === 0}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button 
              onClick={exportToPDF} 
              disabled={queues.length === 0}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card variant="elevated" className="mb-6 animate-slide-up">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block font-medium">Tanggal Mulai</label>
                <input
                  type="date"
                  value={filter.start_date}
                  onChange={(e) => setFilter({ ...filter, start_date: e.target.value })}
                  className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block font-medium">Tanggal Akhir</label>
                <input
                  type="date"
                  value={filter.end_date}
                  onChange={(e) => setFilter({ ...filter, end_date: e.target.value })}
                  className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block font-medium">Status</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all"
                >
                  <option value="">Semua</option>
                  <option value="waiting">Menunggu</option>
                  <option value="called">Dipanggil</option>
                  <option value="done">Selesai</option>
                  <option value="skipped">Dilewati</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block font-medium">Layanan</label>
                <select
                  value={filter.service_id}
                  onChange={(e) => setFilter({ ...filter, service_id: e.target.value })}
                  className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all"
                >
                  <option value="">Semua Layanan</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block font-medium">Cari</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Nama/kode tiket..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="w-full bg-background border-2 border-border rounded-xl pl-11 pr-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchHistory} className="w-full">
                  Terapkan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {summaryStats.map((stat, index) => (
            <Card 
              key={stat.label}
              variant="elevated" 
              className="animate-slide-up overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-0">
                <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
                <div className="p-4 text-center">
                  <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Queue List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Memuat data riwayat...</p>
            </div>
          </div>
        ) : queues.length === 0 ? (
          <Card variant="elevated" className="animate-fade-in">
            <CardContent className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary/50 mb-6">
                <Calendar className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-lg">Tidak ada data riwayat</p>
              <p className="text-muted-foreground/70 text-sm mt-2">Ubah filter untuk melihat data</p>
            </CardContent>
          </Card>
        ) : (
          <Card variant="elevated" className="animate-fade-in overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">No. Antrian</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Tanggal</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Nama</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Instansi</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Layanan</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Loket</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queues.map((queue, index) => (
                      <tr 
                        key={queue.id} 
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-mono font-bold text-sm">
                            {queue.queue_number}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm">{queue.queue_date}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{queue.visitor?.name}</p>
                              {queue.visitor?.phone && (
                                <p className="text-xs text-muted-foreground">{queue.visitor.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">{queue.visitor?.agency || '-'}</td>
                        <td className="py-4 px-4 text-sm">{queue.service?.name}</td>
                        <td className="py-4 px-4 text-center">{getStatusBadge(queue.status)}</td>
                        <td className="py-4 px-4 text-center">
                          {queue.counter_number ? (
                            <Badge variant="info">Loket {queue.counter_number}</Badge>
                          ) : '-'}
                        </td>
                        <td className="py-4 px-4 text-center text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Daftar: {queue.created_at}</p>
                            {queue.called_at && <p className="text-cyan-600 dark:text-cyan-400">Panggil: {queue.called_at}</p>}
                            {queue.finished_at && <p className="text-green-600 dark:text-green-400">Selesai: {queue.finished_at}</p>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Photo Modal */}
      {photoModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card variant="elevated" className="max-w-2xl w-full animate-scale-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">{photoModal.title}</h3>
                <Button variant="ghost" size="icon" onClick={closePhotoModal}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {photoModal.photo ? (
                <img 
                  src={photoModal.photo} 
                  alt={photoModal.title}
                  className="w-full max-h-[70vh] object-contain rounded-xl"
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Tidak ada foto
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default QueueHistory;