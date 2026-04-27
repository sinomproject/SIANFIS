# SIANFIS - Sistem Informasi Antrian Fisipol - Buku Tamu Digital

Sistem Antrian Terintegrasi untuk pengelolaan pengunjung dan antrian secara digital.

## 🚀 Fitur

### Public Features
- 📝 **Form Pendaftaran Digital** - Isi data pengunjung via QR Code
- 📷 **Capture Foto Selfie** - Kamera terintegrasi
- ✍️ **Tanda Tangan Digital** - Canvas signature pad
- 📍 **Auto Location** - Deteksi lokasi via GPS
- 🎫 **E-Ticket** - Tiket digital dengan QR Code

### Display Screen
- 🖥️ **Public Display** - Layar antrian fullscreen untuk TV
- 🔊 **Voice Announcement** - Panggilan suara otomatis (Web Speech API)
- 📊 **Real-time Statistics** - Statistik antrian live (polling)
- 📜 **Running Text** - Informasi berjalan

### Admin Dashboard
- 🔐 **Authentication** - Login dengan Laravel Sanctum
- 📊 **Dashboard** - Statistik antrian hari ini
- 🎛️ **Queue Management** - Panggil, selesaikan, lewati antrian
- ⚙️ **Service Management** - Kelola layanan dan loket

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 10 (PHP 8.3) |
| Frontend | React 18 + Vite |
| UI | Tailwind CSS + Shadcn-style Components |
| Auth | Laravel Sanctum |
| Database | MySQL |

## 📋 Requirements

- PHP >= 8.1
- Node.js >= 18
- MySQL >= 5.7
- Composer
- NPM

## ⚡ Installation

### 1. Clone Repository
```bash
git clone https://github.com/your-org/SIANFIS.git
cd SIANFIS
```

### 2. Install Dependencies
```bash
composer install
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
php artisan key:generate
```

### 4. Configure Database (edit .env)
```env
DB_DATABASE=bukutamu
DB_USERNAME=root
DB_PASSWORD=
```

### 5. Database Setup

**Option A: Run Migration & Seeder**
```bash
php artisan migrate --seed
```

**Option B: Import SQL File**
```bash
# Create database first
mysql -u root -e "CREATE DATABASE bukutamu;"

# Import the SQL file
mysql -u root bukutamu < database/bukutamu.sql
```

### 6. Build Frontend
```bash
npm run build
```

### 7. Start Server
```bash
php artisan serve
```

## 🔑 Default Login

| Email | Password | Role |
|-------|----------|------|
| admin@bppmhkp.co.id | password | Admin |

## 📊 Database Structure

### Tables
| Table | Description |
|-------|-------------|
| `users` | User accounts (admin/operator) |
| `services` | Daftar layanan (Laboratorium, Sertifikasi Mutu, Konsultasi, Umum) |
| `counters` | Loket/Counter layanan |
| `visitors` | Data pengunjung |
| `queues` | Antrian pengunjung |
| `daily_counters` | Counter harian untuk nomor antrian |

### Default Services
| ID | Nama Layanan | Prefix |
|----|--------------|--------|
| 1 | Laboratorium | LAB |
| 2 | Sertifikasi Mutu | SM |
| 3 | Konsultasi | KON |
| 4 | Umum | A |

### Default Counters
| ID | Nama Loket | Service |
|----|------------|---------|
| 1 | Loket Pendaftaran | - |
| 2 | Loket Laboratorium | Laboratorium |
| 3 | Loket Sertifikasi | Sertifikasi Mutu |
| 4 | Loket Konsultasi | Konsultasi |

## 📁 Project Structure

```
app/
├── Http/Controllers/
│   ├── Public/
│   │   ├── DisplayController.php    # Display antrian
│   │   ├── TicketController.php      # Tiket & registrasi
│   │   └── VisitorController.php     # Data pengunjung
│   └── Admin/
│       ├── AuthController.php        # Autentikasi admin
│       ├── QueueController.php       # Kelola antrian
│       └── ServiceController.php     # Kelola layanan
├── Models/
│   ├── User.php
│   ├── Service.php
│   ├── Counter.php
│   ├── Visitor.php
│   ├── Queue.php
│   └── DailyCounter.php
└── Services/
    └── QueueService.php              # Logika antrian

resources/js/
├── components/ui/                   # Komponen UI reusable
│   ├── badge.jsx
│   ├── button.jsx
│   ├── card.jsx
│   ├── input.jsx
│   ├── label.jsx
│   ├── select.jsx
│   └── textarea.jsx
├── pages/
│   ├── PublicForm.jsx               # Form pendaftaran
│   ├── TicketDisplay.jsx            # Tampilan tiket
│   ├── PublicDisplay.jsx            # Display antrian
│   └── admin/
│       ├── AdminDashboard.jsx       # Dashboard admin
│       ├── AdminLogin.jsx           # Login admin
│       ├── QueueManagement.jsx      # Kelola antrian
│       ├── QueueHistory.jsx         # Riwayat antrian
│       └── ServiceManagement.jsx    # Kelola layanan
├── services/
│   └── api.js                       # API service
└── lib/
    └── utils.js                     # Utility functions

database/
├── migrations/                       # Database migrations
├── seeders/
│   └── DatabaseSeeder.php           # Initial data seeder
└── bukutamu.sql                     # Full database backup
```

## 🌐 Routes

### Public Routes
| Route | Description |
|-------|-------------|
| `/` | Form pendaftaran pengunjung |
| `/ticket/{id}` | Tampilan tiket |
| `/display` | Layar display antrian |

### Admin Routes
| Route | Description |
|-------|-------------|
| `/admin/login` | Login admin |
| `/admin/dashboard` | Dashboard statistik |
| `/admin/queue` | Kelola antrian |
| `/admin/history` | Riwayat antrian |
| `/admin/services` | Kelola layanan & loket |

### API Routes

#### Public API
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/services` | Daftar layanan aktif |
| POST | `/api/queue/register` | Daftar antrian baru |
| GET | `/api/ticket/{code}` | Detail tiket by code |
| GET | `/api/display/stats` | Statistik display |
| GET | `/api/display/queue` | Antrian saat ini |

#### Admin API (requires authentication)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/admin/login` | Login admin |
| POST | `/api/admin/logout` | Logout admin |
| GET | `/api/admin/dashboard` | Data dashboard |
| GET | `/api/admin/queue` | Daftar antrian |
| POST | `/api/admin/queue/call` | Panggil antrian |
| POST | `/api/admin/queue/complete` | Selesaikan antrian |
| POST | `/api/admin/queue/skip` | Lewati antrian |
| GET | `/api/admin/history` | Riwayat antrian |
| GET | `/api/admin/services` | Daftar layanan |
| POST | `/api/admin/services` | Tambah layanan |
| PUT | `/api/admin/services/{id}` | Update layanan |
| DELETE | `/api/admin/services/{id}` | Hapus layanan |
| GET | `/api/admin/counters` | Daftar counter |
| POST | `/api/admin/counters` | Tambah counter |
| PUT | `/api/admin/counters/{id}` | Update counter |
| DELETE | `/api/admin/counters/{id}` | Hapus counter |

## 📱 Usage Flow

### Pengunjung
1. **Scan QR Code** → Buka form pendaftaran di browser
2. **Isi Data** → Nama, instansi, tujuan, foto selfie, tanda tangan
3. **Submit** → Sistem generate nomor antrian
4. **Tiket Digital** → Tampilkan QR Code dengan detail antrian
5. **Tunggu** → Pantau layar display untuk nomor antrian

### Admin
1. **Login** → Akses `/admin/login` dengan kredensial
2. **Dashboard** → Lihat statistik antrian hari ini
3. **Kelola Antrian** → PANGGIL → SELESAI/LEWATI
4. **Kelola Layanan** → Tambah/Edit/Hapus layanan dan loket

## 🎨 Customization

### Menambah Layanan
1. Login sebagai admin
2. Buka menu **Layanan**
3. Klik **Tambah Layanan**
4. Isi nama, prefix, dan deskripsi

### Mengubah Suara Panggilan
Edit `resources/js/lib/utils.js`:
```javascript
export function speakQueueNumber(counter, number) {
  // Customize voice settings here
}
```

### Mengubah Tema
Edit `resources/css/app.css`:
```css
:root {
  --primary: #your-color;
  --secondary: #your-color;
}
```

## 🔄 Database Backup & Restore

### Backup Database
```bash
mysqldump -u root bukutamu > database/bukutamu.sql
```

### Restore Database
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS bukutamu;"
mysql -u root bukutamu < database/bukutamu.sql
```

## 📄 License

MIT License

## 👨‍💻 Author

SIANFIS - Sistem Informasi Antrian Fisipol
Dikembangkan untuk FISIPOL UMA (Fakultas Ilmu Sosial dan Ilmu Politik, Universitas Medan Area) - 2026
Powered by Sinom