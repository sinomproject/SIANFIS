import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge } from '@/components/ui';
import {
  LayoutDashboard, FileText, Settings, LogOut,
  RefreshCw, Loader2, Plus, Pencil, Trash2, X, Check,
  Building2, Hash, Calendar, Layers, MapPin, Type, Volume2
} from 'lucide-react';

const ServiceManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingCounter, setEditingCounter] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    name: '',
    prefix: '',
    description: '',
    active: true,
  });

  const [counterForm, setCounterForm] = useState({
    name: '',
    number: '',
    kode_loket: '',
    service_id: '',
    service_ids: [],
    active: true,
  });

  useEffect(() => {
    const userData = localStorage.getItem('admin_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servicesRes, countersRes] = await Promise.all([
        adminApi.getServices(),
        adminApi.getCounters(),
      ]);
      setServices(servicesRes.data.data || []);
      setCounters(countersRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
    navigate('/admin-sinom');
  };

  // Service CRUD
  const openServiceModal = (service = null) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        prefix: service.prefix,
        description: service.description || '',
        active: service.active,
      });
    } else {
      setEditingService(null);
      setServiceForm({ name: '', prefix: '', description: '', active: true });
    }
    setShowServiceModal(true);
  };

  const handleSaveService = async () => {
    setSubmitLoading(true);
    try {
      if (editingService) {
        await adminApi.updateService(editingService.id, serviceForm);
      } else {
        await adminApi.createService(serviceForm);
      }
      setShowServiceModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('Gagal menyimpan layanan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteService = async (id) => {
    if (!confirm('Yakin ingin menghapus layanan ini?')) return;
    try {
      await adminApi.deleteService(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('Gagal menghapus layanan');
    }
  };

  // Counter CRUD
  const openCounterModal = (counter = null) => {
    if (counter) {
      setEditingCounter(counter);
      setCounterForm({
        name: counter.name,
        number: counter.number,
        kode_loket: counter.kode_loket || '',
        service_id: counter.service_id || '',
        service_ids: counter.services?.map(s => s.id) || [],
        active: counter.active,
      });
    } else {
      setEditingCounter(null);
      setCounterForm({ name: '', number: '', kode_loket: '', service_id: '', service_ids: [], active: true });
    }
    setShowCounterModal(true);
  };

  const handleSaveCounter = async () => {
    setSubmitLoading(true);
    try {
      if (editingCounter) {
        await adminApi.updateCounter(editingCounter.id, counterForm);
      } else {
        await adminApi.createCounter(counterForm);
      }
      setShowCounterModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save counter:', error);
      alert('Gagal menyimpan loket');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteCounter = async (id) => {
    if (!confirm('Yakin ingin menghapus loket ini?')) return;
    try {
      await adminApi.deleteCounter(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete counter:', error);
      alert('Gagal menghapus loket');
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
            className="material-nav-item w-full"
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
            className="material-nav-item active w-full"
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
            <h1 className="text-3xl font-bold text-foreground">Kelola Layanan</h1>
            <p className="text-muted-foreground mt-1">Kelola layanan dan loket</p>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Services Section */}
            <div className="animate-slide-up">
              <Card variant="elevated" className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <Layers className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Daftar Layanan</h2>
                        <p className="text-white/80 text-sm">{services.length} layanan terdaftar</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => openServiceModal()}
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {services.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Layers className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Belum ada layanan</p>
                      </div>
                    ) : (
                      services.map((service, index) => (
                        <div 
                          key={service.id} 
                          className={`flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-secondary/30 transition-all group ${!service.active ? 'opacity-50' : ''}`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                              <span className="font-mono font-bold text-primary text-lg">{service.prefix}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{service.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {service.description || 'Tidak ada deskripsi'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!service.active && (
                              <Badge variant="secondary">Nonaktif</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openServiceModal(service)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Counters Section */}
            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <Card variant="elevated" className="overflow-hidden">
                <div className="bg-gradient-to-r from-accent to-teal-500 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Daftar Loket</h2>
                        <p className="text-white/80 text-sm">{counters.length} loket terdaftar</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => openCounterModal()}
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {counters.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Belum ada loket</p>
                      </div>
                    ) : (
                      counters.map((counter, index) => (
                        <div 
                          key={counter.id} 
                          className={`flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-secondary/30 transition-all group ${!counter.active ? 'opacity-50' : ''}`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center border border-accent/20">
                              <span className="font-bold text-accent text-xl">{counter.number}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground">{counter.name}</p>
                                {counter.kode_loket && (
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {counter.kode_loket}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {counter.services && counter.services.length > 0 ? (
                                  counter.services.map(service => (
                                    <span
                                      key={service.id}
                                      className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium"
                                    >
                                      {service.prefix}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    {counter.service?.name || 'Semua Layanan'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!counter.active && (
                              <Badge variant="secondary">Nonaktif</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openCounterModal(counter)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteCounter(counter.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card variant="elevated" className="w-full max-w-md animate-scale-in">
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <CardTitle>{editingService ? 'Edit Layanan' : 'Tambah Layanan'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label required>Nama Layanan</Label>
                <Input
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="contoh: Laboratorium"
                />
              </div>
              <div className="space-y-2">
                <Label required>Prefix (Huruf Kode)</Label>
                <Input
                  value={serviceForm.prefix}
                  onChange={(e) => setServiceForm({ ...serviceForm, prefix: e.target.value.toUpperCase() })}
                  placeholder="contoh: LAB"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Deskripsi layanan (opsional)"
                />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <input
                  type="checkbox"
                  id="active"
                  checked={serviceForm.active}
                  onChange={(e) => setServiceForm({ ...serviceForm, active: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="active" className="cursor-pointer">Layanan Aktif</Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowServiceModal(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
                <Button className="flex-1" onClick={handleSaveService} disabled={submitLoading}>
                  {submitLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Simpan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Counter Modal */}
      {showCounterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card variant="elevated" className="w-full max-w-md animate-scale-in">
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <CardTitle>{editingCounter ? 'Edit Loket' : 'Tambah Loket'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label required>Nama Loket</Label>
                <Input
                  value={counterForm.name}
                  onChange={(e) => setCounterForm({ ...counterForm, name: e.target.value })}
                  placeholder="contoh: Loket Pendaftaran"
                />
              </div>
              <div className="space-y-2">
                <Label required>Nomor Loket</Label>
                <Input
                  type="number"
                  value={counterForm.number}
                  onChange={(e) => setCounterForm({ ...counterForm, number: e.target.value })}
                  placeholder="contoh: 1"
                />
              </div>
              <div className="space-y-2">
                <Label required>Kode Loket</Label>
                <Input
                  value={counterForm.kode_loket}
                  onChange={(e) => setCounterForm({ ...counterForm, kode_loket: e.target.value.toUpperCase() })}
                  placeholder="contoh: LK1, ADM, CS"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Kode unik untuk nomor antrian (contoh: LK1-001)
                </p>
              </div>
              <div className="space-y-3">
                <Label>Layanan (Pilih beberapa layanan)</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto p-3 rounded-xl border-2 border-border bg-background/50">
                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada layanan tersedia
                    </p>
                  ) : (
                    services.map(service => (
                      <label
                        key={service.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors group"
                      >
                        <input
                          type="checkbox"
                          checked={counterForm.service_ids.includes(service.id)}
                          onChange={(e) => {
                            const newServiceIds = e.target.checked
                              ? [...counterForm.service_ids, service.id]
                              : counterForm.service_ids.filter(id => id !== service.id);
                            setCounterForm({ ...counterForm, service_ids: newServiceIds });
                          }}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold px-2 py-1 rounded-md bg-primary/10 text-primary">
                              {service.prefix}
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {service.name}
                            </span>
                          </div>
                          {service.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {counterForm.service_ids.length === 0
                    ? 'Tidak ada layanan dipilih - loket akan menangani semua layanan'
                    : `${counterForm.service_ids.length} layanan dipilih`}
                </p>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <input
                  type="checkbox"
                  id="counterActive"
                  checked={counterForm.active}
                  onChange={(e) => setCounterForm({ ...counterForm, active: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="counterActive" className="cursor-pointer">Loket Aktif</Label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowCounterModal(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
                <Button className="flex-1" onClick={handleSaveCounter} disabled={submitLoading}>
                  {submitLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Simpan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;