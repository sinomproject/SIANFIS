import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '@/services/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label, Select, Textarea, Badge } from '@/components/ui';
import { Camera, MapPin, PenLine, Upload, Loader2, AlertTriangle, CheckCircle, X, Navigation, Building2, Radio, Calendar, Clock, IdCard, Settings, User, FileText, Phone, Sun, Moon } from 'lucide-react';
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

// Office coordinates (Balai PPMHKP Lampung)
const OFFICE_LAT = -5.411118;
const OFFICE_LNG = 105.294829;
const MAX_DISTANCE = 10000; // 10 km in meters

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
          color: '#3b82f6',
          fillColor: '#3b82f6',
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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const signatureRef = useRef(null);
  const fileInputRef = useRef(null);
  const identityFileInputRef = useRef(null);
  const watchIdRef = useRef(null);

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(null);
  const [identityPhoto, setIdentityPhoto] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isWithinZone, setIsWithinZone] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [autoFitMap, setAutoFitMap] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Theme state - true = dark mode (BG1.jpg), false = light mode (BG.jpg)
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [permissions, setPermissions] = useState({
    camera: null,
    location: null
  });
  const [showPermissionOverlay, setShowPermissionOverlay] = useState(true);
  const [permissionChecking, setPermissionChecking] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    agency: '',
    alamat: '',
    service_id: '',
    purpose: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

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
    
    const dist = calculateDistance(OFFICE_LAT, OFFICE_LNG, userLat, userLng);
    setDistance(dist);
    setIsWithinZone(dist <= MAX_DISTANCE);
    
    setPermissions(prev => ({ ...prev, location: true }));
  }, []);

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
    requestPermissions();
    
    return () => {
      stopLocationWatch();
    };
  }, []);

  const requestPermissions = async () => {
    setPermissionChecking(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, camera: true }));
    } catch (error) {
      console.error('Camera permission denied:', error);
      setPermissions(prev => ({ ...prev, camera: false }));
    }

    startLocationWatch();
    
    setPermissionChecking(false);
  };

  useEffect(() => {
    if (!permissionChecking && permissions.camera && permissions.location && isWithinZone) {
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
  }, [permissionChecking, permissions.camera, permissions.location, isWithinZone]);

  useEffect(() => {
    if (!signatureRef.current) return;
    
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    // Dynamic stroke color based on theme
    ctx.strokeStyle = isDarkMode ? '#ffffff' : '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      if (e.touches) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const startDrawing = (e) => {
      isDrawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (isDrawing) {
        isDrawing = false;
        setSignatureData(canvas.toDataURL('image/png'));
      }
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isWithinZone, isDarkMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0);
    
    setPhotoCaptured(canvas.toDataURL('image/jpeg', 0.8));
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoCaptured(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleIdentityUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setIdentityPhoto(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const clearSignature = () => {
    if (!signatureRef.current) return;
    const ctx = signatureRef.current.getContext('2d');
    ctx.clearRect(0, 0, signatureRef.current.width, signatureRef.current.height);
    setSignatureData(null);
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
    if (!formData.agency.trim()) newErrors.agency = 'Instansi / Perusahaan wajib diisi';
    if (!formData.service_id) newErrors.service_id = 'Pilih layanan';
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
        photo: photoCaptured,
        identity_photo: identityPhoto,
        signature: signatureData,
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
    const hasAllPermissions = permissions.camera && permissions.location;
    const canProceed = hasAllPermissions && isWithinZone !== false;

    if (!hasAllPermissions || isWithinZone === false) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 mesh-gradient opacity-30" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          
          <Card variant="elevated" className="relative z-10 max-w-lg w-full animate-scale-in">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-6 mb-8">
                <img src="/assets/logo1-kkp.png.png" alt="KKP" className="h-16 object-contain drop-shadow-lg" />
                <img src="/assets/logo2-bppmhkp.png" alt="BPPMHKP" className="h-16 object-contain drop-shadow-lg" />
              </div>

              <h2 className="text-2xl font-bold text-center mb-6">Izin Akses Diperlukan</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <span className="flex items-center gap-3 font-medium">
                    <Camera className="w-5 h-5 text-primary" />
                    Kamera
                  </span>
                  {permissions.camera === null ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : permissions.camera ? (
                    <Badge variant="success">Aktif</Badge>
                  ) : (
                    <Badge variant="error">Ditolak</Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <span className="flex items-center gap-3 font-medium">
                    <MapPin className="w-5 h-5 text-primary" />
                    Lokasi
                  </span>
                  {permissions.location === null ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
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
                  <div className={`flex items-center justify-between p-4 rounded-xl ${isWithinZone ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <span className="flex items-center gap-3 font-medium">
                      <Navigation className={`w-5 h-5 ${isWithinZone ? 'text-green-500' : 'text-red-500'}`} />
                      Jarak dari kantor
                    </span>
                    <span className={`font-bold ${isWithinZone ? 'text-green-500' : 'text-red-500'}`}>
                      {formatDistance(distance)}
                    </span>
                  </div>
                )}
              </div>

              {!permissions.camera && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl mb-4 text-sm">
                  Izin kamera ditolak. Silakan izinkan akses kamera di browser Anda.
                </div>
              )}
              
              {!permissions.location && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl mb-4 text-sm">
                  {locationError || 'Izin lokasi ditolak. Silakan izinkan akses lokasi di browser Anda.'}
                </div>
              )}

              {permissions.location && isWithinZone === false && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl mb-6 text-sm">
                  <p className="font-semibold mb-2">Di luar zona akses!</p>
                  <p>Anda berada <strong>{formatDistance(distance)}</strong> dari kantor.</p>
                  <p>Maksimal <strong>{formatDistance(MAX_DISTANCE)}</strong>.</p>
                  <p className="mt-2">Silakan mendekati lokasi kantor untuk mengakses form.</p>
                </div>
              )}

              {permissions.location && location && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">Peta Lokasi (Real-time):</p>
                    {isTracking && (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <Radio className="w-3 h-3 animate-pulse" />
                        Tracking aktif
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-border shadow-material-2" style={{ height: '300px' }}>
                    <MapContainer
                      center={[OFFICE_LAT, OFFICE_LNG]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[OFFICE_LAT, OFFICE_LNG]} icon={officeIcon}>
                        <Popup>
                          <div className="text-center">
                            <Building2 className="w-4 h-4 mx-auto mb-1" />
                            <strong>Kantor BPPMHKP</strong>
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
                        center={[OFFICE_LAT, OFFICE_LNG]}
                        radius={MAX_DISTANCE}
                        pathOptions={{
                          color: isWithinZone ? '#22c55e' : '#ef4444',
                          fillColor: isWithinZone ? '#22c55e' : '#ef4444',
                          fillOpacity: 0.1,
                          weight: 2
                        }}
                      />
                      <FitBounds 
                        userLocation={location} 
                        officeLocation={{ lat: OFFICE_LAT, lng: OFFICE_LNG }} 
                        autoFit={autoFitMap}
                      />
                    </MapContainer>
                  </div>
                  {locationAccuracy && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Akurasi GPS: ±{Math.round(locationAccuracy)}m
                      {locationAccuracy > 100 && (
                        <span className="text-amber-500 ml-2">(Akurasi rendah)</span>
                      )}
                    </p>
                  )}
                </div>
              )}

              <Button onClick={requestPermissions} size="lg" className="w-full">
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
    <>
      {/* Fixed Background Wrapper */}
      <div 
        className="fixed inset-0 z-0 transition-opacity duration-700"
        style={{
          backgroundImage: `url('/assets/${isDarkMode ? 'BG1.jpg' : 'BG.jpg'}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      />
      
      {/* Theme-based Overlay */}
      <div className={`fixed inset-0 z-0 transition-all duration-700 ${isDarkMode ? 'bg-gradient-to-br from-black/70 via-black/60 to-black/70' : 'bg-gradient-to-br from-white/50 via-white/40 to-white/50'}`} />
      <div className={`fixed inset-0 z-0 mesh-gradient transition-opacity duration-700 ${isDarkMode ? 'opacity-20' : 'opacity-10'}`} />
      
      {/* Background Effects */}
      <div className={`fixed top-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 z-0 transition-all duration-700 ${isDarkMode ? 'bg-primary-500/10' : 'bg-primary-500/5'}`} />
      <div className={`fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl translate-x-1/2 translate-y-1/2 z-0 transition-all duration-700 ${isDarkMode ? 'bg-accent/10' : 'bg-accent/5'}`} />

      {/* Main Content */}
      <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Theme Toggle Button - Top Left */}
          <div className="flex justify-between items-center mb-6 print-hidden">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm backdrop-blur-sm border ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/10' 
                  : 'bg-black/5 hover:bg-black/10 text-gray-800 border-black/10'
              }`}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Siang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Malam</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => navigate('/admin/login')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-sm backdrop-blur-sm border ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/10' 
                  : 'bg-black/5 hover:bg-black/10 text-gray-800 border-black/10'
              }`}
            >
              <Settings className="w-4 h-4" />
              Admin
            </button>
          </div>

          {/* Header with Logos */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-6 mb-6">
              <img src="/assets/logo1-kkp.png.png" alt="KKP" className="h-20 md:h-24 object-contain drop-shadow-lg" />
              <img src="/assets/logo2-bppmhkp.png" alt="BPPMHKP" className="h-20 md:h-24 object-contain drop-shadow-lg" />
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold transition-colors duration-700 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Smart Queue System</h1>
            <p className={`mt-2 text-lg transition-colors duration-700 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>Buku Tamu Digital BPPMHKP Lampung</p>
          </div>

        {/* Zone Status */}
        {distance !== null && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between animate-slide-up ${isWithinZone ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'}`}>
            <div className="flex items-center gap-3">
              {isWithinZone ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-green-400 font-semibold">Di dalam zona akses</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <span className="text-red-400 font-semibold">Di luar zona akses</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isTracking && <Radio className="w-4 h-4 text-green-400 animate-pulse" />}
              <span className={`font-bold text-lg ${isWithinZone ? 'text-green-400' : 'text-red-400'}`}>
                {formatDistance(distance)}
              </span>
            </div>
          </div>
        )}

        {/* Interactive Map */}
        {location && (
          <Card variant="elevated" className="mb-6 animate-slide-up">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  Peta Lokasi (Real-time)
                </h3>
                <div className="flex items-center gap-3">
                  {isTracking && (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <Radio className="w-3 h-3 animate-pulse" />
                      Live
                    </span>
                  )}
                  {locationAccuracy && (
                    <span className="text-xs text-muted-foreground">
                      ±{Math.round(locationAccuracy)}m
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-border shadow-material-1" style={{ height: '250px' }}>
                <MapContainer
                  center={[OFFICE_LAT, OFFICE_LNG]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[OFFICE_LAT, OFFICE_LNG]} icon={officeIcon}>
                    <Popup>
                      <div className="text-center">
                        <Building2 className="w-4 h-4 mx-auto mb-1" />
                        <strong>Kantor BPPMHKP</strong>
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
                    center={[OFFICE_LAT, OFFICE_LNG]}
                    radius={MAX_DISTANCE}
                    pathOptions={{
                      color: isWithinZone ? '#22c55e' : '#ef4444',
                      fillColor: isWithinZone ? '#22c55e' : '#ef4444',
                      fillOpacity: 0.1,
                      weight: 2
                    }}
                  />
                  <FitBounds 
                    userLocation={location} 
                    officeLocation={{ lat: OFFICE_LAT, lng: OFFICE_LNG }} 
                    autoFit={autoFitMap}
                  />
                </MapContainer>
              </div>
              {locationAccuracy > 100 && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 text-center">
                  ⚠️ Akurasi GPS rendah ({Math.round(locationAccuracy)}m). Untuk akurasi lebih baik, pastikan GPS aktif dan Anda berada di area terbuka.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form Card */}
        <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-xl">Form Pendaftaran Pengunjung</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section: OTOMATIS / SISTEM */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-border">
                  <Radio className="w-4 h-4" />
                  Otomatis / Sistem
                </h3>
                
                {/* Koordinat Lokasi */}
                <div className="space-y-2">
                  <Label>Koordinat Lokasi Anda</Label>
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        {location ? (
                          <span className="text-sm font-mono">
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Mendeteksi lokasi...</span>
                        )}
                      </div>
                      {isTracking && (
                        <span className="flex items-center gap-1 text-xs text-green-500">
                          <Radio className="w-3 h-3 animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tanggal Kunjungan */}
                <div className="space-y-2">
                  <Label>Tanggal Kunjungan</Label>
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-mono">{formatDate(currentDateTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Jam Kunjungan */}
                <div className="space-y-2">
                  <Label>Jam Kunjungan</Label>
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-mono font-semibold">{formatTime(currentDateTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: INPUT MANUAL */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-border">
                  <PenLine className="w-4 h-4" />
                  Input Manual
                </h3>

                {/* Name */}
                <div className="space-y-2">
                  <Label required>Nama Lengkap</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground">
                      <User className="w-5 h-5" />
                    </div>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama lengkap"
                      className={errors.name ? 'border-destructive pl-12' : 'pl-12'}
                    />
                  </div>
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                {/* Alamat */}
                <div className="space-y-2">
                  <Label>Alamat</Label>
                  <Textarea
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleInputChange}
                    placeholder="Masukkan alamat lengkap"
                    rows={2}
                  />
                </div>

                {/* Agency */}
                <div className="space-y-2">
                  <Label required>Instansi / Perusahaan</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <Input
                      name="agency"
                      value={formData.agency}
                      onChange={handleInputChange}
                      placeholder="Nama instansi atau perusahaan"
                      className={errors.agency ? 'border-destructive pl-12' : 'pl-12'}
                    />
                  </div>
                  {errors.agency && <p className="text-sm text-destructive">{errors.agency}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label>Nomor HP / WhatsApp</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground">
                      <Phone className="w-5 h-5" />
                    </div>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="08xxxxxxxxxx"
                      className="pl-12"
                    />
                  </div>
                </div>

                {/* Service */}
                <div className="space-y-2">
                  <Label required>Tujuan Layanan</Label>
                  <Select
                    name="service_id"
                    value={formData.service_id}
                    onChange={handleInputChange}
                    className={errors.service_id ? 'border-destructive' : ''}
                    disabled={servicesLoading}
                  >
                    <option value="">{servicesLoading ? 'Memuat layanan...' : 'Pilih layanan'}</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </Select>
                  {errors.service_id && <p className="text-sm text-destructive">{errors.service_id}</p>}
                </div>

                {/* Purpose */}
                <div className="space-y-2">
                  <Label required>Keperluan</Label>
                  <Textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    placeholder="Jelaskan keperluan Anda"
                    className={errors.purpose ? 'border-destructive' : ''}
                  />
                  {errors.purpose && <p className="text-sm text-destructive">{errors.purpose}</p>}
                </div>
              </div>

              {/* Section: UPLOAD / MEDIA */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-border">
                  <Camera className="w-4 h-4" />
                  Upload / Media
                </h3>

                {/* Photo Selfie Section */}
                <div className="space-y-2">
                  <Label>Foto Selfie</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 bg-secondary/20">
                    {photoCaptured ? (
                      <div className="text-center">
                        <img src={photoCaptured} alt="Captured" className="w-48 h-48 object-cover rounded-xl mx-auto mb-4 shadow-material-2" />
                        <Button type="button" variant="outline" onClick={() => setPhotoCaptured(null)}>
                          Ambil Ulang
                        </Button>
                      </div>
                    ) : cameraActive ? (
                      <div className="text-center">
                        <video ref={videoRef} autoPlay playsInline className="w-64 h-48 object-cover rounded-xl mx-auto mb-4 shadow-material-2" />
                        <div className="flex gap-3 justify-center">
                          <Button type="button" onClick={capturePhoto}>
                            <Camera className="w-4 h-4 mr-2" />
                            Ambil Foto
                          </Button>
                          <Button type="button" variant="outline" onClick={stopCamera}>
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={startCamera}>
                          <Camera className="w-4 h-4 mr-2" />
                          Buka Kamera
                        </Button>
                        <Button type="button" variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Berkas
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity Photo Section */}
                <div className="space-y-2">
                  <Label>Foto Tanda Pengenal</Label>
                  <p className="text-xs text-muted-foreground -mt-1">Upload foto KTP/SIM/identitas lainnya (jika diperlukan)</p>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 bg-secondary/20">
                    {identityPhoto ? (
                      <div className="text-center">
                        <img src={identityPhoto} alt="Identity" className="w-48 h-32 object-cover rounded-xl mx-auto mb-4 shadow-material-2" />
                        <Button type="button" variant="outline" onClick={() => setIdentityPhoto(null)}>
                          Ganti Foto
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" className="w-full" onClick={() => identityFileInputRef.current?.click()}>
                        <IdCard className="w-4 h-4 mr-2" />
                        Upload Foto Tanda Pengenal
                      </Button>
                    )}
                    <input
                      ref={identityFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIdentityUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Section: TANDA TANGAN */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-border">
                  <PenLine className="w-4 h-4" />
                  Tanda Tangan Digital
                </h3>

                <div className="space-y-2">
                  <Label>Tanda Tangan Digital</Label>
                  <div className="border-2 border-border rounded-xl p-4 bg-secondary/20">
                    <canvas
                      ref={signatureRef}
                      width={400}
                      height={150}
                      className="w-full bg-secondary rounded-xl touch-none cursor-crosshair border border-border/50"
                    />
                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={clearSignature}>
                      <PenLine className="w-4 h-4 mr-2" />
                      Hapus Tanda Tangan
                    </Button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                size="xl" 
                className="w-full bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-material-3" 
                disabled={loading || !isWithinZone}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : !isWithinZone ? (
                  'Di luar zona akses'
                ) : (
                  'Daftar Antrian'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </>
  );
};

export default PublicForm;
