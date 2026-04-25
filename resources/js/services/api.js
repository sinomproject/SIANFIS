import axios from 'axios';

const API_BASE = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== PUBLIC API ====================

export const publicApi = {
  // Get active services
  getServices: () => api.get('/services'),

  // Get counters by service ID
  getCountersByService: (serviceId) => api.get(`/services/${serviceId}/counters`),

  // Register visitor
  registerVisitor: (data) => api.post('/queue/register', data),

  // Get ticket by ID
  getTicket: (id) => api.get(`/ticket/${id}`),

  // Get ticket by code
  getTicketByCode: (code) => api.get(`/ticket/code/${code}`),

  // Get display data
  getDisplayData: () => api.get('/display/current'),

  // Get video (DEPRECATED - replaced with YouTube Playlist)
  // getVideo: () => api.get('/video'),

  // Get location settings
  getLocationSettings: () => api.get('/settings/location'),

  // Get app settings (header, logo)
  getAppSettings: () => api.get('/settings/app'),

  // Get audio settings (voice announcement)
  getAudioSettings: () => api.get('/settings/audio'),

  // Get display background image URL
  getDisplayBackground: () => api.get('/display-background'),

  // Get display settings (mode, video URL)
  getDisplaySettings: () => api.get('/display-settings'),
};

// ==================== ADMIN API ====================

export const adminApi = {
  // Auth
  login: (credentials) => api.post('/admin/login', credentials),
  logout: () => api.post('/admin/logout'),
  me: () => api.get('/admin/me'),

  // Queue
  getQueues: (params) => api.get('/admin/queue', { params }),
  getStats: () => api.get('/admin/queue/stats'),
  getQueueHistory: (params) => api.get(`/admin/queue/history?${params}`),
  callQueue: (queueId, counterNumber) => api.post('/admin/queue/call', { queue_id: queueId, counter_number: counterNumber }),
  doneQueue: (id) => api.post(`/admin/queue/${id}/done`),
  skipQueue: (id) => api.post(`/admin/queue/${id}/skip`),
  recallQueue: (id) => api.post(`/admin/queue/${id}/recall`),

  // Services
  getServices: () => api.get('/admin/services'),
  createService: (data) => api.post('/admin/services', data),
  updateService: (id, data) => api.put(`/admin/services/${id}`, data),
  deleteService: (id) => api.delete(`/admin/services/${id}`),

  // Counters
  getCounters: () => api.get('/admin/services/counters'),
  createCounter: (data) => api.post('/admin/services/counters', data),
  updateCounter: (id, data) => api.put(`/admin/services/counters/${id}`, data),
  deleteCounter: (id) => api.delete(`/admin/services/counters/${id}`),

  // Video (DEPRECATED - replaced with YouTube Playlist)
  // getVideo: () => api.get('/admin/video'),
  // uploadVideo: (formData) => api.post('/admin/video', formData, {
  //   headers: { 'Content-Type': 'multipart/form-data' },
  // }),
  // deleteVideo: () => api.delete('/admin/video'),

  // Settings
  updateLocationSettings: (data) => api.put('/admin/settings/location', data),
  updateAppSettings: (data) => api.put('/admin/settings/app', data),
  updateAudioSettings: (data) => api.put('/admin/settings/audio', data),

  // Display background
  uploadBackground: (formData) => api.post('/admin/display-background', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteBackground: () => api.delete('/admin/display-background'),

  // Display settings
  updateDisplaySettings: (data) => api.put('/admin/display-settings', data),

  // User Management
  getUsers:    ()         => api.get('/admin/users'),
  createUser:  (data)     => api.post('/admin/users', data),
  updateUser:  (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser:  (id)       => api.delete(`/admin/users/${id}`),
};

// ==================== STAFF API ====================

export const staffApi = {
  // Queue (backend filters by counter for staff role)
  getQueues:      (params) => api.get('/admin/queue', { params }),
  getStats:       ()       => api.get('/admin/queue/stats'),
  callQueue:      (queueId, counterNumber) => api.post('/admin/queue/call', { queue_id: queueId, counter_number: counterNumber }),
  doneQueue:      (id)     => api.post(`/admin/queue/${id}/done`),
  skipQueue:      (id)     => api.post(`/admin/queue/${id}/skip`),
  recallQueue:    (id)     => api.post(`/admin/queue/${id}/recall`),

  // Waiting list (all queues, read-only)
  getAllQueues:    (params) => api.get('/admin/queue', { params }),
  getServices:    ()       => api.get('/admin/services'),

  // Stats & report
  getDailyStats:  ()       => api.get('/staff/stats/daily'),
  exportReport:   (params) => api.get('/staff/report/export', { params, responseType: 'blob' }),

  // History (for report preview)
  getHistory:     (params) => api.get('/admin/queue/history', { params }),

  // Profile
  changePassword: (data)   => api.put('/staff/profile/password', data),
};

export default api;