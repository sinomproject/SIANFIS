import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, publicApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui';
import { MapPin, Save, Loader2, ArrowLeft, AlertCircle, CheckCircle, Navigation, Building2, Ruler } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const officeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const LocationSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  const [formData, setFormData] = useState({
    office_latitude: '',
    office_longitude: '',
    max_distance: '',
    office_name: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await publicApi.getLocationSettings();
      if (response.data.success) {
        setFormData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      showMessage('Gagal memuat pengaturan lokasi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  };

  const validateForm = () => {
    const newErrors = {};

    const lat = parseFloat(formData.office_latitude);
    const lng = parseFloat(formData.office_longitude);
    const dist = parseInt(formData.max_distance);

    if (!formData.office_latitude || isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.office_latitude = 'Latitude harus antara -90 sampai 90';
    }

    if (!formData.office_longitude || isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.office_longitude = 'Longitude harus antara -180 sampai 180';
    }

    if (!formData.max_distance || isNaN(dist) || dist < 100 || dist > 50000) {
      newErrors.max_distance = 'Jarak harus antara 100 - 50000 meter';
    }

    if (!formData.office_name || formData.office_name.trim() === '') {
      newErrors.office_name = 'Nama kantor wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showMessage('Harap perbaiki kesalahan pada form', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await adminApi.updateLocationSettings(formData);

      if (response.data.success) {
        showMessage('Pengaturan lokasi berhasil disimpan', 'success');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      showMessage(error.response?.data?.message || 'Gagal menyimpan pengaturan lokasi', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const lat = parseFloat(formData.office_latitude) || -5.411118;
  const lng = parseFloat(formData.office_longitude) || 105.294829;
  const maxDist = parseInt(formData.max_distance) || 10000;
  const isValidCoordinates = !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-4 md:p-8">
      <div className="mesh-gradient" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Pengaturan Lokasi</h1>
            <p className="text-white/60">Kelola koordinat kantor dan radius akses pengunjung</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>

        {/* Message Alert */}
        {message && (
          <Card variant="elevated" className={`mb-6 ${messageType === 'success' ? 'border-l-4 border-green-500 bg-green-500/10' : 'border-l-4 border-red-500 bg-red-500/10'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {messageType === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <p className={messageType === 'success' ? 'text-green-500' : 'text-red-500'}>
                  {message}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Card */}
          <Card variant="elevated">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                Konfigurasi Lokasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Office Name */}
                <div className="space-y-2">
                  <Label required className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Nama Kantor / Lokasi Pelayanan
                  </Label>
                  <Input
                    name="office_name"
                    value={formData.office_name}
                    onChange={handleInputChange}
                    placeholder=""
                    className={errors.office_name ? 'border-destructive' : ''}
                  />
                  {errors.office_name && (
                    <p className="text-sm text-destructive">{errors.office_name}</p>
                  )}
                </div>

                {/* Latitude */}
                <div className="space-y-2">
                  <Label required className="flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Latitude Kantor
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    name="office_latitude"
                    value={formData.office_latitude}
                    onChange={handleInputChange}
                    placeholder="-5.411118"
                    className={errors.office_latitude ? 'border-destructive' : ''}
                  />
                  {errors.office_latitude && (
                    <p className="text-sm text-destructive">{errors.office_latitude}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Rentang: -90 sampai 90
                  </p>
                </div>

                {/* Longitude */}
                <div className="space-y-2">
                  <Label required className="flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Longitude Kantor
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    name="office_longitude"
                    value={formData.office_longitude}
                    onChange={handleInputChange}
                    placeholder="105.294829"
                    className={errors.office_longitude ? 'border-destructive' : ''}
                  />
                  {errors.office_longitude && (
                    <p className="text-sm text-destructive">{errors.office_longitude}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Rentang: -180 sampai 180
                  </p>
                </div>

                {/* Max Distance */}
                <div className="space-y-2">
                  <Label required className="flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Radius Maksimal Akses (meter)
                  </Label>
                  <Input
                    type="number"
                    name="max_distance"
                    value={formData.max_distance}
                    onChange={handleInputChange}
                    placeholder="10000"
                    className={errors.max_distance ? 'border-destructive' : ''}
                  />
                  {errors.max_distance && (
                    <p className="text-sm text-destructive">{errors.max_distance}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Rentang: 100 meter (0.1 km) - 50000 meter (50 km)
                    {formData.max_distance && !isNaN(parseInt(formData.max_distance)) && (
                      <span className="ml-2 font-semibold text-primary">
                        = {formatDistance(parseInt(formData.max_distance))}
                      </span>
                    )}
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-400">
                      <p className="font-semibold mb-1">Cara mendapatkan koordinat:</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Buka Google Maps di browser</li>
                        <li>Klik kanan pada lokasi kantor Anda</li>
                        <li>Pilih koordinat yang muncul (akan otomatis disalin)</li>
                        <li>Paste koordinat di kolom di atas</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Simpan Pengaturan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Map Preview Card */}
          <Card variant="elevated">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                Preview Peta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Settings Info */}
                <div className="bg-secondary/50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lokasi:</span>
                    <span className="font-mono font-semibold">{formData.office_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Koordinat:</span>
                    <span className="font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Radius Akses:</span>
                    <span className="font-semibold text-primary">{formatDistance(maxDist)}</span>
                  </div>
                </div>

                {/* Map */}
                {isValidCoordinates ? (
                  <div className="rounded-2xl overflow-hidden border border-border shadow-material-1" style={{ height: '500px' }}>
                    <MapContainer
                      center={[lat, lng]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[lat, lng]} icon={officeIcon}>
                        <Popup>
                          <div className="text-center">
                            <Building2 className="w-4 h-4 mx-auto mb-1" />
                            <strong>{formData.office_name || 'Kantor'}</strong>
                            <br />
                            <span className="text-xs font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</span>
                          </div>
                        </Popup>
                      </Marker>
                      <Circle
                        center={[lat, lng]}
                        radius={maxDist}
                        pathOptions={{
                          color: '#22c55e',
                          fillColor: '#22c55e',
                          fillOpacity: 0.1,
                          weight: 2
                        }}
                      />
                    </MapContainer>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-secondary/20 flex items-center justify-center" style={{ height: '500px' }}>
                    <div className="text-center text-muted-foreground">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Masukkan koordinat yang valid untuk melihat preview peta</p>
                    </div>
                  </div>
                )}

                {/* Warning */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-400">
                      <p className="font-semibold mb-1">Perhatian:</p>
                      <p>Perubahan pengaturan lokasi akan langsung mempengaruhi validasi form pendaftaran pengunjung. Pastikan koordinat dan radius sudah benar sebelum menyimpan.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LocationSettings;
