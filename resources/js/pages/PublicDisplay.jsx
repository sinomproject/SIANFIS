import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '@/services/api';
import { Volume2, WifiOff, RefreshCw, ArrowLeft, LogOut, Maximize, Minimize } from 'lucide-react';
import { initSpeechEngine, playAntrian, unlockAudioSystem } from '@/lib/speechEngine';

// ── Design tokens ──────────────────────────────────────────────────────────────
const BLUE     = '#0369a1';
const LIGHT_BG = 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)';
const TEXT      = '#1e293b';
const SUBTEXT   = '#64748b';
const CARD_BG   = '#ffffff';
const CARD_BOR  = '#e2e8f0';

// ── Hardcoded counter definitions for bottom info cards ────────────────────────
const BOTTOM_COUNTERS = [
  { code: 'IP',  name: 'Ilmu Pemerintahan' },
  { code: 'AP',  name: 'Administrasi Publik' },
  { code: 'IK1', name: 'Ilmu Komunikasi 1' },
  { code: 'IK2', name: 'Ilmu Komunikasi 2' },
  { code: 'KTU', name: 'KTU' },
];

// ── PublicDisplay ──────────────────────────────────────────────────────────────
const PublicDisplay = () => {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────────
  const [displayData,        setDisplayData]        = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);
  const [isFullscreen,       setIsFullscreen]       = useState(false);
  const [youtubePlaylistUrl, setYoutubePlaylistUrl] = useState(null);
  const [showUnlockScreen,   setShowUnlockScreen]   = useState(true);
  const [displayMode,        setDisplayMode]        = useState('queue');
  const [externalVideoUrl,   setExternalVideoUrl]   = useState(null);
  const [videoSound,         setVideoSound]         = useState(false);
  const [currentTime,        setCurrentTime]        = useState(new Date());
  const [lastCalledByCode,   setLastCalledByCode]   = useState({});

  const lastQueueId           = useRef(new Set());
  const playedRef             = useRef(new Set());
  const pollingIntervalRef    = useRef(null);
  const speechInitialized     = useRef(false);
  const unlockBtnRef          = useRef(null);
  const displayQueueRef       = useRef([]);
  const displayProcessingRef  = useRef(false);

  const isAdmin = localStorage.getItem('admin_token');

  function processDisplayQueue() {
    if (displayProcessingRef.current) return;
    if (displayQueueRef.current.length === 0) return;

    displayProcessingRef.current = true;

    const queue = displayQueueRef.current.shift();

    console.log('[DISPLAY QUEUE]', queue.queue_number);

    playAntrian(queue.queue_number);

    setTimeout(() => {
      displayProcessingRef.current = false;
      processDisplayQueue();
    }, 2000);
  }

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin-sinom');
  };

  const handleUnlockAudio = async () => {
    const success = await unlockAudioSystem();
    if (success) {
      setShowUnlockScreen(false);
      window.dispatchEvent(new Event('audioUnlocked'));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (showUnlockScreen) {
      setTimeout(() => unlockBtnRef.current?.focus(), 500);
    }
  }, [showUnlockScreen]);

  useEffect(() => {
    if (!showUnlockScreen) return;
    const handler = (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) handleUnlockAudio();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showUnlockScreen]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!speechInitialized.current) {
      initSpeechEngine();
      speechInitialized.current = true;
    }
  }, []);

  // Suppress console output on the display screen
  useEffect(() => {
    if (window.location.pathname.includes('/display')) {
      console.log   = () => {};
      console.warn  = () => {};
      console.error = () => {};
    }
  }, []);

  // Force TV fullscreen layout — prevent any scroll
  useEffect(() => {
    const prev = {
      html: document.documentElement.style.cssText,
      body: document.body.style.cssText,
    };
    document.documentElement.style.cssText += ';overflow:hidden!important;height:100%!important;';
    document.body.style.cssText += ';overflow:hidden!important;height:100%!important;';
    return () => {
      document.documentElement.style.cssText = prev.html;
      document.body.style.cssText = prev.body;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Fetch functions ───────────────────────────────────────────────────────────
  const fetchAppSettings = async () => {
    try {
      const res = await publicApi.getAppSettings();
      if (res.data.success && res.data.data.youtube_playlist_url) {
        setYoutubePlaylistUrl(res.data.data.youtube_playlist_url);
      }
    } catch {}
  };

  const fetchDisplaySettings = async () => {
    try {
      const res = await publicApi.getDisplaySettings();
      if (res.data.success) {
        setDisplayMode(res.data.data.display_mode);
        setExternalVideoUrl(res.data.data.external_video_url);
        setVideoSound(res.data.data.video_sound || false);
      }
    } catch {}
  };

  const fetchDisplayData = async () => {
    try {
      setError(null);
      const res  = await publicApi.getDisplayData();
      const data = res.data.data;

      // Process all recent calls — dedup by queue_id+called_at so recall triggers as new event
      if (Array.isArray(data.current)) {
        [...data.current].reverse().forEach(queue => {
          if (!queue.queue_number || !queue.called_at) return;

          const key = `${queue.queue_id}-${queue.called_at}`;

          if (playedRef.current.has(key)) return;
          playedRef.current.add(key);

          console.log('[PLAY]', key);

          displayQueueRef.current.push(queue);
          processDisplayQueue();
        });

        // Prevent unbounded Set growth
        if (playedRef.current.size > 50) {
          playedRef.current.clear();
        }

        // Track last-called per counter code for bottom cards
        data.current.forEach(queue => {
          if (queue.queue_number) {
            const code = queue.queue_number.split('-')[0];
            setLastCalledByCode(prev => ({ ...prev, [code]: queue.queue_number }));
          }
        });
      }

      setDisplayData(data);
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn('[Display] API rate limited, retrying next interval...');
        setLoading(false);
        return;
      }
      setError('Gagal mengambil data dari server. Pastikan server berjalan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppSettings();
    fetchDisplaySettings();
    fetchDisplayData();

    pollingIntervalRef.current = setInterval(() => {
      fetchDisplaySettings();
      fetchDisplayData();
    }, 5000);

    return () => clearInterval(pollingIntervalRef.current);
  }, []);

  // ── URL helpers ───────────────────────────────────────────────────────────────
  const extractPlaylistId = (url) => {
    if (!url) return null;
    const m = url.match(/[?&]list=([^&]+)/);
    return m ? m[1] : null;
  };

  const extractVideoId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
      /youtube\.com\/watch\?.*v=([^&]+)/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const playlistId      = extractPlaylistId(youtubePlaylistUrl);
  const youtubeEmbedUrl = playlistId
    ? `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1`
    : null;

  const externalVideoId       = extractVideoId(externalVideoUrl);
  const externalVideoEmbedUrl = externalVideoId
    ? `https://www.youtube.com/embed/${externalVideoId}?autoplay=1&mute=${videoSound ? '0' : '1'}&loop=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1&playlist=${externalVideoId}`
    : null;

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: LIGHT_BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 24, fontFamily: 'Arial, sans-serif' }}>
        <div style={{ width: 64, height: 64, border: `4px solid ${BLUE}`,
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: TEXT, fontSize: 20 }}>Memuat data...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────────
  if (error && !displayData) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: LIGHT_BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 20, fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
        <WifiOff style={{ width: 64, height: 64, color: '#ef4444' }} />
        <p style={{ color: TEXT, fontSize: 28, fontWeight: 700 }}>Koneksi Gagal</p>
        <p style={{ color: SUBTEXT, fontSize: 18, maxWidth: 480 }}>{error}</p>
        <button
          onClick={fetchDisplayData}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 36px',
            background: `linear-gradient(135deg, ${BLUE}, #075985)`, color: '#fff',
            border: 'none', borderRadius: 12, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>
          <RefreshCw style={{ width: 20, height: 20 }} />
          Coba Lagi
        </button>
      </div>
    );
  }

  const { current: currentList, stats } = displayData || {};
  // Display panel uses the most-recent call (index 0 = latest)
  const current = currentList?.[0] ?? null;
  const counterLabel = current?.counter_name ||
    (current?.counter_number ? `Loket ${current.counter_number}` : 'Loket');

  // ── VIDEO MODE ────────────────────────────────────────────────────────────────
  if (displayMode === 'video' && externalVideoEmbedUrl) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
        <iframe src={externalVideoEmbedUrl}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
            border: 'none', pointerEvents: 'none' }}
          allow="autoplay; encrypted-media" title="Video Display" />
        {isAdmin && !isFullscreen && <AdminButtons navigate={navigate} handleLogout={handleLogout} />}
      </div>
    );
  }

  // ── QUEUE MODE ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: LIGHT_BG,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      color: TEXT,
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* ── Audio Unlock Overlay ──────────────────────────────────────────────── */}
      {showUnlockScreen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.95)',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 720, padding: '0 32px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 120, height: 120, borderRadius: '50%', marginBottom: 32,
              border: `2px solid ${BLUE}40`,
              background: `${BLUE}20`,
            }}>
              <Volume2 style={{ width: 56, height: 56, color: '#38bdf8' }} />
            </div>

            <h1 style={{ fontSize: 48, fontWeight: 900, color: '#fff',
              marginBottom: 16, lineHeight: 1.2, margin: '0 0 16px' }}>
              Sistem Antrian SIANFIS
            </h1>
            <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)',
              marginBottom: 40, margin: '0 0 40px' }}>
              Tekan tombol atau OK pada remote untuk mengaktifkan suara
            </p>

            <button
              ref={unlockBtnRef}
              onClick={handleUnlockAudio}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUnlockAudio(); }}
              tabIndex={0}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 14,
                padding: '22px 52px',
                background: `linear-gradient(135deg, ${BLUE}, #075985)`,
                color: '#fff', border: 'none', borderRadius: 14,
                fontSize: 24, fontWeight: 700, cursor: 'pointer',
                boxShadow: `0 6px 28px ${BLUE}50`,
                outline: 'none',
              }}
              onFocus={e  => { e.currentTarget.style.outline = `3px solid #38bdf8`; e.currentTarget.style.outlineOffset = '4px'; }}
              onBlur={e   => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.outlineOffset = '0'; }}
            >
              <Volume2 style={{ width: 28, height: 28 }} />
              Aktifkan Suara
            </button>

            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 20 }}>
              Diperlukan sekali saat pertama membuka display
            </p>
          </div>
        </div>
      )}

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div style={{
        height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        background: 'rgba(255,255,255,0.85)',
        borderBottom: `1px solid ${CARD_BOR}`,
        flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* Left: logos + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/assets/LOGO_UMA.png" alt="Logo" style={{ height: 48, objectFit: 'contain' }} />
          <img src="/assets/unggul.png"   alt="Logo" style={{ height: 48, objectFit: 'contain' }} />
          <div style={{ width: 2, height: 40, background: BLUE, borderRadius: 2, margin: '0 8px' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: BLUE, letterSpacing: 1 }}>
              SIANFIS - FISIPOL UMA
            </div>
            <div style={{ fontSize: 13, color: SUBTEXT, marginTop: 1 }}>
              Sistem Informasi Antrian Digital
            </div>
          </div>
        </div>

        {/* Right: clock (WIB) */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 38, fontWeight: 900, fontFamily: 'monospace',
            letterSpacing: 2, lineHeight: 1, color: TEXT,
          }}>
            {currentTime.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: 14, color: SUBTEXT, marginTop: 3 }}>
            {currentTime.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ────────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '60% 40%',
        gridTemplateRows: '1fr',
        minHeight: 0,
        overflow: 'hidden',
      }}>

        {/* LEFT PANEL — Current queue ─────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '16px 24px',
          borderRight: `1px solid ${CARD_BOR}`,
          gap: 0,
          overflow: 'hidden',
        }}>

          {/* Section label */}
          <div style={{
            fontSize: 16, fontWeight: 700, letterSpacing: 3,
            color: SUBTEXT, textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            Nomor Antrian Dipanggil
          </div>

          {current ? (
            <>
              {/* Queue number — BIG */}
              <div style={{
                fontSize: 110, fontWeight: 900, lineHeight: 1,
                color: BLUE,
                marginBottom: 24,
                letterSpacing: 2,
              }}>
                {current.queue_number}
              </div>

              {/* Counter badge */}
              <div style={{
                background: `linear-gradient(135deg, ${BLUE}, #075985)`,
                borderRadius: 14, padding: '14px 48px',
                textAlign: 'center', marginBottom: 20,
                boxShadow: `0 4px 20px ${BLUE}30`,
              }}>
                <div style={{ fontSize: 14, letterSpacing: 3, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>
                  SILAKAN MENUJU
                </div>
                <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, color: '#fff' }}>
                  {counterLabel}
                </div>
              </div>

              {/* Service name */}
              <div style={{
                fontSize: 22, fontWeight: 600,
                color: TEXT, marginBottom: 8,
              }}>
                {current.service_name}
              </div>

              {/* Called time */}
              {current.called_at && (
                <div style={{ fontSize: 16, color: SUBTEXT }}>
                  Dipanggil pukul {current.called_at}
                </div>
              )}

              {/* Mini stats row */}
              <div style={{
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                gap: 16, marginTop: 20,
                padding: '10px 20px',
                background: CARD_BG,
                borderRadius: 10,
                border: `1px solid ${CARD_BOR}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}>
                <StatBit label="Menunggu" value={stats?.waiting ?? 0} color="#d97706" />
                <div style={{ width: 1, height: 32, background: CARD_BOR }} />
                <StatBit label="Selesai"  value={stats?.done    ?? 0} color="#16a34a" />
                <div style={{ width: 1, height: 32, background: CARD_BOR }} />
                <StatBit label="Total"    value={stats?.total   ?? 0} color={BLUE} />
              </div>
            </>
          ) : (
            /* Empty state */
            <>
              <div style={{
                fontSize: 120, fontWeight: 900, color: '#cbd5e1',
                lineHeight: 1, marginBottom: 20,
              }}>
                – – –
              </div>
              <div style={{ fontSize: 24, color: SUBTEXT }}>
                Menunggu panggilan...
              </div>
              {stats && (
                <div style={{
                  display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                  gap: 16, marginTop: 20,
                  padding: '10px 20px',
                  background: CARD_BG,
                  borderRadius: 10,
                  border: `1px solid ${CARD_BOR}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  <StatBit label="Menunggu" value={stats.waiting} color="#d97706" />
                  <div style={{ width: 1, height: 32, background: CARD_BOR }} />
                  <StatBit label="Selesai"  value={stats.done}    color="#16a34a" />
                  <div style={{ width: 1, height: 32, background: CARD_BOR }} />
                  <StatBit label="Total"    value={stats.total}   color={BLUE} />
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT PANEL — YouTube or stats ────────────────────────────────── */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {youtubeEmbedUrl ? (
            /* Rounded wrapper with inset margin */
            <div style={{
              position: 'absolute',
              top: 12, left: 12, right: 12, bottom: 12,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            }}>
              {/* 177.78% width trick — video covers container at any aspect ratio */}
              <iframe
                src={youtubeEmbedUrl}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '177.78%',
                  height: '100%',
                  transform: 'translate(-50%, -50%)',
                  border: 0,
                  display: 'block',
                }}
                allow="autoplay; encrypted-media"
                title="YouTube Playlist"
              />
              {/* Interaction blocker — prevents click, pause, fullscreen */}
              <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                cursor: 'none',
              }} />
            </div>
          ) : (
            <StatsPanel stats={stats} />
          )}
        </div>
      </div>

      {/* ── BOTTOM — Per-counter info cards ───────────────────────────────── */}
      <div style={{
        height: 112,
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 12,
        background: 'rgba(255,255,255,0.8)',
        borderTop: `1px solid ${CARD_BOR}`,
        flexShrink: 0,
      }}>
        {BOTTOM_COUNTERS.map((counter) => {
          const lastCalled = lastCalledByCode[counter.code];
          return (
            <div key={counter.code} style={{
              flex: 1,
              padding: '10px 16px',
              background: CARD_BG,
              border: `1px solid ${CARD_BOR}`,
              borderRadius: 10,
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              minWidth: 0,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: 2,
                color: BLUE, textTransform: 'uppercase', marginBottom: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {counter.name}
              </div>
              <div style={{
                fontSize: 32, fontWeight: 900, lineHeight: 1,
                color: lastCalled ? TEXT : '#cbd5e1',
              }}>
                {lastCalled || '–––'}
              </div>
              <div style={{ fontSize: 11, color: SUBTEXT, marginTop: 3 }}>
                Terakhir dipanggil
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TICKER ───────────────────────────────────────────────────────────── */}
      <div style={{
        height: 36,
        display: 'flex', alignItems: 'center',
        background: BLUE,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          animation: 'ticker 30s linear infinite',
          whiteSpace: 'nowrap',
          fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: 500,
        }}>
          &nbsp;&nbsp;&nbsp;
          • Jam Pelayanan : Senin s.d Jumat : 07.30 s.d 15.30 WIB (Istirahat 12.00 s.d 13.30 WIB). Sabtu : 08.00 s.d 12.00 WIB &nbsp;&nbsp;
          • Harap menunggu dengan tertib &nbsp;&nbsp;
          • Nomor antrian akan dipanggil secara berurutan berdasarkan loket yang dituju&nbsp;&nbsp;
          • Pastikan Anda berada di area tunggu ruangan Administrasi FISIPOL UMA&nbsp;&nbsp;
          • Terima kasih atas kesabaran Anda &nbsp;&nbsp;
          • SIANFIS — Sistem Informasi Antrian Fisipol &nbsp;&nbsp;
        </div>
      </div>

      {/* ── ADMIN FLOAT BUTTONS ──────────────────────────────────────────────── */}
      {isAdmin && !isFullscreen && (
        <div style={{
          position: 'fixed', bottom: 20, left: 20, zIndex: 50,
          display: 'flex', gap: 10,
        }}>
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={adminBtnStyle('#1e293b', CARD_BOR)}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            style={adminBtnStyle('#7f1d1d', '#991b1b')}
          >
            <LogOut style={{ width: 16, height: 16 }} />
            Logout
          </button>
          <button
            onClick={toggleFullscreen}
            style={adminBtnStyle('#1e293b', CARD_BOR)}
          >
            {isFullscreen ? <Minimize style={{ width: 16, height: 16 }} /> : <Maximize style={{ width: 16, height: 16 }} />}
            {isFullscreen ? 'Windowed' : 'Fullscreen'}
          </button>
        </div>
      )}

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

// ── Small helper components ────────────────────────────────────────────────────

const StatBit = ({ label, value, color }) => (
  <div style={{ textAlign: 'center', minWidth: 44 }}>
    <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, color: SUBTEXT, marginTop: 2 }}>{label}</div>
  </div>
);

const StatsPanel = ({ stats }) => (
  <div style={{
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 24,
  }}>
    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 3,
      color: SUBTEXT, textTransform: 'uppercase', marginBottom: 8 }}>
      Statistik Hari Ini
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 380 }}>
      <BigStatCard label="Menunggu"  value={stats?.waiting ?? 0} color="#d97706" bg="#fffbeb"  border="#fde68a"  />
      <BigStatCard label="Selesai"   value={stats?.done    ?? 0} color="#16a34a" bg="#f0fdf4"  border="#bbf7d0"  />
      <BigStatCard label="Dipanggil" value={stats?.called  ?? 0} color="#2563eb" bg="#eff6ff"  border="#bfdbfe"  />
      <BigStatCard label="Total"     value={stats?.total   ?? 0} color={BLUE}    bg="#f0f9ff"  border="#bae6fd"  />
    </div>
  </div>
);

const BigStatCard = ({ label, value, color, bg, border }) => (
  <div style={{
    background: bg, border: `1px solid ${border}`,
    borderRadius: 12, padding: '14px 12px', textAlign: 'center',
  }}>
    <div style={{ fontSize: 40, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 14, color: SUBTEXT, marginTop: 6 }}>{label}</div>
  </div>
);

const AdminButtons = ({ navigate, handleLogout }) => (
  <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 50, display: 'flex', gap: 10 }}>
    <button onClick={() => navigate('/admin/dashboard')} style={adminBtnStyle('#1e293b', '#334155')}>
      <ArrowLeft style={{ width: 16, height: 16 }} />
      Dashboard
    </button>
    <button onClick={handleLogout} style={adminBtnStyle('#7f1d1d', '#991b1b')}>
      <LogOut style={{ width: 16, height: 16 }} />
      Logout
    </button>
  </div>
);

const adminBtnStyle = (bg, border) => ({
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 18px',
  background: bg, color: '#fff',
  border: `1px solid ${border}`,
  borderRadius: 10, fontSize: 14, fontWeight: 600,
  cursor: 'pointer',
});

export default PublicDisplay;
