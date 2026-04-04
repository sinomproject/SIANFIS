import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '@/services/api';
import { Users, Clock, RefreshCw, ArrowLeft, LogOut, WifiOff, Maximize, Minimize, Video, MapPin, Volume2 } from 'lucide-react';
import { initSpeechEngine, enqueueSpeech, unlockAudioSystem } from '@/lib/speechEngine';

const PublicDisplay = () => {
  const navigate = useNavigate();
  const [displayData, setDisplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
<<<<<<< HEAD
  const [youtubePlaylistUrl, setYoutubePlaylistUrl] = useState(null);
  const [showUnlockScreen, setShowUnlockScreen] = useState(true);

  const lastQueueId = useRef(null);
  const pollingIntervalRef = useRef(null);
  const speechInitialized = useRef(false);
=======
  const [videoUrl, setVideoUrl] = useState(null);
  
  const lastQueueIdRef = useRef(null);
  const lastCalledAtRef = useRef(null);
  const soundEnabledRef = useRef(soundEnabled);
  const videoRef = useRef(null);
  const audioInitializedRef = useRef(false);
  
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Initialize audio on first user interaction (for browser autoplay policy)
  const initializeAudio = useCallback(() => {
    if (!audioInitializedRef.current && 'speechSynthesis' in window) {
      // Trigger a silent utterance to initialize the speech synthesis engine
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      audioInitializedRef.current = true;
    }
  }, []);

  // Function to lower video volume
  const lowerVideoVolume = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0.1; // Volume 10% saat panggilan
    }
  }, []);
>>>>>>> 0be3ad1830fce84f2e8e9edaa88fc3fd96533b14

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

<<<<<<< HEAD
  useEffect(() => {
    if (!speechInitialized.current) {
      console.log('[Display] Initializing speech system...');
      initSpeechEngine();
      speechInitialized.current = true;
=======
  // Initialize audio on first user interaction (required by browsers)
  useEffect(() => {
    const initOnInteraction = () => {
      initializeAudio();
      // Remove listeners after first interaction
      document.removeEventListener('click', initOnInteraction);
      document.removeEventListener('touchstart', initOnInteraction);
      document.removeEventListener('keydown', initOnInteraction);
    };
    
    document.addEventListener('click', initOnInteraction);
    document.addEventListener('touchstart', initOnInteraction);
    document.addEventListener('keydown', initOnInteraction);
    
    return () => {
      document.removeEventListener('click', initOnInteraction);
      document.removeEventListener('touchstart', initOnInteraction);
      document.removeEventListener('keydown', initOnInteraction);
    };
  }, [initializeAudio]);

  // Fetch video
  const fetchVideo = useCallback(async () => {
    try {
      const response = await publicApi.getVideo();
      if (response.data.data.exists) {
        setVideoUrl(response.data.data.url);
      }
    } catch (err) {
      console.error('Failed to fetch video:', err);
>>>>>>> 0be3ad1830fce84f2e8e9edaa88fc3fd96533b14
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

  const fetchDisplayData = async () => {
    try {
      setError(null);
      const response = await publicApi.getDisplayData();
      const data = response.data.data;
<<<<<<< HEAD

      if (data.current && data.current.queue_id) {
        if (data.current.queue_id !== lastQueueId.current) {
          console.log('[Display] Queue changed from', lastQueueId.current, 'to', data.current.queue_id);

          lastQueueId.current = data.current.queue_id;

          enqueueSpeech({
            number: data.current.queue_number,
            counter: data.current.counter_number,
            counterName: data.current.counter_name,
            service: data.current.service_name
          });
=======
      
      // Check if there's a new call or recall
      if (data.current) {
        const isNewQueue = data.current.queue_id !== lastQueueIdRef.current;
        const isRecall = data.current.called_at_timestamp && 
                         data.current.called_at_timestamp !== lastCalledAtRef.current;
        
        // Play sound if: new queue OR recall (same queue but new called_at)
        if ((isNewQueue || isRecall) && soundEnabledRef.current) {
          // Initialize audio on first call (browser autoplay policy)
          initializeAudio();
          
          // Turunkan volume video saat panggilan
          lowerVideoVolume();
          
          console.log('Playing sound for queue:', data.current.queue_number, 'Counter:', data.current.counter_number);
          
          // Putar suara panggilan dengan callback untuk mengembalikan volume
          speakQueueNumber(
            data.current.queue_number, 
            data.current.counter_number, 
            data.current.counter_name,
            // Callback setelah panggilan selesai (2x pengulangan)
            () => {
              restoreVideoVolume();
            }
          );
          
          lastQueueIdRef.current = data.current.queue_id;
          lastCalledAtRef.current = data.current.called_at_timestamp;
>>>>>>> 0be3ad1830fce84f2e8e9edaa88fc3fd96533b14
        }
      }

      setDisplayData(data);
    } catch (err) {
      console.error('[Display] Failed to fetch display data:', err);
      setError('Gagal mengambil data dari server. Pastikan server berjalan.');
    } finally {
      setLoading(false);
    }
<<<<<<< HEAD
  };
=======
  }, [lowerVideoVolume, restoreVideoVolume, initializeAudio]);
>>>>>>> 0be3ad1830fce84f2e8e9edaa88fc3fd96533b14

  useEffect(() => {
    console.log('[Display] Starting display page...');

    fetchAppSettings();
    fetchDisplayData();

    pollingIntervalRef.current = setInterval(() => {
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

  const playlistId = extractPlaylistId(youtubePlaylistUrl);
  const youtubeEmbedUrl = playlistId
    ? `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&rel=0&playsinline=1`
    : null;

  if (loading) {
    return (
      <div
        className="h-screen flex flex-col items-center justify-center gap-6"
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
        className="h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: "url('/assets/BG1.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
        <div className="relative z-10 text-center max-w-md">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 mb-6">
            <WifiOff className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Koneksi Gagal</h2>
          <p className="text-white/60 mb-8">{error}</p>
          <button
            onClick={fetchDisplayData}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-800 rounded-2xl font-semibold hover:bg-white/90 transition-all hover:scale-105"
          >
            <RefreshCw className="w-5 h-5" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const { current, stats } = displayData || {};

  return (
    <div
      className="h-screen text-white relative overflow-hidden flex flex-col"
      style={{
        backgroundImage: "url('/assets/BG1.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
      <div className="absolute inset-0 mesh-gradient opacity-20" />

      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Audio Unlock Screen */}
      {showUnlockScreen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-accent/20 mb-8 animate-pulse">
              <Volume2 className="w-16 h-16 text-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Sistem Antrian SIANFIS
            </h1>
            <p className="text-xl text-white/70 mb-8 max-w-md mx-auto">
              Klik tombol di bawah untuk mengaktifkan pengumuman suara antrian
            </p>
            <button
              onClick={handleUnlockAudio}
              className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-accent to-teal-400 text-white rounded-2xl font-bold text-2xl hover:scale-105 transition-all shadow-2xl hover:shadow-accent/50"
            >
              <Volume2 className="w-8 h-8" />
              Aktifkan Suara
            </button>
            <p className="text-sm text-white/40 mt-6">
              Diperlukan sekali saat pertama membuka display
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 p-4 md:p-6 flex flex-col h-full">
        <header className="flex justify-between items-center mb-4 animate-fade-in flex-shrink-0">
          <div className="flex items-center gap-4">
            <img src="/assets/LOGO_UMA.png" alt="Logo" className="h-10 md:h-12 object-contain drop-shadow-lg" />
            <img src="/assets/unggul.png" alt="Logo" className="h-10 md:h-12 object-contain drop-shadow-lg" />
          </div>
          <div className="text-right">
            <p className="text-2xl md:text-3xl font-mono font-bold tracking-wider">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-white/60 text-sm md:text-base">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          <div className="lg:col-span-2 animate-slide-up min-h-0">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl h-full flex flex-col justify-center items-center border border-white/10 shadow-2xl overflow-hidden relative">
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
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600/30 via-accent/20 to-primary-800/30 flex items-center justify-center">
                  <div className="text-center animate-fade-in p-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/5 mb-4">
                      <Video className="w-12 h-12 text-white/20" />
                    </div>
                    <p className="text-lg text-white/40">Background Display</p>
                    <p className="text-sm text-white/30 mt-2">Set YouTube Playlist di pengaturan</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 min-h-0">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/10 animate-slide-up flex-shrink-0">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-accent" />
                </div>
                Nomor Antrian Dipanggil
              </h3>

              {current ? (
                <div className="text-center animate-scale-in">
                  <div className="queue-display relative mb-3">
                    <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
                    <p className="text-[48px] md:text-[64px] font-black text-white leading-none relative drop-shadow-2xl">
                      {current.queue_number}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-accent to-teal-400 rounded-xl px-6 py-3 shadow-xl">
                    <p className="text-sm text-white/80 mb-1 font-medium">SILAKAN MENUJU</p>
                    <p className="text-2xl md:text-3xl font-black text-white">
                      LOKET {current.counter_number}
                    </p>
                  </div>

                  <p className="mt-3 text-sm text-white/70 font-medium">
                    {current.service_name}
                  </p>
                </div>
              ) : (
                <div className="text-center animate-fade-in py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-2">
                    <Clock className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-3xl font-black text-white/20 mb-2">---</p>
                  <p className="text-sm text-white/40">Menunggu panggilan</p>
                </div>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/10 animate-slide-up flex-shrink-0">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                Statistik Hari Ini
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-amber-500/20 rounded-lg p-2 text-center border border-amber-500/30">
                  <p className="text-xl md:text-2xl font-bold text-amber-400">{stats?.waiting || 0}</p>
                  <p className="text-xs text-white/60">Menunggu</p>
                </div>
                <div className="bg-green-500/20 rounded-lg p-2 text-center border border-green-500/30">
                  <p className="text-xl md:text-2xl font-bold text-green-400">{stats?.done || 0}</p>
                  <p className="text-xs text-white/60">Selesai</p>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-2 text-center border border-blue-500/30">
                  <p className="text-xl md:text-2xl font-bold text-blue-400">{stats?.called || 0}</p>
                  <p className="text-xs text-white/60">Dipanggil</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center border border-white/20">
                  <p className="text-xl md:text-2xl font-bold text-white">{stats?.total || 0}</p>
                  <p className="text-xs text-white/60">Total</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 border border-white/10 animate-slide-up flex-shrink-0">
              <h3 className="text-sm font-semibold mb-2 text-white">Kontrol</h3>
              <div className="flex gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white font-medium text-sm w-full justify-center"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  {isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 bg-white/5 backdrop-blur-sm rounded-lg py-2 px-4 overflow-hidden border border-white/10 animate-fade-in flex-shrink-0">
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-white/60 text-sm">
              • Harap menunggu dengan tertib • Nomor antrian akan dipanggil secara berurutan •
              Pastikan Anda berada di area tunggu • Terima kasih atas kesabaran Anda •
              SIANFIS - Sistem Informasi Antrian Fisipol •
            </span>
          </div>
        </div>

        <footer className="mt-2 text-center text-white/40 text-xs flex-shrink-0">
          <p>Sistem Antrian Digital © 2026 • SIANFIS - Sistem Informasi Antrian Fisipol</p>
        </footer>
      </div>

      {isAdmin && !isFullscreen && (
        <div className="fixed bottom-4 left-4 z-50 flex gap-2 animate-slide-up">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-white font-medium text-sm shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm shadow-lg"
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
