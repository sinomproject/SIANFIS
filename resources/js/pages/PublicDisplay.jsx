import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '@/services/api';
import { speakQueueNumber } from '@/lib/utils';
import { Volume2, VolumeX, Users, Clock, RefreshCw, ArrowLeft, LogOut, AlertCircle, WifiOff, Maximize, Minimize } from 'lucide-react';

const PublicDisplay = () => {
  const navigate = useNavigate();
  const [displayData, setDisplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const lastQueueIdRef = useRef(null);
  const soundEnabledRef = useRef(soundEnabled);
  
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);
  
  const isAdmin = localStorage.getItem('admin_token');
  
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const fetchDisplayData = useCallback(async () => {
    try {
      setError(null);
      const response = await publicApi.getDisplayData();
      const data = response.data.data;
      
      if (data.current && data.current.queue_id !== lastQueueIdRef.current) {
        if (lastQueueIdRef.current !== null && soundEnabledRef.current) {
          speakQueueNumber(data.current.queue_number, data.current.counter_number, data.current.counter_name);
        }
        lastQueueIdRef.current = data.current.queue_id;
      }
      
      setDisplayData(data);
    } catch (error) {
      console.error('Failed to fetch display data:', error);
      setError('Gagal mengambil data dari server. Pastikan server berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisplayData();
    const interval = setInterval(fetchDisplayData, 5000);
    return () => clearInterval(interval);
  }, [fetchDisplayData]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      speakQueueNumber('', '');
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{
          backgroundImage: "url('/assets/BG1.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
        <div className="relative z-10 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/20 rounded-full" />
            <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
          </div>
          <p className="text-white/80 text-xl">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error && !displayData) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: "url('/assets/BG1.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
        <div className="relative z-10 text-center max-w-md animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 mb-6">
            <WifiOff className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Koneksi Gagal</h2>
          <p className="text-white/60 mb-8">{error}</p>
          <button
            onClick={fetchDisplayData}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary rounded-2xl font-semibold hover:bg-white/90 transition-all hover:scale-105 shadow-material-3"
          >
            <RefreshCw className="w-5 h-5" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const { current, next_waiting, stats } = displayData || {};

  return (
    <div 
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        backgroundImage: "url('/assets/BG1.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
      <div className="absolute inset-0 mesh-gradient opacity-20" />
      
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      {/* Content wrapper */}
      <div className="relative z-10 p-6 md:p-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 animate-fade-in">
          <div className="flex items-center gap-6">
            <img src="/assets/logo1-kkp.png.png" alt="KKP" className="h-14 object-contain drop-shadow-lg" />
            <img src="/assets/logo2-bppmhkp.png" alt="BPPMHKP" className="h-14 object-contain drop-shadow-lg" />
          </div>
          <div className="text-right">
            <p className="text-4xl font-mono font-bold tracking-wider">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-white/60 text-lg mt-1">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Queue - Main Display */}
          <div className="lg:col-span-2 animate-slide-up">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 min-h-[500px] flex flex-col justify-center items-center border border-white/10 shadow-material-5">
              <p className="text-xl md:text-2xl text-white/60 mb-6 uppercase tracking-widest font-medium">
                Nomor Antrian Dipanggil
              </p>
              
              {current ? (
                <div className="text-center animate-scale-in">
                  {/* Queue Number */}
                  <div className="queue-display relative">
                    <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full" />
                    <p className="text-[140px] md:text-[200px] font-black text-white leading-none relative drop-shadow-2xl">
                      {current.queue_number}
                    </p>
                  </div>
                  
                  {/* Counter */}
                  <div className="mt-10 bg-gradient-to-r from-accent to-teal-400 rounded-2xl px-16 py-8 shadow-material-4">
                    <p className="text-2xl text-white/80 mb-2 font-medium">SILAKAN MENUJU</p>
                    <p className="text-6xl md:text-7xl font-black text-white">
                      LOKET {current.counter_number}
                    </p>
                  </div>

                  {/* Service Name */}
                  <p className="mt-8 text-2xl text-white/70 font-medium">
                    {current.service_name}
                  </p>
                </div>
              ) : (
                <div className="text-center animate-fade-in">
                  <div className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-white/5 mb-8">
                    <Clock className="w-20 h-20 text-white/20" />
                  </div>
                  <p className="text-7xl md:text-9xl font-black text-white/20 mb-6">
                    ---
                  </p>
                  <p className="text-2xl text-white/40">
                    Menunggu panggilan berikutnya
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h3 className="text-lg font-semibold mb-5 flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                Statistik Hari Ini
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-500/20 rounded-xl p-4 text-center border border-amber-500/30">
                  <p className="text-4xl font-bold text-amber-400">{stats?.waiting || 0}</p>
                  <p className="text-sm text-white/60 mt-1">Menunggu</p>
                </div>
                <div className="bg-green-500/20 rounded-xl p-4 text-center border border-green-500/30">
                  <p className="text-4xl font-bold text-green-400">{stats?.done || 0}</p>
                  <p className="text-sm text-white/60 mt-1">Selesai</p>
                </div>
                <div className="bg-blue-500/20 rounded-xl p-4 text-center border border-blue-500/30">
                  <p className="text-4xl font-bold text-blue-400">{stats?.called || 0}</p>
                  <p className="text-sm text-white/60 mt-1">Dipanggil</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
                  <p className="text-4xl font-bold text-white">{stats?.total || 0}</p>
                  <p className="text-sm text-white/60 mt-1">Total</p>
                </div>
              </div>
            </div>

            {/* Next Queues */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h3 className="text-lg font-semibold mb-5 text-white">Antrian Selanjutnya</h3>
              {next_waiting && next_waiting.length > 0 ? (
                <div className="space-y-3">
                  {next_waiting.map((queue, index) => (
                    <div 
                      key={queue.queue_id}
                      className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-2xl font-mono font-bold text-white">{queue.queue_number}</span>
                      <span className="text-sm text-white/50">{queue.service_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/40">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Tidak ada antrian</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <h3 className="text-lg font-semibold mb-4 text-white">Kontrol</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={toggleSound}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-medium ${
                    soundEnabled 
                      ? 'bg-green-500 text-white shadow-material-2' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  {soundEnabled ? 'Suara Aktif' : 'Suara Mati'}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white font-medium"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  {isFullscreen ? 'Keluar' : 'Fullscreen'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Running Text */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl py-4 px-6 overflow-hidden border border-white/10 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-white/60 mx-8">
              • Harap menunggu dengan tertib • Nomor antrian akan dipanggil secara berurutan • 
              Pastikan Anda berada di area tunggu • Terima kasih atas kesabaran Anda •
              Smart Queue System - Sistem Antrian Digital Terintegrasi •
            </span>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center text-white/40 text-sm">
          <p>Sistem Antrian Digital © 2026 • Powered by Smart Queue System • BPPMHKP Lampung</p>
        </footer>
      </div>

      {/* Admin Navigation */}
      {isAdmin && !isFullscreen && (
        <div className="fixed bottom-6 left-6 z-50 flex gap-3 animate-slide-up">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 transition-colors text-white font-medium shadow-material-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-5 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium shadow-material-2"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      )}

      {/* Custom CSS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PublicDisplay;