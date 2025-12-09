# CogniLytics MIS - Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE cognilytics_mis;"

# Run schema
psql -U postgres -d cognilytics_mis -f ../database/schema.sql
```

### 3. Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit with your database credentials (or use defaults)
# Default config works for local PostgreSQL
```

### 4. Start Server

```bash
npm run dev
```

Server will start at: `http://localhost:3000`

---

## 📋 Test the API

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "first_name": "Test",
    "last_name": "User",
    "role": "student"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

Save the `accessToken` from the response!

### Get Profile

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🧮 Calculate CL-Index

### Example in Node.js

```javascript
import { calculateCognitiveLoad } from './src/services/cl-calculation.service.js';

const measurement = {
    sr_paas_score: 7,              // Self-report: 1-9
    pf_accuracy: 0.75,             // Performance: 75% correct
    pf_response_time_ms: 5000,     // Took 5 seconds
    pf_expected_time_ms: 4000,     // Expected 4 seconds
    bh_hint_requests: 2,           // Used 2 hints
    bh_page_revisits: 3,           // Revisited 3 pages
    bh_pause_duration_ms: 45000,   // Paused for 45 seconds
};

const result = calculateCognitiveLoad(measurement);

console.log(`CL-Index: ${result.cl_index.toFixed(4)}`);
console.log(`Category: ${result.cl_category}`);
// Output:
// CL-Index: 0.5423
// Category: optimal
```

---

## 🔑 Key Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |

---

## 📊 CL-Index Formula

```
CL = (0.35 × SR) + (0.30 × PF) + (0.20 × BH) + (0.15 × PH)
```

**Components:**
- **SR** (Self-Report): PAAS scale 1-9 or NASA-TLX
- **PF** (Performance): Accuracy + time pressure
- **BH** (Behavioral): Hints + revisits + pauses
- **PH** (Physiological): Camera data (future)

**Categories:**
- **Low:** 0.00 - 0.29 (Underchallenge)
- **Optimal:** 0.30 - 0.59 (Perfect!)
- **High:** 0.60 - 0.79 (Approaching overload)
- **Overload:** 0.80 - 1.00 (Too difficult)

---

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── auth/              # JWT & role guards
│   ├── config/            # Database & environment
│   ├── controllers/       # Request handlers
│   ├── models/            # Data access layer
│   ├── routes/            # API routes
│   └── services/          # Business logic (CL algorithm!)
├── .env                   # Configuration
└── package.json

database/
└── schema.sql            # PostgreSQL + TimescaleDB schema
```

---

## 🔧 Configuration

### Essential Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cognilytics_mis
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Secrets
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=24h

# CL Algorithm Weights
CL_WEIGHT_SR=0.35
CL_WEIGHT_PF=0.30
CL_WEIGHT_BH=0.20
CL_WEIGHT_PH=0.15
```

---

## 🛠️ Common Tasks

### Create a Learning Session

```javascript
import { createSession } from './src/models/sessions.model.js';

const session = await createSession({
    user_id: 'user-uuid',
    topic_id: 'topic-uuid',
    session_type: 'quiz',
});
```

### Create a Topic

```javascript
import { createTopic } from './src/models/topics.model.js';

const topic = await createTopic({
    name: 'Algebra Basics',
    subject: 'Mathematics',
    difficulty_level: 3,
    teacher_id: 'teacher-uuid',
    institution_id: 'institution-uuid',
});
```

### Get User Statistics

```javascript
import { getSessionStatistics } from './src/models/sessions.model.js';

const stats = await getSessionStatistics(
    'user-uuid',
    new Date('2024-01-01'),
    new Date('2024-12-31')
);

console.log(`Total sessions: ${stats.total_sessions}`);
console.log(`Average duration: ${stats.avg_duration_seconds}s`);
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Change PORT in .env
PORT=3001
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials
psql -U postgres -d cognilytics_mis
```

### TimescaleDB Not Found

```bash
# Install TimescaleDB extension
psql -U postgres -d cognilytics_mis -c "CREATE EXTENSION timescaledb;"
```

---

## 📚 Full Documentation

See [BACKEND_IMPLEMENTATION.md](./BACKEND_IMPLEMENTATION.md) for complete details.

---

## ✅ What's Implemented

- ✅ JWT Authentication (access + refresh tokens)
- ✅ Role-Based Access Control (student, teacher, admin)
- ✅ User Management (register, login, profile)
- ✅ Complete CL-Index Algorithm
- ✅ Session Tracking
- ✅ Topic Management
- ✅ PostgreSQL + TimescaleDB Schema
- ✅ Input Validation
- ✅ Error Handling

## 🚧 Coming Next

- Measurements Model & API
- Quizzes Model & API
- Decision Rules Service (Alerts)
- Teacher Analytics
- Admin Dashboard APIs
- Real-time CL Monitoring

---

**Happy Coding! 🎉**
