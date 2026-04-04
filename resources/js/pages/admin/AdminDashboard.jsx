import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/services/api';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import {
  Users, UserCheck, Clock, CheckCircle,
  LayoutDashboard, FileText, Settings, LogOut,
  RefreshCw, Loader2, Calendar, TrendingUp,
  ChevronRight, MapPin, Type, Volume2
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [serviceStats, setServiceStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('admin_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data.data.total);
      setServiceStats(response.data.data.by_service);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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

  const statCards = [
    { 
      label: 'Total Hari Ini', 
      key: 'total', 
      color: 'from-blue-500 to-blue-600',
      icon: Users,
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    { 
      label: 'Menunggu', 
      key: 'waiting', 
      color: 'from-amber-500 to-orange-500',
      icon: Clock,
      bgLight: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-600 dark:text-amber-400'
    },
    { 
      label: 'Dipanggil', 
      key: 'called', 
      color: 'from-cyan-500 to-teal-500',
      icon: UserCheck,
      bgLight: 'bg-cyan-50 dark:bg-cyan-900/20',
      textColor: 'text-cyan-600 dark:text-cyan-400'
    },
    { 
      label: 'Selesai', 
      key: 'done', 
      color: 'from-green-500 to-emerald-500',
      icon: CheckCircle,
      bgLight: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

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
            className="material-nav-item active w-full"
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
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Statistik antrian hari ini</p>
          </div>
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.key} 
                variant="elevated"
                className="animate-slide-up overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-0">
                  <div className={`h-1.5 bg-gradient-to-r ${stat.color}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                        <p className={`text-4xl font-bold mt-2 ${stat.textColor}`}>
                          {stats?.[stat.key] || 0}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgLight}`}>
                        <Icon className={`w-6 h-6 ${stat.textColor}`} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Service Stats Table */}
        <Card variant="elevated" className="mb-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Statistik per Layanan</h2>
              </div>
            </div>
            
            {serviceStats && serviceStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Layanan</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Menunggu</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Dipanggil</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Selesai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceStats.map((service, index) => (
                      <tr 
                        key={service.id} 
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                        style={{ animationDelay: `${(index + 5) * 50}ms` }}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-mono font-bold text-sm">
                              {service.prefix}
                            </span>
                            <span className="font-medium">{service.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <Badge variant="warning" size="lg">{service.waiting}</Badge>
                        </td>
                        <td className="text-center py-4 px-4">
                          <Badge variant="info" size="lg">{service.called}</Badge>
                        </td>
                        <td className="text-center py-4 px-4">
                          <Badge variant="success" size="lg">{service.done}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Tidak ada data layanan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            variant="elevated" 
            className="cursor-pointer group hover:shadow-material-3 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: '600ms' }}
            onClick={() => navigate('/admin/queue')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary-600 shadow-material-2 group-hover:scale-105 transition-transform">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Kelola Antrian</h3>
                  <p className="text-sm text-muted-foreground">Panggil, selesaikan, atau lewati antrian</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            variant="elevated" 
            className="cursor-pointer group hover:shadow-material-3 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: '700ms' }}
            onClick={() => navigate('/display')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-accent to-teal-500 shadow-material-2 group-hover:scale-105 transition-transform">
                  <LayoutDashboard className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Lihat Display</h3>
                  <p className="text-sm text-muted-foreground">Buka tampilan display publik</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;