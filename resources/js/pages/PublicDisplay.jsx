import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '@/services/api';
import { Users, Clock, RefreshCw, ArrowLeft, LogOut, WifiOff, Maximize, Minimize, Video, MapPin, Volume2 } from 'lucide-react';
import { initSpeechEngine, playAntrian, unlockAudioSystem } from '@/lib/speechEngine';

const FISIPOL_PINK = '#FF00BB';

const PublicDisplay = () => {
  const navigate = useNavigate();
  const [displayData, setDisplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [youtubePlaylistUrl, setYoutubePlaylistUrl] = useState(null);
  const [showUnlockScreen, setShowUnlockScreen] = useState(true);

  // Display mode settings
  const [displayMode, setDisplayMode] = useState('queue');
  const [externalVideoUrl, setExternalVideoUrl] = useState(null);
  const [videoSound, setVideoSound] = useState(false);

  const lastQueueId = useRef(null);
  const pollingIntervalRef = useRef(null);
  const speechInitialized = useRef(false);
  const unlockBtnRef = useRef(null);

  const isAdmin = localStorage.getItem('admin_token');

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const handleUnlockAudio = async () => {
    console.log('[Display] User clicked to unlock audio');
    const success = await unlockAudioSystem();

    if (success) {
      setShowUnlockScreen(false);
      window.dispatchEvent(new Event('audioUnlocked'));
    } else {
      console.error('[Display] Failed to unlock audio, please try again');
    }
  };

  // Auto-focus unlock button on load (Google TV remote needs focusable element)
  useEffect(() => {
    if (showUnlockScreen) {
      setTimeout(() => unlockBtnRef.current?.focus(), 500);
    }
  }, [showUnlockScreen]);

  // Global Enter key listener — failsafe for Google TV remote
  useEffect(() => {
    if (!showUnlockScreen) return;
    const handler = (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        handleUnlockAudio();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showUnlockScreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!speechInitialized.current) {
      console.log('[Display] Initializing speech system...');
      initSpeechEngine();
      speechInitialized.current = true;
    }
  }, []);

  const fetchAppSettings = async () => {
    try {
      const response = await publicApi.getAppSettings();
      if (response.data.success && response.data.data.youtube_playlist_url) {
        setYoutubePlaylistUrl(response.data.data.youtube_playlist_url);
        console.log('[Display] YouTube playlist loaded');
      }
    } catch (err) {
      console.error('[Display] Failed to fetch app settings:', err);
    }
  };

  const fetchDisplaySettings = async () => {
    try {
      const response = await publicApi.getDisplaySettings();
      if (response.data.success) {
        setDisplayMode(response.data.data.display_mode);
        setExternalVideoUrl(response.data.data.external_video_url);
        setVideoSound(response.data.data.video_sound || false);
        console.log('[Display] Display mode:', response.data.data.display_mode, 'Sound:', response.data.data.video_sound);
      }
    } catch (err) {
      console.error('[Display] Failed to fetch display settings:', err);
    }
  };

  const fetchDisplayData = async () => {
    try {
      setError(null);
      const response = await publicApi.getDisplayData();
      const data = response.data.data;

      if (data.current && data.current.queue_id) {
        if (data.current.queue_id !== lastQueueId.current) {
          console.log('[Display] Queue changed from', lastQueueId.current, 'to', data.current.queue_id);

          lastQueueId.current = data.current.queue_id;

          playAntrian(data.current.queue_number, data.current.counter_number);
        }
      }

      setDisplayData(data);
    } catch (err) {
      console.error('[Display] Failed to fetch display data:', err);
      setError('Gagal mengambil data dari server. Pastikan server berjalan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[Display] Starting display page...');

    fetchAppSettings();
    fetchDisplaySettings();
    fetchDisplayData();

    pollingIntervalRef.current = setInterval(() => {
      fetchDisplaySettings();
      fetchDisplayData();
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        console.log('[Display] Polling stopped');
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const extractPlaylistId = (url) => {
    if (!url) return null;
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
  };

  const extractVideoId = (url) => {
    if (!url) return null;
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
      /youtube\.com\/watch\?.*v=([^&]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const playlistId = extractPlaylistId(youtubePlaylistUrl);
  const youtubeEmbedUrl = playlistId
    ? `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&rel=0&playsinline=1`
    : null;

  const externalVideoId = extractVideoId(externalVideoUrl);
  const externalVideoEmbedUrl = externalVideoId
    ? `https://www.youtube.com/embed/${externalVideoId}?autoplay=1&mute=${videoSound ? '0' : '1'}&loop=1&controls=0&modestbranding=1&rel=0&playsinline=1&playlist=${externalVideoId}`
    : null;

  if (loading) {
    return (
      <div
        className="h-screen flex flex-col items-center justify-center gap-6 relative"
        style={{
          backgroundImage: "url('/assets/bgtech.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/75 to-black/80" />
        <div className="relative z-10 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 rounded-full" style={{ borderColor: 'rgba(255,0,187,0.3)' }} />
            <div className="w-20 h-20 border-4 border-t-transparent rounded-full animate-spin absolute top-0 left-0" style={{ borderColor: FISIPOL_PINK }} />
          </div>
          <p className="text-white text-xl font-semibold">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error && !displayData) {
    return (
      <div
        className="h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: "url('/assets/bgtech.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/75 to-black/80" />
        <div className="relative z-10 text-center max-w-md">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 mb-6 border-2 border-red-500/50">
            <WifiOff className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Koneksi Gagal</h2>
          <p className="text-gray-300 mb-8">{error}</p>
          <button
            onClick={fetchDisplayData}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white transition-all hover:scale-105 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${FISIPOL_PINK} 0%, #CC0099 100%)` }}
          >
            <RefreshCw className="w-5 h-5" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const { current, stats } = displayData || {};

  // VIDEO MODE: Show fullscreen video only
  if (displayMode === 'video' && externalVideoEmbedUrl) {
    return (
      <div className="h-screen w-screen bg-black relative overflow-hidden">
        {/* Fullscreen Video */}
        <iframe
          src={externalVideoEmbedUrl}
          className="absolute inset-0 w-full h-full"
          style={{
            pointerEvents: 'none',
            border: 'none',
          }}
          allow="autoplay; encrypted-media"
          title="Idle Video Display"
        />

        {/* Admin floating buttons (only when logged in) */}
        {isAdmin && !isFullscreen && (
          <div className="fixed bottom-6 left-6 z-50 flex gap-3 animate-slide-up">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 px-5 py-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl hover:bg-black/80 transition-all text-white font-semibold text-sm shadow-2xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-3 bg-red-500/80 backdrop-blur-md text-white rounded-xl hover:bg-red-600 transition-all font-semibold text-sm shadow-2xl border border-red-400/30"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    );
  }

  // QUEUE MODE: Show normal queue display UI
  return (
    <div
      className="h-screen text-white relative overflow-hidden flex flex-col"
      style={{
        backgroundImage: "url('/assets/bgtech.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for text clarity */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/75 to-black/80 pointer-events-none" />

      {/* Audio Unlock Screen */}
      {showUnlockScreen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.93)',
            backdropFilter: 'blur(12px)',
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '800px', padding: '0 32px' }}>
            {/* Icon */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 128,
                height: 128,
                borderRadius: '50%',
                marginBottom: 32,
                background: 'rgba(255, 0, 187, 0.2)',
              }}
            >
              <Volume2 style={{ width: 64, height: 64, color: FISIPOL_PINK }} />
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 48,
              fontWeight: 900,
              color: '#ffffff',
              marginBottom: 16,
              lineHeight: 1.2,
            }}>
              Sistem Antrian SIANFIS
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 20,
              color: 'rgba(255,255,255,0.65)',
              marginBottom: 40,
            }}>
              Tekan tombol atau OK pada remote untuk mengaktifkan suara
            </p>

            {/* Button */}
            <button
              ref={unlockBtnRef}
              onClick={handleUnlockAudio}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.keyCode === 13) handleUnlockAudio(); }}
              tabIndex={0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 16,
                padding: '24px 48px',
                background: `linear-gradient(135deg, ${FISIPOL_PINK} 0%, #CC0099 100%)`,
                color: '#ffffff',
                border: 'none',
                borderRadius: 16,
                fontSize: 24,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 8px 32px ${FISIPOL_PINK}60`,
                outline: 'none',
              }}
              onFocus={e => {
                e.currentTarget.style.outline = `3px solid ${FISIPOL_PINK}`;
                e.currentTarget.style.outlineOffset = '4px';
              }}
              onBlur={e => {
                e.currentTarget.style.outline = 'none';
                e.currentTarget.style.outlineOffset = '0';
              }}
            >
              <Volume2 style={{ width: 32, height: 32 }} />
              Aktifkan Suara
            </button>

            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginTop: 24 }}>
              Diperlukan sekali saat pertama membuka display
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 p-4 md:p-6 flex flex-col h-full">
        {/* Header */}
        <header className="flex justify-between items-center mb-6 animate-fade-in flex-shrink-0 bg-black/40 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-4">
            <img src="/assets/LOGO_UMA.png" alt="Logo" className="h-12 md:h-16 object-contain drop-shadow-lg" />
            <img src="/assets/unggul.png" alt="Logo" className="h-12 md:h-16 object-contain drop-shadow-lg" />
            {/* FISIPOL accent bar */}
            <div className="hidden md:block h-12 w-1 rounded-full ml-2" style={{ background: FISIPOL_PINK }} />
            <div className="hidden md:block">
              <p className="text-lg font-black tracking-wider" style={{ color: FISIPOL_PINK }}>
                FISIPOL UMA
              </p>
              <p className="text-xs text-white/60 font-medium">Sistem Antrian Digital</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl md:text-4xl font-mono font-black tracking-wider text-white drop-shadow-lg">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-white/70 text-sm md:text-base font-medium">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Left: Video/YouTube panel */}
          <div className="lg:col-span-2 animate-slide-up min-h-0">
            <div className="bg-black/30 backdrop-blur-md rounded-3xl h-full flex flex-col justify-center items-center border border-white/10 shadow-2xl overflow-hidden relative">
              {youtubeEmbedUrl ? (
                <iframe
                  src={youtubeEmbedUrl}
                  className="absolute inset-0 w-full h-full"
                  style={{
                    pointerEvents: 'none',
                    border: 'none',
                  }}
                  allow="autoplay"
                  title="YouTube Playlist Background"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/50 to-black/30">
                  <div className="text-center animate-fade-in p-8">
                    <div className="inline-flex items-center justify-center w-28 h-28 rounded-full mb-6 bg-white/5 border-2 border-white/10">
                      <Video className="w-14 h-14 text-white/30" />
                    </div>
                    <p className="text-2xl text-white/70 font-semibold">Background Display</p>
                    <p className="text-sm text-white/40 mt-2">Set YouTube Playlist di pengaturan</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Queue info panel */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* Queue number card */}
            <div className="bg-black/40 backdrop-blur-md rounded-3xl p-6 shadow-2xl animate-slide-up flex-shrink-0 border border-white/10">
              <h3 className="text-base font-bold mb-4 flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${FISIPOL_PINK}20` }}>
                  <MapPin className="w-5 h-5" style={{ color: FISIPOL_PINK }} />
                </div>
                Nomor Antrian Dipanggil
              </h3>

              {current ? (
                <div className="text-center animate-scale-in">
                  <div className="queue-display relative mb-4">
                    <div className="absolute inset-0 blur-3xl rounded-full opacity-50" style={{ background: FISIPOL_PINK }} />
                    <p
                      className="text-[72px] md:text-[96px] lg:text-[120px] font-black leading-none relative"
                      style={{
                        color: FISIPOL_PINK,
                        textShadow: `0 0 40px ${FISIPOL_PINK}80, 0 0 80px ${FISIPOL_PINK}40`
                      }}
                    >
                      {current.queue_number}
                    </p>
                  </div>

                  <div
                    className="rounded-2xl px-8 py-5 shadow-2xl border border-white/20"
                    style={{ background: `linear-gradient(135deg, ${FISIPOL_PINK} 0%, #CC0099 100%)` }}
                  >
                    <p className="text-sm text-white/90 mb-2 font-bold tracking-wider">SILAKAN MENUJU</p>
                    <p className="text-4xl md:text-5xl font-black text-white tracking-wide">
                      LOKET {current.counter_number}
                    </p>
                  </div>

                  <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                    <p className="text-base text-white/80 font-semibold">
                      {current.service_name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center animate-fade-in py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-white/5 border-2 border-white/10">
                    <Clock className="w-10 h-10 text-white/30" />
                  </div>
                  <p className="text-6xl font-black text-white/20 mb-3">---</p>
                  <p className="text-base text-white/50 font-medium">Menunggu panggilan</p>
                </div>
              )}
            </div>

            {/* Stats card */}
            <div className="bg-black/40 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-white/10 animate-slide-up flex-shrink-0">
              <h3 className="text-base font-bold mb-3 flex items-center gap-3 text-white/90">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white/70" />
                </div>
                Statistik Hari Ini
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-3 text-center border border-amber-500/30">
                  <p className="text-2xl md:text-3xl font-black text-amber-400">{stats?.waiting || 0}</p>
                  <p className="text-xs text-white/60 font-medium mt-1">Menunggu</p>
                </div>
                <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-3 text-center border border-green-500/30">
                  <p className="text-2xl md:text-3xl font-black text-green-400">{stats?.done || 0}</p>
                  <p className="text-xs text-white/60 font-medium mt-1">Selesai</p>
                </div>
                <div className="bg-blue-500/20 backdrop-blur-sm rounded-xl p-3 text-center border border-blue-500/30">
                  <p className="text-2xl md:text-3xl font-black text-blue-400">{stats?.called || 0}</p>
                  <p className="text-xs text-white/60 font-medium mt-1">Dipanggil</p>
                </div>
                <div className="backdrop-blur-sm rounded-xl p-3 text-center border" style={{ background: `${FISIPOL_PINK}20`, borderColor: `${FISIPOL_PINK}40` }}>
                  <p className="text-2xl md:text-3xl font-black" style={{ color: FISIPOL_PINK }}>{stats?.total || 0}</p>
                  <p className="text-xs text-white/60 font-medium mt-1">Total</p>
                </div>
              </div>
            </div>

            {/* Controls card */}
            <div className="bg-black/40 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-white/10 animate-slide-up flex-shrink-0">
              <h3 className="text-base font-bold mb-3 text-white/90">Kontrol</h3>
              <div className="flex gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white font-semibold text-sm w-full justify-center border border-white/20 backdrop-blur-sm"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  {isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee ticker */}
        <div className="mt-4 rounded-2xl py-3 px-6 overflow-hidden border animate-fade-in flex-shrink-0 bg-black/40 backdrop-blur-md shadow-lg" style={{ borderColor: `${FISIPOL_PINK}30` }}>
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-white/70 text-base font-medium">
              • Harap menunggu dengan tertib • Nomor antrian akan dipanggil secara berurutan •
              Pastikan Anda berada di area tunggu • Terima kasih atas kesabaran Anda •
              SIANFIS - Sistem Informasi Antrian Fisipol •
            </span>
          </div>
        </div>

        <footer className="mt-3 text-center text-white/40 text-sm flex-shrink-0 font-medium">
          <p>Sistem Antrian Digital © 2026 • SIANFIS - Sistem Informasi Antrian Fisipol</p>
        </footer>
      </div>

      {/* Admin floating buttons */}
      {isAdmin && !isFullscreen && (
        <div className="fixed bottom-6 left-6 z-50 flex gap-3 animate-slide-up">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-5 py-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl hover:bg-black/80 transition-all text-white font-semibold text-sm shadow-2xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-3 bg-red-500/80 backdrop-blur-md text-white rounded-xl hover:bg-red-600 transition-all font-semibold text-sm shadow-2xl border border-red-400/30"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}

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
