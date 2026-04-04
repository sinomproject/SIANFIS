import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/services/api';
import { Card, CardContent, Button, Select, Badge } from '@/components/ui';
import {
  LayoutDashboard, FileText, Settings, LogOut,
  RefreshCw, Loader2, Phone, Building2, User,
  Play, Check, SkipBack, RotateCcw, MapPin,
  Camera, IdCard, X, Eye, Calendar, ChevronRight,
  Volume2, Type
} from 'lucide-react';

const QueueManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState({ status: '', service_id: '' });
  const [services, setServices] = useState([]);
  const [counters, setCounters] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState(1);
  const [photoModal, setPhotoModal] = useState({ show: false, photo: null, title: '' });

  useEffect(() => {
    const userData = localStorage.getItem('admin_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchQueues();
    fetchServices();
    fetchCounters();
  }, [filter]);

  const fetchQueues = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.service_id) params.service_id = filter.service_id;
      
      const response = await adminApi.getQueues(params);
      setQueues(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch queues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await adminApi.getServices();
      setServices(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchCounters = async () => {
    try {
      const response = await adminApi.getCounters();
      setCounters(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch counters:', error);
    }
  };

  const handleCall = async (queueId) => {
    setActionLoading(queueId);
    try {
      const response = await adminApi.callQueue(queueId, selectedCounter);
      if (response.data.success) {
        // Suara pemanggilan hanya ada di Display, bukan di Admin
        fetchQueues();
      }
    } catch (error) {
      console.error('Failed to call queue:', error);
      alert('Gagal memanggil antrian');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDone = async (queueId) => {
    setActionLoading(queueId);
    try {
      const response = await adminApi.doneQueue(queueId);
      if (response.data.success) {
        fetchQueues();
      }
    } catch (error) {
      console.error('Failed to done queue:', error);
      alert('Gagal menyelesaikan antrian');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (queueId) => {
    setActionLoading(queueId);
    try {
      const response = await adminApi.skipQueue(queueId);
      if (response.data.success) {
        fetchQueues();
      }
    } catch (error) {
      console.error('Failed to skip queue:', error);
      alert('Gagal melewatkan antrian');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecall = async (queueId) => {
    setActionLoading(queueId);
    try {
      const response = await adminApi.recallQueue(queueId);
      if (response.data.success) {
        fetchQueues();
      }
    } catch (error) {
      console.error('Failed to recall queue:', error);
      alert('Gagal recall antrian');
    } finally {
      setActionLoading(null);
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
            className="material-nav-item active w-full"
          >
            <FileText className="w-5 h-5" />
            Antrian
          </button>
          <button
            onClick={() => navigate('/admin/history')}
            className="material-nav-item w-full"
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
            <h1 className="text-3xl font-bold text-foreground">Kelola Antrian</h1>
            <p className="text-muted-foreground mt-1">Kelola antrian hari ini</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-3 bg-card rounded-xl px-4 py-2 shadow-card border border-border/50">
              <span className="text-sm text-muted-foreground font-medium">Loket:</span>
              <select
                value={selectedCounter}
                onChange={(e) => setSelectedCounter(Number(e.target.value))}
                className="bg-secondary border-0 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-0 focus:outline-none"
              >
                {counters.length > 0 ? (
                  counters.map(counter => (
                    <option key={counter.id} value={counter.number}>
                      Loket {counter.number}
                    </option>
                  ))
                ) : (
                  [1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>Loket {n}</option>
                  ))
                )}
              </select>
            </div>
            <Button variant="outline" onClick={fetchQueues}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card variant="elevated" className="mb-6 animate-slide-up">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-muted-foreground mb-2 block font-medium">Status</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all"
                >
                  <option value="">Semua Status</option>
                  <option value="waiting">Menunggu</option>
                  <option value="called">Dipanggil</option>
                  <option value="done">Selesai</option>
                  <option value="skipped">Dilewati</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
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
            </div>
          </CardContent>
        </Card>

        {/* Queue List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Memuat data antrian...</p>
            </div>
          </div>
        ) : queues.length === 0 ? (
          <Card variant="elevated" className="animate-fade-in">
            <CardContent className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary/50 mb-6">
                <FileText className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-lg">Tidak ada data antrian</p>
              <p className="text-muted-foreground/70 text-sm mt-2">Data antrian akan muncul di sini</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {queues.map((queue, index) => (
              <Card 
                key={queue.id} 
                variant="elevated" 
                className="overflow-hidden animate-slide-up hover:shadow-material-3 transition-shadow"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Queue Number */}
                  <div className="bg-gradient-to-br from-primary to-primary-700 text-white flex items-center justify-center px-8 py-6 lg:min-w-[140px]">
                    <div className="text-center">
                      <p className="text-xs opacity-80 mb-1">NOMOR</p>
                      <span className="text-3xl font-bold">{queue.queue_number}</span>
                    </div>
                  </div>

                  {/* Queue Info */}
                  <CardContent className="flex-1 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Visitor Info */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-semibold text-foreground">{queue.visitor?.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          <span>{queue.visitor?.agency || '-'}</span>
                        </div>
                        {queue.visitor?.phone && (
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{queue.visitor.phone}</span>
                          </div>
                        )}
                        {queue.visitor?.alamat && (
                          <div className="flex items-start gap-3 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mt-0.5" />
                            <span className="line-clamp-2">{queue.visitor.alamat}</span>
                          </div>
                        )}
                      </div>

                      {/* Purpose & Service */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Keperluan</p>
                          <p className="text-sm font-medium">{queue.visitor?.purpose}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Layanan</p>
                          <p className="text-sm font-semibold text-primary">{queue.service?.name}</p>
                        </div>
                        {queue.visitor?.location_lat && queue.visitor?.location_lng && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="font-mono">
                              {parseFloat(queue.visitor.location_lat).toFixed(4)}, {parseFloat(queue.visitor.location_lng).toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Photos & Status */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(queue.status)}
                          {queue.counter_number && (
                            <Badge variant="info">Loket {queue.counter_number}</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 flex-wrap">
                          {queue.visitor?.photo ? (
                            <button
                              onClick={() => openPhotoModal(queue.visitor.photo, 'Foto Selfie')}
                              className="flex items-center gap-2 text-xs text-primary hover:underline"
                            >
                              <Camera className="w-4 h-4" />
                              Foto Selfie
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-2">
                              <Camera className="w-4 h-4" />
                              Tidak ada foto
                            </span>
                          )}
                          
                          {queue.visitor?.identity_photo && (
                            <button
                              onClick={() => openPhotoModal(queue.visitor.identity_photo, 'Foto Tanda Pengenal')}
                              className="flex items-center gap-2 text-xs text-primary hover:underline"
                            >
                              <IdCard className="w-4 h-4" />
                              KTP
                            </button>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Daftar: {queue.created_at}
                        </p>
                      </div>
                    </div>
                  </CardContent>

                  {/* Actions */}
                  <div className="flex items-center gap-3 p-6 border-t lg:border-t-0 lg:border-l border-border bg-secondary/20">
                    {(queue.status === 'waiting' || queue.status === 'called') && (
                      <Button
                        onClick={() => handleCall(queue.id)}
                        disabled={actionLoading === queue.id}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        {actionLoading === queue.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 mr-2" />
                            Panggil
                          </>
                        )}
                      </Button>
                    )}
                    {queue.status === 'called' && (
                      <>
                        <Button
                          onClick={() => handleDone(queue.id)}
                          disabled={actionLoading === queue.id}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        >
                          {actionLoading === queue.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Selesai
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleSkip(queue.id)}
                          disabled={actionLoading === queue.id}
                          variant="warning"
                        >
                          <SkipBack className="w-4 h-4 mr-2" />
                          Lewati
                        </Button>
                      </>
                    )}
                    {queue.status === 'skipped' && (
                      <Button
                        onClick={() => handleRecall(queue.id)}
                        disabled={actionLoading === queue.id}
                        variant="outline"
                      >
                        {actionLoading === queue.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Recall
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
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

export default QueueManagement;