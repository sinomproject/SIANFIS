import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/services/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label } from '@/components/ui';
import { Lock, User, Loader2, ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Login attempt:', { email: formData.email, password: formData.password });

    try {
      const response = await adminApi.login({
        email: formData.email.trim(),
        password: formData.password
      });
      
      if (response.data.success) {
        localStorage.setItem('admin_token', response.data.data.token);
        localStorage.setItem('admin_user', JSON.stringify(response.data.data.user));
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: "url('/assets/BG1.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
      <div className="absolute inset-0 mesh-gradient opacity-20" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <Card variant="elevated" className="relative z-10 w-full max-w-md animate-scale-in">
        <CardHeader className="text-center pb-2">
          {/* Logos */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <img src="/assets/LOGO_UMA.png" alt="KKP" className="h-16 object-contain drop-shadow-lg" />
            <img src="/assets/unggul.png" alt="BPPMHKP" className="h-16 object-contain drop-shadow-lg" />
          </div>
          
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-600 shadow-material-3 mb-6 mx-auto">
            <Lock className="w-10 h-10 text-white" />
          </div>
          
          <CardTitle className="text-2xl font-bold">Selamat Datang</CardTitle>
          <p className="text-muted-foreground mt-2">
            SIANFIS - Sistem Informasi Antrian Fisipol
          </p>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm animate-fade-in flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground">
                  <User className="w-5 h-5" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@example.com"
                  className="pl-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="pl-12"
                  required
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-6" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk ke Dashboard'
              )}
            </Button>

            <Button 
              type="button" 
              variant="ghost" 
              size="lg"
              className="w-full"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;