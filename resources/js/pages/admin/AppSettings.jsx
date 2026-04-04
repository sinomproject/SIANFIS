import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, publicApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui';
import { Type, Save, Loader2, ArrowLeft, AlertCircle, CheckCircle, Image } from 'lucide-react';

const AppSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  const [formData, setFormData] = useState({
    app_title: '',
    app_subtitle: '',
    logo_left: '',
    logo_right: '',
    youtube_playlist_url: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await publicApi.getAppSettings();
      if (response.data.success) {
        setFormData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      showMessage('Gagal memuat pengaturan aplikasi', 'error');
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

    if (!formData.app_title || formData.app_title.trim() === '') {
      newErrors.app_title = 'Judul aplikasi wajib diisi';
    }

    if (!formData.app_subtitle || formData.app_subtitle.trim() === '') {
      newErrors.app_subtitle = 'Subjudul aplikasi wajib diisi';
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
      const response = await adminApi.updateAppSettings(formData);

      if (response.data.success) {
        showMessage('Pengaturan aplikasi berhasil disimpan', 'success');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      showMessage(error.response?.data?.message || 'Gagal menyimpan pengaturan aplikasi', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-4 md:p-8">
      <div className="mesh-gradient" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Pengaturan Header & Logo</h1>
            <p className="text-white/60">Kelola judul, subjudul, dan logo aplikasi</p>
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
                  <Type className="w-4 h-4 text-primary" />
                </div>
                Konfigurasi Header
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* App Title */}
                <div className="space-y-2">
                  <Label required className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Judul Aplikasi
                  </Label>
                  <Input
                    name="app_title"
                    value={formData.app_title}
                    onChange={handleInputChange}
                    placeholder="Contoh: SIANFIS - Sistem Informasi Antrian Fisipol"
                    className={errors.app_title ? 'border-destructive' : ''}
                  />
                  {errors.app_title && (
                    <p className="text-sm text-destructive">{errors.app_title}</p>
                  )}
                </div>

                {/* App Subtitle */}
                <div className="space-y-2">
                  <Label required className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Subjudul Aplikasi
                  </Label>
                  <Input
                    name="app_subtitle"
                    value={formData.app_subtitle}
                    onChange={handleInputChange}
                    placeholder="Contoh: Buku Tamu Digital"
                    className={errors.app_subtitle ? 'border-destructive' : ''}
                  />
                  {errors.app_subtitle && (
                    <p className="text-sm text-destructive">{errors.app_subtitle}</p>
                  )}
                </div>

                {/* Logo Left */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Path Logo Kiri
                  </Label>
                  <Input
                    name="logo_left"
                    value={formData.logo_left}
                    onChange={handleInputChange}
                    placeholder="/assets/logo-kiri.png"
                    className={errors.logo_left ? 'border-destructive' : ''}
                  />
                  {errors.logo_left && (
                    <p className="text-sm text-destructive">{errors.logo_left}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Path gambar logo kiri (relatif dari public folder)
                  </p>
                </div>

                {/* Logo Right */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Path Logo Kanan
                  </Label>
                  <Input
                    name="logo_right"
                    value={formData.logo_right}
                    onChange={handleInputChange}
                    placeholder="/assets/logo-kanan.png"
                    className={errors.logo_right ? 'border-destructive' : ''}
                  />
                  {errors.logo_right && (
                    <p className="text-sm text-destructive">{errors.logo_right}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Path gambar logo kanan (relatif dari public folder)
                  </p>
                </div>

                {/* YouTube Playlist URL */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    URL YouTube Playlist
                  </Label>
                  <Input
                    name="youtube_playlist_url"
                    value={formData.youtube_playlist_url}
                    onChange={handleInputChange}
                    placeholder="https://www.youtube.com/playlist?list=PLxxxxxx"
                    className={errors.youtube_playlist_url ? 'border-destructive' : ''}
                  />
                  {errors.youtube_playlist_url && (
                    <p className="text-sm text-destructive">{errors.youtube_playlist_url}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    URL playlist YouTube untuk background display (opsional)
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-400">
                      <p className="font-semibold mb-1">Catatan Penting:</p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Upload file logo ke folder <code>public/assets</code></li>
                        <li>Format yang disarankan: PNG dengan background transparan</li>
                        <li>Ukuran optimal: 200x200 px atau rasio 1:1</li>
                        <li>URL YouTube Playlist harus dalam format: <code>https://www.youtube.com/playlist?list=XXX</code></li>
                        <li>Playlist akan diputar sebagai background di halaman display</li>
                        <li>Perubahan akan langsung terlihat di halaman publik</li>
                      </ul>
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

          {/* Preview Card */}
          <Card variant="elevated">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Image className="w-4 h-4 text-primary" />
                </div>
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Settings Info */}
                <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">Pengaturan Saat Ini</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Judul:</span>
                      <p className="font-semibold mt-1">{formData.app_title || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Subjudul:</span>
                      <p className="font-semibold mt-1">{formData.app_subtitle || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Logo Preview */}
                <div className="bg-secondary/50 rounded-xl p-6">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-4 text-center">Preview Logo</h3>
                  <div className="flex items-center justify-center gap-6 mb-6">
                    {formData.logo_left ? (
                      <img
                        src={formData.logo_left}
                        alt="Logo Kiri"
                        className="h-20 object-contain"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3ELogo Kiri%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="h-20 w-20 bg-secondary rounded flex items-center justify-center text-xs text-muted-foreground">
                        Logo Kiri
                      </div>
                    )}
                    {formData.logo_right ? (
                      <img
                        src={formData.logo_right}
                        alt="Logo Kanan"
                        className="h-20 object-contain"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3ELogo Kanan%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="h-20 w-20 bg-secondary rounded flex items-center justify-center text-xs text-muted-foreground">
                        Logo Kanan
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">{formData.app_title}</h1>
                    <p className="text-muted-foreground">{formData.app_subtitle}</p>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-400">
                      <p className="font-semibold mb-1">Perhatian:</p>
                      <p>Pastikan file logo sudah diupload ke folder <code className="bg-black/20 px-1 rounded">public/assets</code> sebelum menyimpan path-nya di sini.</p>
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

export default AppSettings;
