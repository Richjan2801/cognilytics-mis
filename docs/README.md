# CogniLytics MIS - Documentation Index

**Cognitive Load-Driven Educational Decision Support System**

---

## 📚 Documentation Files

### 1. [BACKEND_IMPLEMENTATION.md](./BACKEND_IMPLEMENTATION.md)
**Complete technical documentation** covering:
- Architecture and technology stack
- Database schema details
- Authentication & authorization system
- CL-Index calculation algorithm (with formulas)
- API reference
- Models, services, and configuration
- Setup instructions
- Code examples and troubleshooting

**Best for:** Developers who need in-depth understanding of the system

---

### 2. [QUICK_START.md](./QUICK_START.md)
**Get up and running in 5 minutes** with:
- Quick installation steps
- Database setup
- First API calls
- CL-Index calculation examples
- Common tasks
- Troubleshooting tips

**Best for:** Developers who want to start coding immediately

---

### 3. [API_TESTING.md](./API_TESTING.md)
**Complete API testing guide** including:
- All authentication endpoints
- Request/response examples
- Error scenarios
- Postman collection
- cURL scripts
- Automated testing with Jest
- HTTP client examples

**Best for:** QA engineers and developers testing the API

---

## 🎯 What's Implemented

### ✅ Core Features (v1.0.0)

#### Authentication & Security
- JWT-based authentication (access + refresh tokens)
- Role-based access control (Student, Teacher, Admin)
- Password hashing with bcrypt (10 rounds)
- Token expiration and refresh mechanism
- Protected routes with middleware

#### User Management
- User registration with validation
- Login/logout functionality
- Profile management (view/update)
- Password change
- Email uniqueness validation
- Account activation/deactivation

#### CL-Index Calculation Algorithm
Complete implementation of cognitive load measurement:

**Formula:**
```
CL = (0.35 × SR) + (0.30 × PF) + (0.20 × BH) + (0.15 × PH)
```

**Components:**
- **SR (Self-Report):** PAAS scale or NASA-TLX normalization
- **PF (Performance):** Accuracy + time pressure calculation
- **BH (Behavioral):** Hints, revisits, pause normalization
- **PH (Physiological):** Placeholder for camera integration

**Categories:**
- Low: 0.00 - 0.29
- Optimal: 0.30 - 0.59
- High: 0.60 - 0.79
- Overload: 0.80 - 1.00

#### Database
- PostgreSQL 14 with TimescaleDB extension
- Time-series hypertables for sessions and measurements
- Comprehensive schema with 15+ tables
- Automatic partitioning and indexing
- Views for common queries

#### Data Models
- **Users:** Complete user management with roles
- **Sessions:** Learning session tracking with statistics
- **Topics:** Subject/topic management with difficulty levels
- **Measurements:** CL measurement storage (ready for implementation)
- **Quizzes:** Quiz structure (ready for implementation)

#### API Endpoints
**Implemented:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

---

## 📊 System Statistics

### Code Metrics
```
Total Lines of Code: ~2,805
Database Tables: 15
Hypertables: 3
API Endpoints: 7
Models: 3 (users, sessions, topics)
Services: 1 (CL calculation)
Test Scenarios: 20+
```

### File Structure
```
backend/src/
├── auth/                  2 files, 257 lines
├── config/                2 files, 325 lines
├── controllers/           1 file,  370 lines
├── models/                3 files, 857 lines
├── routes/                1 file,  104 lines
└── services/              1 file,  356 lines

database/
└── schema.sql             536 lines

docs/
├── BACKEND_IMPLEMENTATION.md
├── QUICK_START.md
├── API_TESTING.md
└── README.md (this file)
```

---

## 🚀 Quick Links

### For Developers

**Getting Started:**
1. Read [QUICK_START.md](./QUICK_START.md)
2. Set up database and environment
3. Run first API tests

**Deep Dive:**
1. Study [BACKEND_IMPLEMENTATION.md](./BACKEND_IMPLEMENTATION.md)
2. Understand CL-Index algorithm
3. Review database schema
4. Explore models and services

**Testing:**
1. Follow [API_TESTING.md](./API_TESTING.md)
2. Import Postman collection
3. Run automated tests
4. Validate all endpoints

### For Product Managers

**Key Documents:**
- System overview: [BACKEND_IMPLEMENTATION.md#overview](./BACKEND_IMPLEMENTATION.md#overview)
- Features implemented: This README, section "What's Implemented"
- API capabilities: [API_TESTING.md](./API_TESTING.md)

### For DevOps

**Deployment Information:**
- Environment configuration: [BACKEND_IMPLEMENTATION.md#configuration](./BACKEND_IMPLEMENTATION.md#configuration)
- Database setup: [QUICK_START.md#setup-database](./QUICK_START.md#setup-database)
- Docker setup: (pending)

---

## 🛠️ Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express | 5.1.0 |
| Database | PostgreSQL | 14+ |
| Time-Series | TimescaleDB | 2.x |
| DB Client | pg-promise | 11.5.4 |
| Authentication | jsonwebtoken | 9.0.2 |
| Password Hashing | bcrypt | 6.0.0 |
| Validation | express-validator | 7.0.1 |
| Cron Jobs | node-cron | 3.0.3 |

---

## 📈 Roadmap

### Phase 1: Core Backend (CURRENT - 90% Complete)
- ✅ Authentication & Authorization
- ✅ User Management
- ✅ CL-Index Algorithm
- ✅ Session Tracking
- ✅ Topic Management
- ⏳ Measurements Model
- ⏳ Quizzes Model
- ⏳ Decision Rules Service

### Phase 2: Analytics & Reporting
- [ ] Aggregation Service
- [ ] Teacher Analytics API
- [ ] Admin Dashboard API
- [ ] Report Generation
- [ ] CSV/PDF Exports

### Phase 3: Real-Time Features
- [ ] WebSocket Support
- [ ] Live CL Monitoring
- [ ] Push Notifications
- [ ] Real-time Alerts

### Phase 4: Advanced Features
- [ ] Camera Integration (PH component)
- [ ] Machine Learning Integration
- [ ] Predictive Analytics
- [ ] Adaptive Learning Paths

---

## 📝 CL-Index Algorithm Reference

### Normalization Formulas

#### Self-Report (SR)
```
PAAS Method:
SR_norm = (PAAS_score - 1) / 8
where PAAS ∈ [1, 9]

NASA-TLX Method:
SR_norm = (Mental_Demand + Effort + Frustration) / 300
where each ∈ [0, 100]
```

#### Performance (PF)
```
PF_norm = clamp((1 - Accuracy) + max(0, (RT - ET) / ET), 0, 1)

where:
  Accuracy ∈ [0, 1]
  RT = Response Time
  ET = Expected Time
```

#### Behavioral (BH)
```
BH_norm = (
    min(Hints, MaxHints) / MaxHints +
    min(Revisits, MaxRevisits) / MaxRevisits +
    min(Pause_mins, MaxPause) / MaxPause
) / 3

Caps:
  MaxHints = 5
  MaxRevisits = 10
  MaxPause = 3 minutes
```

#### Physiological (PH)
```
Currently: PH_norm = null (excluded from calculation)
Future: Eye tracking + facial analysis + heart rate
```

### Final CL-Index Calculation

```
Available components: {SR, PF, BH, PH}
Weight sum = sum of available component weights
Normalized weights = original_weight / weight_sum

CL_index = Σ (normalized_weight × component_norm)
CL_index ∈ [0, 1]
```

### Category Mapping

| CL-Index Range | Category | Interpretation |
|---------------|----------|----------------|
| 0.00 - 0.29 | Low | Underchallenge - increase difficulty |
| 0.30 - 0.59 | Optimal | Perfect learning zone |
| 0.60 - 0.79 | High | Approaching overload - provide support |
| 0.80 - 1.00 | Overload | Cognitive overload - reduce difficulty |

---

## 🔐 Security Features

1. **Password Security**
   - Minimum 8 characters
   - Must contain uppercase, lowercase, and number
   - Hashed with bcrypt (10 rounds)
   - Never stored in plain text

2. **Token Security**
   - Access tokens expire in 24 hours
   - Refresh tokens expire in 7 days
   - Signed with secret keys
   - Verified on every request

3. **Database Security**
   - Parameterized queries (SQL injection protection)
   - Connection pooling with limits
   - SSL support for production
   - Role-based access control

4. **Input Validation**
   - Email format validation
   - Password strength requirements
   - Type checking
   - Range validation for CL components

5. **Rate Limiting**
   - 100 requests per 15 minutes
   - Configurable limits
   - IP-based throttling

---

## 🤝 Contributing

### Code Style
- ES6 modules (`import`/`export`)
- Async/await for asynchronous code
- Descriptive function and variable names
- JSDoc comments for functions
- Single responsibility principle

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Convention
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
refactor: Code refactoring
test: Add tests
chore: Update dependencies
```

---

## 📞 Support

### Documentation Issues
If you find errors or have suggestions for the documentation, please create an issue.

### Technical Questions
- Review [BACKEND_IMPLEMENTATION.md](./BACKEND_IMPLEMENTATION.md) for detailed explanations
- Check [API_TESTING.md](./API_TESTING.md) for API examples
- See [QUICK_START.md](./QUICK_START.md) for common issues

---

## 📄 License

Copyright © 2024 CogniLytics MIS

---

## 🎉 Quick Start Command Reference

```bash
# Installation
npm install

# Database Setup
psql -U postgres -c "CREATE DATABASE cognilytics_mis;"
psql -U postgres -d cognilytics_mis -f database/schema.sql

# Start Development Server
npm run dev

# Run Tests
npm test

# Test API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","first_name":"Test","last_name":"User","role":"student"}'
```

---

**Last Updated:** 2025-12-08
**Version:** 1.0.0
**Status:** Core Implementation Complete ✅
