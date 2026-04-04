import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, publicApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui';
import { Volume2, Save, Loader2, ArrowLeft, AlertCircle, CheckCircle, Play, Gauge, Mic } from 'lucide-react';

const AudioSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  const [formData, setFormData] = useState({
    voice_volume: '1.0',
    voice_rate: '0.9',
    voice_pitch: '1.0',
    voice_repeat: '2',
    voice_language: 'id-ID',
    voice_template: 'Nomor antrian {nomor_antrian}. Silakan menuju loket {nomor_loket}, {nama_loket}'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await publicApi.getAudioSettings();
      if (response.data.success) {
        setFormData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      showMessage('Gagal memuat pengaturan audio', 'error');
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

    const volume = parseFloat(formData.voice_volume);
    const rate = parseFloat(formData.voice_rate);
    const pitch = parseFloat(formData.voice_pitch);
    const repeat = parseInt(formData.voice_repeat);

    if (isNaN(volume) || volume < 0 || volume > 1) {
      newErrors.voice_volume = 'Volume harus antara 0 - 1';
    }

    if (isNaN(rate) || rate < 0.1 || rate > 2) {
      newErrors.voice_rate = 'Kecepatan harus antara 0.1 - 2';
    }

    if (isNaN(pitch) || pitch < 0 || pitch > 2) {
      newErrors.voice_pitch = 'Nada harus antara 0 - 2';
    }

    if (isNaN(repeat) || repeat < 1 || repeat > 5) {
      newErrors.voice_repeat = 'Pengulangan harus antara 1 - 5';
    }

    if (!formData.voice_template || formData.voice_template.trim() === '') {
      newErrors.voice_template = 'Template suara wajib diisi';
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
      const response = await adminApi.updateAudioSettings(formData);

      if (response.data.success) {
        showMessage('Pengaturan audio berhasil disimpan', 'success');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      showMessage(error.response?.data?.message || 'Gagal menyimpan pengaturan audio', 'error');
    } finally {
      setSaving(false);
    }
  };

  const testVoice = () => {
    if ('speechSynthesis' in window) {
      setTesting(true);
      window.speechSynthesis.cancel();

      // Replace placeholders with sample data for testing
      let text = formData.voice_template || "Nomor antrian A, nol nol satu. Silakan menuju loket 1";
      text = text.replace('{nomor_antrian}', 'A, nol nol satu');
      text = text.replace('{nomor_loket}', '1');
      text = text.replace('{nama_loket}', 'Layanan Umum');

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = formData.voice_language;
      utterance.rate = parseFloat(formData.voice_rate);
      utterance.pitch = parseFloat(formData.voice_pitch);
      utterance.volume = parseFloat(formData.voice_volume);

      utterance.onend = () => setTesting(false);
      utterance.onerror = () => setTesting(false);

      window.speechSynthesis.speak(utterance);
    } else {
      alert('Browser Anda tidak mendukung Text-to-Speech');
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
            <h1 className="text-3xl font-bold text-white mb-2">Pengaturan Suara</h1>
            <p className="text-white/60">Kelola suara panggilan antrian otomatis</p>
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
                  <Volume2 className="w-4 h-4 text-primary" />
                </div>
                Konfigurasi Suara
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Volume */}
                <div className="space-y-2">
                  <Label required className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Volume Suara
                  </Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      name="voice_volume"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.voice_volume}
                      onChange={handleInputChange}
                      className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                    />
                    <Input
                      type="number"
                      name="voice_volume"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.voice_volume}
                      onChange={handleInputChange}
                      className={`w-20 text-center ${errors.voice_volume ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.voice_volume && (
                    <p className="text-sm text-destructive">{errors.voice_volume}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Rentang: 0 (sunyi) - 1 (maksimal). Default: 1.0
                  </p>
                </div>

                {/* Rate/Speed */}
                <div className="space-y-2">
                  <Label required className="flex items-center gap-2">
                    <Gauge className="w-4 h-4" />
                    Kecepatan Bicara
                  </Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      name="voice_rate"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={formData.voice_rate}
                      onChange={handleInputChange}
                      className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                    />
                    <Input
                      type="number"
                      name="voice_rate"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={formData.voice_rate}
                      onChange={handleInputChange}
                      className={`w-20 text-center ${errors.voice_rate ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.voice_rate && (
                    <p className="text-sm text-destructive">{errors.voice_rate}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Rentang: 0.1 (sangat lambat) - 2 (sangat cepat). Default: 0.9
                  </p>
                </div>

                {/* Pitch */}
                <div className="space-y-2">
                  <Label required className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Nada Suara (Pitch)
                  </Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      name="voice_pitch"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.voice_pitch}
                      onChange={handleInputChange}
                      className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                    />
                    <Input
                      type="number"
                      name="voice_pitch"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.voice_pitch}
                      onChange={handleInputChange}
                      className={`w-20 text-center ${errors.voice_pitch ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.voice_pitch && (
                    <p className="text-sm text-destructive">{errors.voice_pitch}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Rentang: 0 (rendah) - 2 (tinggi). Default: 1.0
                  </p>
                </div>

                {/* Repeat Count */}
                <div className="space-y-2">
                  <Label required>Jumlah Pengulangan</Label>
                  <Input
                    type="number"
                    name="voice_repeat"
                    min="1"
                    max="5"
                    value={formData.voice_repeat}
                    onChange={handleInputChange}
                    className={errors.voice_repeat ? 'border-destructive' : ''}
                  />
                  {errors.voice_repeat && (
                    <p className="text-sm text-destructive">{errors.voice_repeat}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Berapa kali suara diulang. Rentang: 1 - 5 kali. Default: 2 kali
                  </p>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label required>Bahasa</Label>
                  <select
                    name="voice_language"
                    value={formData.voice_language}
                    onChange={handleInputChange}
                    className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all"
                  >
                    <option value="id-ID">Indonesia (id-ID)</option>
                    <option value="en-US">English (en-US)</option>
                    <option value="en-GB">English UK (en-GB)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Bahasa yang digunakan untuk Text-to-Speech
                  </p>
                </div>

                {/* Voice Template */}
                <div className="space-y-2">
                  <Label required>Template Suara</Label>
                  <textarea
                    name="voice_template"
                    rows="3"
                    value={formData.voice_template}
                    onChange={handleInputChange}
                    className={`w-full bg-background border-2 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all resize-none ${errors.voice_template ? 'border-destructive' : 'border-border'}`}
                    placeholder="Nomor antrian {nomor_antrian}. Silakan menuju loket {nomor_loket}, {nama_loket}"
                  />
                  {errors.voice_template && (
                    <p className="text-sm text-destructive">{errors.voice_template}</p>
                  )}
                  <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground">Placeholder yang tersedia:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{nomor_antrian}'}</code> - Nomor antrian (contoh: A, nol nol satu)</li>
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{nomor_loket}'}</code> - Nomor loket (contoh: 1, 2, 3)</li>
                      <li><code className="bg-background px-1 py-0.5 rounded">{'{nama_loket}'}</code> - Nama loket (contoh: Layanan Umum)</li>
                    </ul>
                  </div>
                </div>

                {/* Test Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={testVoice}
                  disabled={testing}
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Memutar...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Tes Suara
                    </>
                  )}
                </Button>

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

          {/* Info Card */}
          <Card variant="elevated">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-primary" />
                </div>
                Informasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Settings */}
                <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">Pengaturan Saat Ini</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="font-semibold">{(parseFloat(formData.voice_volume) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kecepatan:</span>
                      <span className="font-semibold">{formData.voice_rate}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nada:</span>
                      <span className="font-semibold">{formData.voice_pitch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pengulangan:</span>
                      <span className="font-semibold">{formData.voice_repeat}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bahasa:</span>
                      <span className="font-semibold">{formData.voice_language}</span>
                    </div>
                  </div>
                </div>

                {/* Info Text */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-400">
                      <p className="font-semibold mb-2">Cara Kerja:</p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Suara otomatis diputar di layar display saat antrian dipanggil</li>
                        <li>Format: "Nomor antrian [nomor]. Silakan menuju loket [nomor]"</li>
                        <li>Gunakan tombol "Tes Suara" untuk mendengar preview</li>
                        <li>Perubahan langsung berlaku setelah disimpan</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Recommended Settings */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-400">
                      <p className="font-semibold mb-2">Pengaturan Rekomendasi:</p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li><strong>Volume:</strong> 1.0 (100%)</li>
                        <li><strong>Kecepatan:</strong> 0.9 (sedikit lebih lambat, jelas)</li>
                        <li><strong>Nada:</strong> 1.0 (normal)</li>
                        <li><strong>Pengulangan:</strong> 2x</li>
                        <li><strong>Bahasa:</strong> id-ID (Indonesia)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-400">
                      <p className="font-semibold mb-1">Catatan:</p>
                      <p>Fitur ini menggunakan Web Speech API browser. Kualitas suara tergantung browser yang digunakan pada layar display.</p>
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

export default AudioSettings;
