# Mock Data Mode - Development Guide

Mock data mode memungkinkan development frontend tanpa perlu setup database PostgreSQL.

## 🎯 Kapan Menggunakan Mock Mode?

**Gunakan Mock Mode ketika:**
- Frontend development tanpa backend database
- Testing UI/UX dengan data konsisten
- Demo atau presentasi
- Quick prototyping

**Jangan gunakan Mock Mode ketika:**
- Integration testing dengan database real
- Production deployment
- Testing database queries
- Performance testing

## 🚀 Cara Mengaktifkan Mock Mode

### 1. Set Environment Variable

Edit file `backend/.env`:

```env
USE_MOCK_DATA=true
```

### 2. Start Backend Server

```bash
cd backend
npm start
```

Kamu akan melihat log `[MOCK MODE]` di console saat mock data digunakan.

## 📊 Data yang Tersedia

### Users (Mock)
- **Teacher**: `teacher@cognilytics.com` (password: any - mock mode accepts any password)
- **Students**: `student1@example.com` sampai `student5@example.com`
- **Admin**: `admin@cognilytics.com`

### Topics
- Aljabar Linear
- Kalkulus Integral
- Geometri Analitik
- Statistika Dasar

### Measurements
5 pengukuran CL terbaru dengan variasi:
- Low CL: 38 (Dewi Lestari - Statistika Dasar)
- Optimal CL: 45, 55 (Siti, Eko)
- High CL: 67 (Ahmad - Aljabar Linear)
- Overload CL: 82 (Budi - Geometri Analitik)

### Dashboard Data
- Rata-rata CL: 52.4
- 8 siswa high-load
- 42 siswa aktif dari 45
- Performance index: 7.8/10
- Trend 7 hari dengan data konsisten

## 🔌 Endpoints yang Support Mock Mode

### Authentication
- `POST /api/auth/login` - Login dengan mock users
- `POST /api/auth/register` - Register (tidak persist)
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current user

### Teacher Dashboard
- `GET /api/teacher/dashboard` - Dashboard overview dengan mock stats
- `GET /api/teacher/topics` - List topics dari mock data
- `GET /api/teacher/topics/:topicId/measurements` - Measurements per topic

## 📝 Modifikasi Mock Data

Edit file `backend/src/data/mockData.js` untuk:

### Tambah User Baru
```javascript
export const mockUsers = [
  // ... existing users
  {
    user_id: 'usr_008',
    email: 'newstudent@example.com',
    first_name: 'New',
    last_name: 'Student',
    role: 'student',
    is_active: true,
    created_at: '2024-12-19T00:00:00Z',
  },
];
```

### Ubah Dashboard Stats
```javascript
export const mockTeacherDashboard = {
  overview: {
    avg_cl_index: 55.0,  // <- ubah di sini
    high_load_students: 10, // <- atau di sini
    // ...
  },
  // ...
};
```

### Tambah Measurements
```javascript
export const mockMeasurements = [
  // ... existing measurements
  {
    measurement_id: 'mes_006',
    user_id: 'usr_007',
    topic_id: 'tpc_001',
    cl_index: 75.5,
    cl_category: 'high',
    measured_at: '2024-12-19T10:00:00Z',
    // ... other fields
  },
];
```

## 🔄 Switch Antara Mock dan Real Database

### Development dengan Mock Data
```bash
# Edit backend/.env
USE_MOCK_DATA=true

# Start server
npm start
```

### Testing dengan Real Database
```bash
# Edit backend/.env
USE_MOCK_DATA=false

# Pastikan database running
docker-compose up -d postgres

# Run migrations
npm run migrate

# Start server
npm start
```

## 🧪 Testing dengan Mock Data

### Manual Testing
1. Start backend dengan `USE_MOCK_DATA=true`
2. Start frontend: `cd frontend && npm run dev`
3. Login dengan: `teacher@cognilytics.com` + password apapun
4. Lihat dashboard dengan data mock

### Curl Testing
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@cognilytics.com","password":"test123"}'

# Get Dashboard (dengan token dari login)
curl http://localhost:3000/api/teacher/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## ⚠️ Limitasi Mock Mode

1. **Data tidak persist**: Perubahan tidak disimpan ke database
2. **Registration tidak real**: User baru tidak tersimpan
3. **Relasi terbatas**: Hanya data yang sudah di-mock tersedia
4. **No pagination**: Semua data dikembalikan sekaligus
5. **No filtering advanced**: Filter sederhana via helper functions

## 🎨 Tips untuk Frontend Development

1. **Consistent Data**: Mock data selalu konsisten, bagus untuk screenshot/demo
2. **Quick Iteration**: Tidak perlu wait database queries
3. **Offline Development**: Bisa develop tanpa database connection
4. **Multiple Scenarios**: Buat multiple mock datasets untuk berbagai cases

## 📚 File Structure

```
backend/
├── src/
│   ├── data/
│   │   └── mockData.js           # ← Mock data definitions
│   ├── controllers/
│   │   ├── teacher.controller.js # ← With mock mode support
│   │   └── teacher.controller.mock.js # ← Pure mock controller
│   └── config/
│       └── env.js                # ← USE_MOCK_DATA config
├── .env                          # ← Set USE_MOCK_DATA here
└── .env.example                  # ← Template with mock config
```

## 🔍 Debug Mock Mode

Enable debug logging:

```env
LOG_LEVEL=debug
USE_MOCK_DATA=true
```

Kamu akan melihat log seperti:
```
[MOCK MODE] Login attempt for: teacher@cognilytics.com
[MOCK MODE] Login successful for: teacher@cognilytics.com
[MOCK MODE] Returning mock teacher dashboard data
```

## 📞 Support

Jika ada issue dengan mock mode:
1. Check `USE_MOCK_DATA=true` di `.env`
2. Restart backend server
3. Check console untuk `[MOCK MODE]` logs
4. Verify mock data di `mockData.js`

---

Happy coding! 🚀
