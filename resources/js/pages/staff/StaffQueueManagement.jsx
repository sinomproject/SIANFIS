import React, { useState, useEffect } from 'react';
import { staffApi } from '@/services/api';
import StaffLayout from './StaffLayout';
import {
  Play, Check, SkipForward, RotateCcw,
  Loader2, RefreshCw, Phone, Building2, User,
} from 'lucide-react';

const STATUS_CHIP = {
  waiting: 'chip-waiting',
  called:  'chip-called',
  done:    'chip-done',
  skipped: 'chip-skipped',
};
const STATUS_LABEL = { waiting: 'Menunggu', called: 'Dipanggil', done: 'Selesai', skipped: 'Dilewati' };

const StaffQueueManagement = () => {
  const staffUser     = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const counterNumber = staffUser.counter_id || 1;

  const [queues,        setQueues]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter,        setFilter]        = useState('');

  useEffect(() => { fetchQueues(); }, [filter]);

  const fetchQueues = async () => {
    try {
      const params = {};
      if (filter) params.status = filter;
      const res = await staffApi.getQueues(params);
      setQueues(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const act = async (fn, ...args) => {
    setActionLoading(args[0]);
    try {
      await fn(...args);
      fetchQueues();
    } catch (e) {
      alert(e.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <StaffLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Antrian Saya</h1>
            <p className="text-muted-foreground mt-1">
              {staffUser.counter_name ? `Loket: ${staffUser.counter_name}` : 'Antrian loket Anda'}
            </p>
          </div>
          <button onClick={fetchQueues} className="material-button-tonal flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['', 'waiting', 'called', 'done', 'skipped'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                filter === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              {s === '' ? 'Semua' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {queues.length === 0 && (
              <div className="material-card p-12 text-center text-muted-foreground">
                Tidak ada antrian
              </div>
            )}
            {queues.map(q => (
              <div key={q.id} className="material-card p-5 flex items-center gap-4">
                {/* Number */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-black text-white">{q.queue_number}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-foreground">{q.visitor?.name}</span>
                    <span className={STATUS_CHIP[q.status]}>{STATUS_LABEL[q.status]}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {q.visitor?.phone && (
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{q.visitor.phone}</span>
                    )}
                    {q.visitor?.agency && (
                      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{q.visitor.agency}</span>
                    )}
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{q.service?.name}</span>
                  </div>
                  {q.called_at && (
                    <p className="text-xs text-muted-foreground mt-1">Dipanggil: {q.called_at}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {q.status === 'waiting' && (
                    <button
                      onClick={() => act(id => staffApi.callQueue(id, counterNumber), q.id)}
                      disabled={actionLoading === q.id}
                      className="material-button-filled flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl"
                    >
                      {actionLoading === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      Panggil
                    </button>
                  )}
                  {q.status === 'called' && (
                    <>
                      <button
                        onClick={() => act(staffApi.doneQueue, q.id)}
                        disabled={actionLoading === q.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Selesai
                      </button>
                      <button
                        onClick={() => act(staffApi.skipQueue, q.id)}
                        disabled={actionLoading === q.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:bg-secondary transition-colors"
                      >
                        <SkipForward className="w-4 h-4" />
                        Lewati
                      </button>
                    </>
                  )}
                  {(q.status === 'skipped' || q.status === 'called') && (
                    <button
                      onClick={() => act(staffApi.recallQueue, q.id)}
                      disabled={actionLoading === q.id}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-border text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffQueueManagement;
