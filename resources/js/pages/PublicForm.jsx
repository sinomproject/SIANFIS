import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '@/services/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label, Select, Textarea, Badge } from '@/components/ui';
import { Camera, MapPin, PenLine, Upload, Loader2, AlertTriangle, CheckCircle, X, Navigation, Building2, Radio, Calendar, Clock, IdCard, Settings, User, FileText, Phone, Briefcase } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const officeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Format distance for display
const formatDistance = (meters) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
};

// Format date for display
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Format time for display
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// Component to fit map bounds to show both markers
const FitBounds = ({ userLocation, officeLocation, autoFit }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation && officeLocation && autoFit) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [officeLocation.lat, officeLocation.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, userLocation, officeLocation, autoFit]);

  return null;
};

// Component to update user marker position
const UserLocationMarker = ({ location, distance, accuracy, isWithinZone }) => {
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const map = useMap();

  useEffect(() => {
    if (location && markerRef.current) {
      markerRef.current.setLatLng([location.lat, location.lng]);
    }
  }, [location]);

  useEffect(() => {
    if (location && accuracy) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng([location.lat, location.lng]);
        accuracyCircleRef.current.setRadius(accuracy);
      }
    }
  }, [location, accuracy]);

  if (!location) return null;

  return (
    <>
      <Circle
        ref={accuracyCircleRef}
        center={[location.lat, location.lng]}
        radius={accuracy || 50}
        pathOptions={{
          color: '#FF00BB',
          fillColor: '#FF00BB',
          fillOpacity: 0.15,
          weight: 1,
          dashArray: '5, 5'
        }}
      />
      <Marker ref={markerRef} position={[location.lat, location.lng]} icon={userIcon}>
        <Popup>
          <div className="text-center">
            <Navigation className="w-4 h-4 mx-auto mb-1" />
            <strong>Lokasi Anda</strong>
            <br />
            <span className="text-xs">Jarak: {formatDistance(distance)}</span>
            {accuracy && (
              <>
                <br />
                <span className="text-xs text-muted-foreground">Akurasi: ±{Math.round(accuracy)}m</span>
              </>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
};

const PublicForm = () => {
  const navigate = useNavigate();
  const problemImageInputRef = useRef(null);
  const watchIdRef = useRef(null);

  const [services, setServices] = useState([]);
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [countersLoading, setCountersLoading] = useState(false);
  const [problemImage, setProblemImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isWithinZone, setIsWithinZone] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [autoFitMap, setAutoFitMap] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Location settings from database
  const [locationSettings, setLocationSettings] = useState({
    office_latitude: -5.411118,
    office_longitude: 105.294829,
    max_distance: 10000,
    office_name: 'Kantor BPPMHKP',
    location_required: '1'
  });
  const [locationSettingsLoading, setLocationSettingsLoading] = useState(true);

  // App settings (header, logo, etc)
  const [appSettings, setAppSettings] = useState({
    app_title: 'SIANFIS - Sistem Informasi Antrian Fisipol',
    app_subtitle: 'Buku Tamu Digital',
    logo_left: '/assets/LOGO_UMA.png',
    logo_right: '/assets/unggul.png'
  });

  // Dynamic background image from admin
  const [backgroundImage, setBackgroundImage] = useState(null);

  const [permissions, setPermissions] = useState({
    location: null
  });
  const [showPermissionOverlay, setShowPermissionOverlay] = useState(true);
  const [permissionChecking, setPermissionChecking] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    fakultas: 'Fakultas Ilmu Sosial dan Ilmu Politik',
    alamat: '',
    service_id: '',
    counter_id: '',
    purpose: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Fetch location settings and app settings on mount
  useEffect(() => {
    const fetchLocationSettings = async () => {
      try {
        const response = await publicApi.getLocationSettings();
        if (response.data.success) {
          const settings = response.data.data;
          setLocationSettings({
            office_latitude: parseFloat(settings.office_latitude),
            office_longitude: parseFloat(settings.office_longitude),
            max_distance: parseInt(settings.max_distance),
            office_name: settings.office_name,
            location_required: settings.location_required ?? '1',
          });
        }
      } catch (error) {
        console.error('Failed to fetch location settings:', error);
      } finally {
        setLocationSettingsLoading(false);
      }
    };

    const fetchAppSettings = async () => {
      try {
        const response = await publicApi.getAppSettings();
        if (response.data.success) {
          setAppSettings(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch app settings:', error);
      }
    };

    const fetchBackground = async () => {
      try {
        const response = await publicApi.getDisplayBackground();
        if (response.data.success && response.data.data.url) {
          setBackgroundImage(response.data.data.url);
        }
      } catch (err) {
        // background is optional — fail silently
      }
    };

    fetchLocationSettings();
    fetchAppSettings();
    fetchBackground();
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLocationUpdate = useCallback((position) => {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    setLocation({ lat: userLat, lng: userLng });
    setLocationAccuracy(accuracy);
    setIsTracking(true);

    const dist = calculateDistance(
      locationSettings.office_latitude,
      locationSettings.office_longitude,
      userLat,
      userLng
    );
    setDistance(dist);
    setIsWithinZone(dist <= locationSettings.max_distance);

    setPermissions(prev => ({ ...prev, location: true }));
  }, [locationSettings]);

  const handleLocationError = useCallback((error) => {
    console.error('Location error:', error);
    setIsTracking(false);
    setPermissions(prev => ({ ...prev, location: false }));

    if (error.code === 1) {
      setLocationError('Akses lokasi ditolak. Silakan izinkan akses lokasi untuk melanjutkan.');
    } else if (error.code === 2) {
      setLocationError('Lokasi tidak tersedia. Pastikan GPS aktif.');
    } else if (error.code === 3) {
      setLocationError('Timeout mendapatkan lokasi. Silakan coba lagi.');
    } else {
      setLocationError('Terjadi kesalahan saat mendapatkan lokasi.');
    }
  }, []);

  const startLocationWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Browser tidak mendukung geolokasi');
      setPermissions(prev => ({ ...prev, location: false }));
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  }, [handleLocationUpdate, handleLocationError]);

  const stopLocationWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Derived: whether location verification is enforced by admin setting
  const locationRequired = locationSettings.location_required !== '0';

  useEffect(() => {
    if (!locationSettingsLoading) {
      if (locationRequired) {
        requestPermissions();
      } else {
        // Location not required — bypass geo entirely, allow the form
        setPermissionChecking(false);
        setShowPermissionOverlay(false);
        setIsWithinZone(true);
      }
    }

    return () => {
      stopLocationWatch();
    };
  }, [locationSettingsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const requestPermissions = async () => {
    setPermissionChecking(true);
    startLocationWatch();
    setPermissionChecking(false);
  };

  useEffect(() => {
    const canFetch = !permissionChecking && (
      !locationRequired || (permissions.location && isWithinZone)
    );
    if (canFetch) {
      const fetchServices = async () => {
        try {
          const response = await publicApi.getServices();
          setServices(response.data.data || []);
        } catch (error) {
          console.error('Failed to fetch services:', error);
        } finally {
          setServicesLoading(false);
        }
      };
      fetchServices();
    }
  }, [permissionChecking, permissions.location, isWithinZone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProblemImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setProblemImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    // If service changes, fetch counters for that service and reset counter selection
    if (name === 'service_id') {
      setFormData(prev => ({ ...prev, counter_id: '' }));
      if (value) {
        fetchCountersByService(value);
      } else {
        setCounters([]);
      }
    }
  };

  // Fetch counters for a specific service
  const fetchCountersByService = async (serviceId) => {
    if (!serviceId) {
      setCounters([]);
      return;
    }

    setCountersLoading(true);
    try {
      const response = await publicApi.getCountersByService(serviceId);
      if (response.data.success) {
        setCounters(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch counters:', error);
      setCounters([]);
    } finally {
      setCountersLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nama wajib diisi';
    if (!formData.service_id) newErrors.service_id = 'Pilih layanan';
    if (!formData.counter_id) newErrors.counter_id = 'Pilih loket';
    if (!formData.purpose.trim()) newErrors.purpose = 'Keperluan wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (locationRequired && !isWithinZone) {
      alert('Anda di luar zona akses. Form tidak dapat dikirim.');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        agency: formData.fakultas,
        problem_image: problemImage,
        location_lat: location?.lat,
        location_lng: location?.lng,
      };

      const response = await publicApi.registerVisitor(payload);

      if (response.data.success) {
        const { queue_id } = response.data.data;
        navigate(`/ticket/${queue_id}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('Terjadi kesalahan saat mendaftar');
      }
    } finally {
      setLoading(false);
    }
  };

  // Permission denied overlay (only when location is required by admin)
  if (locationRequired && !permissionChecking && showPermissionOverlay) {
    const hasAllPermissions = permissions.location;
    const canProceed = hasAllPermissions && isWithinZone !== false;

    if (!hasAllPermissions || isWithinZone === false) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
          style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : "url('/assets/bgtech.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark Overlay - Same as Admin Login */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
          <div className="absolute inset-0 mesh-gradient opacity-20" />

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

          <Card variant="elevated" className="relative z-10 max-w-lg w-full animate-scale-in">
            <CardHeader className="text-center pb-2">
              <div className="flex items-center justify-center gap-6 mb-6">
                <img src={appSettings.logo_left} alt="Logo Kiri" className="h-16 object-contain drop-shadow-lg" />
                <img src={appSettings.logo_right} alt="Logo Kanan" className="h-16 object-contain drop-shadow-lg" />
              </div>

              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-600 shadow-material-3 mb-6 mx-auto">
                <MapPin className="w-10 h-10 text-white" />
              </div>

              <CardTitle className="text-2xl font-bold">Izin Akses Diperlukan</CardTitle>
              <p className="text-muted-foreground mt-2">
                Sistem memerlukan akses lokasi untuk verifikasi
              </p>
            </CardHeader>

            <CardContent className="pt-4">

              <div className="space-y-4 mb-6">
                {!permissions.location && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm animate-fade-in flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    {locationError || 'Izin lokasi ditolak. Silakan izinkan akses lokasi di browser Anda.'}
                  </div>
                )}

                {permissions.location && isWithinZone === false && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm">
                    <p className="font-semibold mb-2">Di luar zona akses!</p>
                    <p>Anda berada <strong>{formatDistance(distance)}</strong> dari kantor.</p>
                    <p>Maksimal <strong>{formatDistance(locationSettings.max_distance)}</strong>.</p>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                  <span className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    Status Lokasi
                  </span>
                  {permissions.location === null ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : permissions.location ? (
                    <div className="flex items-center gap-2">
                      {isTracking && <Radio className="w-3 h-3 text-green-500 animate-pulse" />}
                      <Badge variant="success">Aktif</Badge>
                    </div>
                  ) : (
                    <Badge variant="destructive">Ditolak</Badge>
                  )}
                </div>

                {distance !== null && (
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${
                    isWithinZone
                      ? 'bg-green-500/10 border-green-500/20 text-green-300'
                      : 'bg-red-500/10 border-red-500/20 text-red-300'
                  }`}>
                    <span className="flex items-center gap-3 text-sm">
                      <Navigation className="w-4 h-4" />
                      Jarak dari kantor
                    </span>
                    <span className="font-bold text-sm">
                      {formatDistance(distance)}
                    </span>
                  </div>
                )}
              </div>

              {permissions.location && location && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">Peta Lokasi Real-Time</p>
                    {isTracking && (
                      <Badge variant="success" className="text-xs">
                        <Radio className="w-3 h-3 mr-1 animate-pulse" />
                        Live
                      </Badge>
                    )}
                  </div>
                  <div className="rounded-xl overflow-hidden border-2 border-border shadow-lg" style={{ height: '280px' }}>
                    <MapContainer
                      center={[locationSettings.office_latitude, locationSettings.office_longitude]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[locationSettings.office_latitude, locationSettings.office_longitude]} icon={officeIcon}>
                        <Popup>
                          <div className="text-center">
                            <Building2 className="w-4 h-4 mx-auto mb-1" />
                            <strong>{locationSettings.office_name}</strong>
                          </div>
                        </Popup>
                      </Marker>
                      <UserLocationMarker
                        location={location}
                        distance={distance}
                        accuracy={locationAccuracy}
                        isWithinZone={isWithinZone}
                      />
                      <Circle
                        center={[locationSettings.office_latitude, locationSettings.office_longitude]}
                        radius={locationSettings.max_distance}
                        pathOptions={{
                          color: isWithinZone ? '#22c55e' : '#ef4444',
                          fillColor: isWithinZone ? '#22c55e' : '#ef4444',
                          fillOpacity: 0.1,
                          weight: 2
                        }}
                      />
                      <FitBounds
                        userLocation={location}
                        officeLocation={{ lat: locationSettings.office_latitude, lng: locationSettings.office_longitude }}
                        autoFit={autoFitMap}
                      />
                    </MapContainer>
                  </div>
                  {locationAccuracy && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Akurasi GPS: ±{Math.round(locationAccuracy)}m
                      {locationAccuracy > 100 && (
                        <span className="text-amber-500 ml-2">(Rendah)</span>
                      )}
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={requestPermissions}
                size="lg"
                className="w-full mt-6"
              >
                Coba Lagi
              </Button>

              {hasAllPermissions && isWithinZone === false && (
                <p className="text-center text-muted-foreground text-sm mt-4">
                  Lokasi Anda diupdate secara real-time. Mendekatlah ke kantor untuk mengakses form.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : "url('/assets/bgtech.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark Overlay - Same as Admin Login */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
      <div className="absolute inset-0 mesh-gradient opacity-20" />

      {/* Decorative Elements - Same as Admin Login */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      {/* Scrollable Container for Long Form */}
      <div className="relative z-10 w-full max-w-2xl max-h-[95vh] overflow-y-auto scrollbar-hide">
        <div className="py-4">
          {/* Admin Button - Floating Top Right */}
          <div className="absolute top-4 right-4 print-hidden z-20">
            <button
              onClick={() => navigate('/admin/login')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-black shadow-lg"
            >
              <User className="w-4 h-4" />
              Login Staff
            </button>
          </div>


          {/* Main Card - Same Style as Admin Login */}
          <Card variant="elevated" className="animate-scale-in mb-4">
            <CardHeader className="text-center pb-2">
              {/* Logos - Same as Admin Login */}
              <div className="flex items-center justify-center gap-6 mb-6">
                <img src={appSettings.logo_left} alt="Logo Kiri" className="h-16 object-contain drop-shadow-lg" />
                <img src={appSettings.logo_right} alt="Logo Kanan" className="h-16 object-contain drop-shadow-lg" />
              </div>

              {/* Icon Badge - Same as Admin Login */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-600 shadow-material-3 mb-6 mx-auto">
                <FileText className="w-10 h-10 text-white" />
              </div>

              <CardTitle className="text-2xl font-bold">Form Pendaftaran Pengunjung</CardTitle>
              <p className="text-muted-foreground mt-2">
                {appSettings.app_title}
              </p>

              {/* Location Status Badge */}
              {locationRequired && (
                <div className="mt-4">
                  {distance !== null && (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                      isWithinZone
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      {isWithinZone ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Di dalam zona ({formatDistance(distance)})</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          <span>Di luar zona ({formatDistance(distance)})</span>
                        </>
                      )}
                      {isTracking && <Radio className="w-3 h-3 animate-pulse ml-1" />}
                    </div>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* System Info - Compact */}
              {locationRequired && location && (
                <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      Lokasi
                    </span>
                    <span className="font-mono text-foreground">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Tanggal
                    </span>
                    <span className="font-mono text-foreground">{formatDate(currentDateTime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Waktu
                    </span>
                    <span className="font-mono text-foreground font-bold">{formatTime(currentDateTime)}</span>
                  </div>
                </div>
              )}

              {/* Form Inputs - Same Style as Admin Login */}
              {errors.name && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm animate-fade-in flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  Mohon lengkapi semua field yang wajib diisi
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap *</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground">
                    <User className="w-5 h-5" />
                  </div>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama lengkap Anda"
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor HP / WhatsApp</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground">
                    <Phone className="w-5 h-5" />
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="08xxxxxxxxxx"
                    className="pl-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_id">Pilih Layanan *</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <Select
                    id="service_id"
                    name="service_id"
                    value={formData.service_id}
                    onChange={handleInputChange}
                    className="pl-12"
                    disabled={servicesLoading}
                    required
                    autoFocus
                  >
                    <option value="">{servicesLoading ? 'Memuat layanan...' : 'Pilih layanan'}</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </Select>
                </div>
                {errors.service_id && (
                  <p className="text-sm text-destructive font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.service_id}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="counter_id">Pilih Loket *</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10">
                    <IdCard className="w-5 h-5" />
                  </div>
                  <Select
                    id="counter_id"
                    name="counter_id"
                    value={formData.counter_id}
                    onChange={handleInputChange}
                    className="pl-12"
                    disabled={!formData.service_id || countersLoading}
                    required
                  >
                    <option value="">
                      {!formData.service_id
                        ? 'Pilih layanan terlebih dahulu'
                        : countersLoading
                        ? 'Memuat loket...'
                        : counters.length === 0
                        ? 'Tidak ada loket tersedia'
                        : 'Pilih loket'}
                    </option>
                    {counters.map(counter => (
                      <option key={counter.id} value={counter.id}>
                        {counter.name} {counter.number ? `(Loket ${counter.number})` : ''}
                      </option>
                    ))}
                  </Select>
                </div>
                {errors.counter_id && (
                  <p className="text-sm text-destructive font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.counter_id}
                  </p>
                )}
                {formData.service_id && counters.length === 0 && !countersLoading && (
                  <p className="text-xs text-muted-foreground">
                    Belum ada loket untuk layanan ini
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Keperluan *</Label>
                <Textarea
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="Jelaskan keperluan Anda secara singkat"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat (Opsional)</Label>
                <Textarea
                  id="alamat"
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleInputChange}
                  placeholder="Masukkan alamat lengkap"
                  rows={2}
                />
              </div>

              {/* Fakultas - Hidden */}
              <input type="hidden" name="fakultas" value={formData.fakultas} />

              {/* Upload Section - Compact */}
              <div className="space-y-2">
                <Label>Foto Permasalahan (Opsional)</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 bg-muted/20">
                  {problemImage ? (
                    <div className="text-center">
                      <img src={problemImage} alt="Problem" className="w-full max-w-xs h-48 object-contain rounded-lg mx-auto mb-3" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setProblemImage(null)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Hapus Foto
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => problemImageInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Foto
                    </Button>
                  )}
                  <input
                    ref={problemImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProblemImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Submit Button - Same as Admin Login */}
              <Button
                type="submit"
                size="lg"
                className="w-full mt-6"
                disabled={loading || (locationRequired && !isWithinZone)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (locationRequired && !isWithinZone) ? (
                  <>
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Di luar zona akses
                  </>
                ) : (
                  'Ambil Nomor Antrian'
                )}
              </Button>

              {/* Map Toggle Button - If location required */}
              {locationRequired && location && (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="w-full"
                  onClick={() => setAutoFitMap(!autoFitMap)}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {isTracking ? 'Tracking Aktif' : 'Lihat Peta'}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Map Card - Separate Card Below Main Form (if location required) */}
        {locationRequired && location && (
          <Card variant="elevated" className="animate-slide-up mt-4" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Peta Lokasi Real-Time
                {isTracking && (
                  <Badge variant="success" className="ml-2">
                    <Radio className="w-3 h-3 mr-1 animate-pulse" />
                    Live
                  </Badge>
                )}
              </CardTitle>
              {locationAccuracy && (
                <p className="text-xs text-muted-foreground mt-1">
                  Akurasi: ±{Math.round(locationAccuracy)}m
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="rounded-xl overflow-hidden border-2 border-border shadow-lg" style={{ height: '300px' }}>
                <MapContainer
                  center={[locationSettings.office_latitude, locationSettings.office_longitude]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[locationSettings.office_latitude, locationSettings.office_longitude]} icon={officeIcon}>
                    <Popup>
                      <div className="text-center">
                        <Building2 className="w-4 h-4 mx-auto mb-1" />
                        <strong>{locationSettings.office_name}</strong>
                      </div>
                    </Popup>
                  </Marker>
                  <UserLocationMarker
                    location={location}
                    distance={distance}
                    accuracy={locationAccuracy}
                    isWithinZone={isWithinZone}
                  />
                  <Circle
                    center={[locationSettings.office_latitude, locationSettings.office_longitude]}
                    radius={locationSettings.max_distance}
                    pathOptions={{
                      color: isWithinZone ? '#22c55e' : '#ef4444',
                      fillColor: isWithinZone ? '#22c55e' : '#ef4444',
                      fillOpacity: 0.1,
                      weight: 2
                    }}
                  />
                  <FitBounds
                    userLocation={location}
                    officeLocation={{ lat: locationSettings.office_latitude, lng: locationSettings.office_longitude }}
                    autoFit={autoFitMap}
                  />
                </MapContainer>
              </div>
              {locationAccuracy > 100 && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 text-center">
                  ⚠️ Akurasi GPS rendah ({Math.round(locationAccuracy)}m). Pastikan GPS aktif dan Anda berada di area terbuka.
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
};

export default PublicForm;
