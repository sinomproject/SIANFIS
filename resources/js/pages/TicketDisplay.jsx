import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicApi } from '@/services/api';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { Ticket, Clock, User, Building2, FileText, Download, Home, Loader2, MapPin, Phone, IdCard, Settings, CheckCircle } from 'lucide-react';

const TicketDisplay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await publicApi.getTicket(id);
        setTicket(response.data.data);
      } catch (err) {
        console.error('Failed to fetch ticket:', err);
        setError('Tiket tidak ditemukan');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTicket();
    }
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-amber-500/20 text-amber-600 border-amber-500/40';
      case 'called': return 'bg-blue-500/20 text-blue-600 border-blue-500/40';
      case 'done': return 'bg-green-500/20 text-green-600 border-green-500/40';
      case 'skipped': return 'bg-orange-500/20 text-orange-600 border-orange-500/40';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/40';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'waiting': return 'Menunggu';
      case 'called': return 'Dipanggil';
      case 'done': return 'Selesai';
      case 'skipped': return 'Dilewati';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 border-4 border-white/20 rounded-full" />
            <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
          </div>
          <p className="text-white/80 text-xl">Memuat tiket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
        <Card variant="elevated" className="max-w-md w-full text-center animate-scale-in">
          <CardContent className="p-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
              <Ticket className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Tiket Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-8">{error || 'Tiket yang Anda cari tidak tersedia'}</p>
            <Button onClick={() => navigate('/')} size="lg" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 p-4 md:p-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 mesh-gradient opacity-30" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="relative z-10 max-w-md mx-auto">
        {/* Admin Login Button - Top Right */}
        <div className="flex justify-end mb-6 print-hidden">
          <button
            onClick={() => navigate('/admin/login')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm backdrop-blur-sm border border-white/10"
          >
            <User className="w-4 h-4" />
            Login Staff
          </button>
        </div>

        {/* Success Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-green-500/20 mb-6 shadow-material-2">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Pendaftaran Berhasil!</h1>
          <p className="text-white/60 mt-2">Simpan tiket ini sebagai bukti pendaftaran</p>
        </div>

        {/* Ticket Card */}
        <Card variant="elevated" className="overflow-hidden animate-scale-in">
          {/* Queue Number Header */}
          <div className="bg-gradient-to-r from-primary to-primary-600 text-white text-center py-10 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
            <p className="text-sm opacity-80 mb-3 uppercase tracking-widest relative">NOMOR ANTRIAN</p>
            <p className="text-7xl md:text-8xl font-black tracking-wider relative queue-display">{ticket.queue_number}</p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex justify-center">
              <span className={`px-5 py-2 rounded-full border ${getStatusColor(ticket.status)} font-semibold`}>
                {getStatusText(ticket.status)}
              </span>
            </div>

            {/* Ticket Info */}
            <div className="space-y-4">
              {/* Ticket Code */}
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kode Tiket</p>
                  <p className="font-mono font-bold">{ticket.ticket_code}</p>
                </div>
              </div>

              {/* Service */}
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tujuan Layanan</p>
                  <p className="font-semibold">{ticket.service?.name}</p>
                </div>
              </div>

              {/* Name */}
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nama Lengkap</p>
                  <p className="font-semibold">{ticket.visitor?.name}</p>
                </div>
              </div>

              {/* Agency */}
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Instansi / Perusahaan</p>
                  <p className="font-semibold">{ticket.visitor?.agency || '-'}</p>
                </div>
              </div>

              {/* Alamat */}
              {ticket.visitor?.alamat && (
                <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl border border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Alamat</p>
                    <p className="text-sm">{ticket.visitor.alamat}</p>
                  </div>
                </div>
              )}

              {/* Phone */}
              {ticket.visitor?.phone && (
                <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl border border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor HP / WhatsApp</p>
                    <p className="font-semibold">{ticket.visitor.phone}</p>
                  </div>
                </div>
              )}

              {/* Purpose */}
              <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-xl border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Keperluan</p>
                  <p className="text-sm">{ticket.visitor?.purpose}</p>
                </div>
              </div>

              {/* Location */}
              {ticket.visitor?.location_lat && ticket.visitor?.location_lng && (
                <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl border border-border/50">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Koordinat Lokasi</p>
                    <p className="font-mono text-sm">
                      {parseFloat(ticket.visitor.location_lat).toFixed(6)}, {parseFloat(ticket.visitor.location_lng).toFixed(6)}
                    </p>
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Waktu Pendaftaran</p>
                  <p className="font-semibold">{ticket.created_at}</p>
                </div>
              </div>
            </div>

            {/* Counter Info (if called) */}
            {ticket.status === 'called' && ticket.counter_number && (
              <div className="bg-gradient-to-r from-accent to-teal-400 rounded-xl p-6 text-center shadow-material-2">
                <p className="text-white/80 text-sm mb-2 font-medium">SILAKAN MENUJU</p>
                <p className="text-4xl font-black text-white">LOKET {ticket.counter_number}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2 print-hidden">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.print()}
              >
                <Download className="w-4 h-4 mr-2" />
                Cetak
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-primary to-primary-600"
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Beranda
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-8 p-5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 print-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h3 className="font-semibold text-white mb-3">Petunjuk:</h3>
          <ul className="text-sm text-white/60 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5 flex-shrink-0" />
              Simpan kode tiket Anda untuk referensi
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5 flex-shrink-0" />
              Pantau layar display untuk nomor antrian Anda
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5 flex-shrink-0" />
              Tunggu hingga nomor Anda dipanggil
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TicketDisplay;