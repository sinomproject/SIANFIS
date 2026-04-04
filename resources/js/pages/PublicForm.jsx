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
  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
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
    office_name: 'Kantor BPPMHKP'
  });
  const [locationSettingsLoading, setLocationSettingsLoading] = useState(true);

  // App settings (header, logo, etc)
  const [appSettings, setAppSettings] = useState({
    app_title: 'SIANFIS - Sistem Informasi Antrian Fisipol',
    app_subtitle: 'Buku Tamu Digital',
    logo_left: '/assets/LOGO_UMA.png',
    logo_right: '/assets/unggul.png'
  });

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
            office_name: settings.office_name
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

    fetchLocationSettings();
    fetchAppSettings();
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

  useEffect(() => {
    if (!locationSettingsLoading) {
      requestPermissions();
    }

    return () => {
      stopLocationWatch();
    };
  }, [locationSettingsLoading]);

  const requestPermissions = async () => {
    setPermissionChecking(true);
    startLocationWatch();
    setPermissionChecking(false);
  };

  useEffect(() => {
    if (!permissionChecking && permissions.location && isWithinZone) {
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
  }, [permissionChecking, permissions.location, isWithinZone]);

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
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nama wajib diisi';
    if (!formData.service_id) newErrors.service_id = 'Pilih loket/layanan';
    if (!formData.purpose.trim()) newErrors.purpose = 'Keperluan wajib diisi';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isWithinZone) {
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

  // Permission denied overlay
  if (!permissionChecking && showPermissionOverlay) {
    const hasAllPermissions = permissions.location;
    const canProceed = hasAllPermissions && isWithinZone !== false;

    if (!hasAllPermissions || isWithinZone === false) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 0, 187, 0.15) 100%)'
          }}
        >
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #FF00BB 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <Card variant="elevated" className="relative z-10 max-w-lg w-full animate-scale-in">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-6 mb-8">
                <img src={appSettings.logo_left} alt="Logo Kiri" className="h-16 object-contain drop-shadow-lg" />
                <img src={appSettings.logo_right} alt="Logo Kanan" className="h-16 object-contain drop-shadow-lg" />
              </div>

              <h2 className="text-2xl font-bold text-center mb-6" style={{ color: '#FF00BB' }}>Izin Akses Diperlukan</h2>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="flex items-center gap-3 font-medium text-gray-700">
                    <MapPin className="w-5 h-5" style={{ color: '#FF00BB' }} />
                    Lokasi
                  </span>
                  {permissions.location === null ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  ) : permissions.location ? (
                    <div className="flex items-center gap-2">
                      {isTracking && <Radio className="w-4 h-4 text-green-500 animate-pulse" />}
                      <Badge variant="success">Aktif</Badge>
                    </div>
                  ) : (
                    <Badge variant="error">Ditolak</Badge>
                  )}
                </div>

                {distance !== null && (
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${isWithinZone ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <span className="flex items-center gap-3 font-medium text-gray-700">
                      <Navigation className={`w-5 h-5 ${isWithinZone ? 'text-green-500' : 'text-red-500'}`} />
                      Jarak dari kantor
                    </span>
                    <span className={`font-bold ${isWithinZone ? 'text-green-600' : 'text-red-600'}`}>
                      {formatDistance(distance)}
                    </span>
                  </div>
                )}
              </div>

              {!permissions.location && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-sm">
                  {locationError || 'Izin lokasi ditolak. Silakan izinkan akses lokasi di browser Anda.'}
                </div>
              )}

              {permissions.location && isWithinZone === false && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm">
                  <p className="font-semibold mb-2">Di luar zona akses!</p>
                  <p>Anda berada <strong>{formatDistance(distance)}</strong> dari kantor.</p>
                  <p>Maksimal <strong>{formatDistance(locationSettings.max_distance)}</strong>.</p>
                  <p className="mt-2">Silakan mendekati lokasi kantor untuk mengakses form.</p>
                </div>
              )}

              {permissions.location && location && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">Peta Lokasi (Real-time):</p>
                    {isTracking && (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <Radio className="w-3 h-3 animate-pulse" />
                        Tracking aktif
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg" style={{ height: '300px' }}>
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
                            <br />
                            <span className="text-xs">Pusat Zona Akses</span>
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
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Akurasi GPS: ±{Math.round(locationAccuracy)}m
                      {locationAccuracy > 100 && (
                        <span className="text-amber-600 ml-2">(Akurasi rendah)</span>
                      )}
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={requestPermissions}
                size="lg"
                className="w-full"
                style={{
                  background: 'linear-gradient(135deg, #FF00BB 0%, #CC0099 100%)',
                  borderColor: '#FF00BB'
                }}
              >
                Coba Lagi
              </Button>

              {hasAllPermissions && isWithinZone === false && (
                <p className="text-center text-gray-500 text-sm mt-4">
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
    <>
      {/* FISIPOL Branded Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 0, 187, 0.13) 100%)'
        }}
      />

      <div className="fixed inset-0 z-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #FF00BB 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* Main Content */}
      <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Admin Button - Top Right */}
          <div className="flex justify-end items-center mb-6 print-hidden">
            <button
              onClick={() => navigate('/admin/login')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-sm backdrop-blur-sm border bg-white/80 hover:bg-white border-gray-200 text-gray-800 shadow-sm hover:shadow"
            >
              <Settings className="w-4 h-4" />
              Admin
            </button>
          </div>

          {/* Header with Logos */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="flex items-center justify-center gap-8 mb-6">
              <img src={appSettings.logo_left} alt="Logo Kiri" className="h-24 md:h-28 object-contain drop-shadow-lg" />
              <img src={appSettings.logo_right} alt="Logo Kanan" className="h-24 md:h-28 object-contain drop-shadow-lg" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">{appSettings.app_title}</h1>
            <p className="text-xl text-gray-600">{appSettings.app_subtitle}</p>
          </div>

        {/* Zone Status */}
        {distance !== null && (
          <div className={`mb-6 p-5 rounded-2xl flex items-center justify-between animate-slide-up shadow-lg ${isWithinZone ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
            <div className="flex items-center gap-3">
              {isWithinZone ? (
                <>
                  <CheckCircle className="w-7 h-7 text-green-600" />
                  <span className="text-green-700 font-bold text-lg">Di dalam zona akses</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                  <span className="text-red-700 font-bold text-lg">Di luar zona akses</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isTracking && <Radio className="w-5 h-5 text-green-600 animate-pulse" />}
              <span className={`font-black text-xl ${isWithinZone ? 'text-green-700' : 'text-red-700'}`}>
                {formatDistance(distance)}
              </span>
            </div>
          </div>
        )}

        {/* Interactive Map */}
        {location && (
          <Card variant="elevated" className="mb-6 animate-slide-up shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-3 text-gray-900">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255, 0, 187, 0.1)' }}>
                    <MapPin className="w-5 h-5" style={{ color: '#FF00BB' }} />
                  </div>
                  Peta Lokasi (Real-time)
                </h3>
                <div className="flex items-center gap-3">
                  {isTracking && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                      <Radio className="w-3 h-3 animate-pulse" />
                      Live
                    </span>
                  )}
                  {locationAccuracy && (
                    <span className="text-xs text-gray-500 font-medium">
                      ±{Math.round(locationAccuracy)}m
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg" style={{ height: '280px' }}>
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
                <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-700 text-center font-medium">
                  ⚠️ Akurasi GPS rendah ({Math.round(locationAccuracy)}m). Untuk akurasi lebih baik, pastikan GPS aktif dan Anda berada di area terbuka.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form Card */}
        <Card variant="elevated" className="animate-slide-up shadow-xl" style={{ animationDelay: '100ms' }}>
          <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
            <CardTitle className="text-2xl font-black text-gray-900">Form Pendaftaran Pengunjung</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section: OTOMATIS / SISTEM */}
              <div className="space-y-5">
                <h3 className="text-sm font-black text-gray-600 uppercase tracking-wider flex items-center gap-2 pb-3 border-b-2" style={{ borderColor: 'rgba(255, 0, 187, 0.2)' }}>
                  <Radio className="w-4 h-4" style={{ color: '#FF00BB' }} />
                  Otomatis / Sistem
                </h3>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Koordinat Lokasi */}
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Koordinat Lokasi</Label>
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" style={{ color: '#FF00BB' }} />
                        {location ? (
                          <span className="text-sm font-mono text-gray-700 font-semibold">
                            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Mendeteksi...</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tanggal */}
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Tanggal Kunjungan</Label>
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" style={{ color: '#FF00BB' }} />
                        <span className="text-sm font-mono font-semibold text-gray-700">{formatDate(currentDateTime)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Jam */}
                  <div className="space-y-2">
                    <Label className="font-bold text-gray-700">Jam Kunjungan</Label>
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" style={{ color: '#FF00BB' }} />
                        <span className="text-sm font-mono font-black text-gray-900">{formatTime(currentDateTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: INPUT MANUAL */}
              <div className="space-y-5">
                <h3 className="text-sm font-black text-gray-600 uppercase tracking-wider flex items-center gap-2 pb-3 border-b-2" style={{ borderColor: 'rgba(255, 0, 187, 0.2)' }}>
                  <PenLine className="w-4 h-4" style={{ color: '#FF00BB' }} />
                  Input Manual
                </h3>

                {/* Name */}
                <div className="space-y-2">
                  <Label required className="font-bold text-gray-700 text-base">Nama Lengkap</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#FF00BB' }}>
                      <User className="w-5 h-5" />
                    </div>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama lengkap Anda"
                      className={`pl-12 text-base h-14 ${errors.name ? 'border-red-500 border-2' : 'border-gray-300 border-2 focus:border-[#FF00BB]'}`}
                    />
                  </div>
                  {errors.name && <p className="text-sm text-red-600 font-semibold">{errors.name}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700 text-base">Nomor HP / WhatsApp</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#FF00BB' }}>
                      <Phone className="w-5 h-5" />
                    </div>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="08xxxxxxxxxx"
                      className="pl-12 text-base h-14 border-gray-300 border-2 focus:border-[#FF00BB]"
                    />
                  </div>
                </div>

                {/* Pilih Loket / Service */}
                <div className="space-y-2">
                  <Label required className="font-bold text-gray-700 text-base">Pilih Loket / Layanan</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" style={{ color: '#FF00BB' }}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <Select
                      name="service_id"
                      value={formData.service_id}
                      onChange={handleInputChange}
                      className={`pl-12 text-base h-14 ${errors.service_id ? 'border-red-500 border-2' : 'border-gray-300 border-2 focus:border-[#FF00BB]'}`}
                      disabled={servicesLoading}
                    >
                      <option value="">{servicesLoading ? 'Memuat layanan...' : 'Pilih loket/layanan yang dituju'}</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {errors.service_id && <p className="text-sm text-red-600 font-semibold">{errors.service_id}</p>}
                  <p className="text-sm text-gray-500">Pilih loket/layanan sesuai keperluan Anda</p>
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label required className="font-bold text-gray-700 text-base">Keperluan</Label>
                  <Textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    placeholder="Jelaskan keperluan Anda secara singkat"
                    className={`text-base ${errors.purpose ? 'border-red-500 border-2' : 'border-gray-300 border-2 focus:border-[#FF00BB]'}`}
                    rows={4}
                  />
                  {errors.purpose && <p className="text-sm text-red-600 font-semibold">{errors.purpose}</p>}
                </div>

                {/* Alamat */}
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700 text-base">Alamat (Opsional)</Label>
                  <Textarea
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleInputChange}
                    placeholder="Masukkan alamat lengkap"
                    rows={2}
                    className="text-base border-gray-300 border-2 focus:border-[#FF00BB]"
                  />
                </div>

                {/* Fakultas - Hidden/Readonly */}
                <input type="hidden" name="fakultas" value={formData.fakultas} />
              </div>

              {/* Section: UPLOAD (OPSIONAL) */}
              <div className="space-y-5">
                <h3 className="text-sm font-black text-gray-600 uppercase tracking-wider flex items-center gap-2 pb-3 border-b-2" style={{ borderColor: 'rgba(255, 0, 187, 0.2)' }}>
                  <Upload className="w-4 h-4" style={{ color: '#FF00BB' }} />
                  Upload Permasalahan (Opsional)
                </h3>

                <div className="space-y-2">
                  <Label className="font-bold text-gray-700">Foto Permasalahan</Label>
                  <p className="text-sm text-gray-500">Upload foto terkait permasalahan Anda (tidak wajib)</p>
                  <div className="border-2 border-dashed rounded-xl p-6 bg-gray-50" style={{ borderColor: 'rgba(255, 0, 187, 0.3)' }}>
                    {problemImage ? (
                      <div className="text-center">
                        <img src={problemImage} alt="Problem" className="w-full max-w-md h-64 object-contain rounded-xl mx-auto mb-4 shadow-lg" />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setProblemImage(null)}
                          className="border-2 border-gray-300"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Hapus Foto
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-14 text-base font-semibold border-2"
                        style={{ borderColor: '#FF00BB', color: '#FF00BB' }}
                        onClick={() => problemImageInputRef.current?.click()}
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Foto Permasalahan
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
              </div>

              {/* Submit Button - BIG AND TOUCHSCREEN FRIENDLY */}
              <Button
                type="submit"
                size="xl"
                className="w-full h-16 text-xl font-black shadow-2xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading || !isWithinZone
                    ? '#9CA3AF'
                    : 'linear-gradient(135deg, #FF00BB 0%, #CC0099 100%)',
                  borderColor: '#FF00BB'
                }}
                disabled={loading || !isWithinZone}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Memproses...
                  </>
                ) : !isWithinZone ? (
                  'Di luar zona akses'
                ) : (
                  'AMBIL NOMOR ANTRIAN'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  );
};

export default PublicForm;
