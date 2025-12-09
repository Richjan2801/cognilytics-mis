# CogniLytics MIS - Backend Implementation Documentation

**Version:** 1.0.0
**Last Updated:** 2025-12-08
**Status:** Core Implementation Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Authentication & Authorization](#authentication--authorization)
5. [Core Algorithm: CL-Index Calculation](#core-algorithm-cl-index-calculation)
6. [API Reference](#api-reference)
7. [Models](#models)
8. [Services](#services)
9. [Configuration](#configuration)
10. [Setup & Installation](#setup--installation)

---

## Overview

CogniLytics MIS (Management Information System) is a **Cognitive Load-Driven Educational Decision Support System** that measures and analyzes student cognitive load in real-time to provide actionable insights for students, teachers, and administrators.

### Core Features Implemented

✅ JWT-based authentication with access & refresh tokens
✅ Role-based access control (Student, Teacher, Admin)
✅ Complete CL-Index calculation algorithm
✅ Session tracking and management
✅ Topic/subject management
✅ PostgreSQL + TimescaleDB for time-series data
✅ Comprehensive error handling
✅ Input validation
✅ Password hashing with bcrypt

---

## Architecture

### Technology Stack

- **Runtime:** Node.js with ES6 modules
- **Framework:** Express 5.1.0
- **Database:** PostgreSQL 14 + TimescaleDB
- **Database Client:** pg-promise 11.5.4
- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **Password Hashing:** bcrypt 6.0.0
- **Validation:** express-validator 7.0.1

### Project Structure

```
backend/
├── src/
│   ├── auth/
│   │   ├── jwt.js                    # JWT token utilities
│   │   └── roleGuard.js              # Authentication & authorization middleware
│   ├── config/
│   │   ├── db.js                     # Database connection & utilities
│   │   └── env.js                    # Environment configuration
│   ├── controllers/
│   │   └── auth.controller.js        # Authentication endpoints
│   ├── models/
│   │   ├── users.model.js            # User data access
│   │   ├── sessions.model.js         # Learning session data access
│   │   └── topics.model.js           # Topic/subject data access
│   ├── routes/
│   │   └── auth.routes.js            # Authentication routes
│   ├── services/
│   │   └── cl-calculation.service.js # CL-Index calculation algorithm
│   └── server.js                     # Application entry point
├── .env                              # Environment variables
└── package.json                      # Dependencies
```

---

## Database Schema

### Core Tables

#### **users**
Stores user information for students, teachers, and administrators.

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    institution_id UUID REFERENCES institutions(institution_id),
    teacher_id UUID REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_role` on `role`
- `idx_users_teacher` on `teacher_id`
- `idx_users_institution` on `institution_id`

#### **topics**
Manages subjects and topics taught in the system.

```sql
CREATE TABLE topics (
    topic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    teacher_id UUID REFERENCES users(user_id),
    institution_id UUID REFERENCES institutions(institution_id),
    estimated_duration_mins INTEGER,
    learning_objectives TEXT[],
    prerequisites TEXT[],
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **learning_sessions** (TimescaleDB Hypertable)
Tracks student learning sessions with automatic time-series partitioning.

```sql
CREATE TABLE learning_sessions (
    session_id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    topic_id UUID REFERENCES topics(topic_id),
    quiz_id UUID REFERENCES quizzes(quiz_id),
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('quiz', 'study', 'practice', 'review')),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    device_type VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    PRIMARY KEY (started_at, session_id)
);

SELECT create_hypertable('learning_sessions', 'started_at');
```

#### **cl_measurements** (TimescaleDB Hypertable)
Stores cognitive load measurements with all components.

```sql
CREATE TABLE cl_measurements (
    measurement_id UUID DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(user_id),
    topic_id UUID REFERENCES topics(topic_id),
    measured_at TIMESTAMPTZ NOT NULL,

    -- Self-Report Component (SR)
    sr_paas_score INTEGER CHECK (sr_paas_score BETWEEN 1 AND 9),
    sr_nasa_tlx_mental_demand INTEGER CHECK (sr_nasa_tlx_mental_demand BETWEEN 0 AND 100),
    sr_nasa_tlx_effort INTEGER CHECK (sr_nasa_tlx_effort BETWEEN 0 AND 100),
    sr_nasa_tlx_frustration INTEGER CHECK (sr_nasa_tlx_frustration BETWEEN 0 AND 100),
    sr_normalized DECIMAL(5,4) CHECK (sr_normalized BETWEEN 0 AND 1),

    -- Performance Component (PF)
    pf_accuracy DECIMAL(5,4) CHECK (pf_accuracy BETWEEN 0 AND 1),
    pf_response_time_ms INTEGER,
    pf_expected_time_ms INTEGER,
    pf_normalized DECIMAL(5,4) CHECK (pf_normalized BETWEEN 0 AND 1),

    -- Behavioral Component (BH)
    bh_hint_requests INTEGER DEFAULT 0,
    bh_page_revisits INTEGER DEFAULT 0,
    bh_pause_duration_ms INTEGER DEFAULT 0,
    bh_normalized DECIMAL(5,4) CHECK (bh_normalized BETWEEN 0 AND 1),

    -- Physiological Component (PH) - Optional/Future
    ph_normalized DECIMAL(5,4) CHECK (ph_normalized BETWEEN 0 AND 1),

    -- Computed CL Index
    cl_index DECIMAL(5,4) NOT NULL CHECK (cl_index BETWEEN 0 AND 1),
    cl_category VARCHAR(20) NOT NULL CHECK (cl_category IN ('low', 'optimal', 'high', 'overload')),

    PRIMARY KEY (measured_at, measurement_id)
);

SELECT create_hypertable('cl_measurements', 'measured_at');
```

---

## Authentication & Authorization

### JWT Token System

The system uses a dual-token approach for security:

1. **Access Token** (24 hours)
   - Used for API authentication
   - Contains: `user_id`, `email`, `role`
   - Signed with `JWT_SECRET`

2. **Refresh Token** (7 days)
   - Used to obtain new access tokens
   - Signed with `JWT_REFRESH_SECRET`

### Implementation

**File:** `backend/src/auth/jwt.js`

```javascript
// Generate tokens for a user
export function generateTokens(user) {
    const payload = {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
    };

    return {
        accessToken: jwt.sign(payload, config.JWT_SECRET, {
            expiresIn: config.JWT_EXPIRES_IN,
        }),
        refreshToken: jwt.sign(payload, config.JWT_REFRESH_SECRET, {
            expiresIn: config.JWT_REFRESH_EXPIRES_IN,
        }),
    };
}
```

### Role-Based Access Control (RBAC)

**File:** `backend/src/auth/roleGuard.js`

Three user roles with hierarchical permissions:

1. **Student** - Access to own data, quizzes, and progress
2. **Teacher** - Access to student data, topic management, analytics
3. **Admin** - Full system access, user management, configuration

**Middleware Functions:**

```javascript
// Verify JWT and attach user to request
export async function authenticate(req, res, next)

// Check user role
export function authorize(...allowedRoles)

// Pre-configured role guards
export const studentOnly = authorize('student');
export const teacherOnly = authorize('teacher');
export const adminOnly = authorize('admin');
export const teacherOrAdmin = authorize('teacher', 'admin');
```

### Password Security

- **Algorithm:** bcrypt
- **Rounds:** 10 (configurable via `BCRYPT_ROUNDS`)
- Passwords are hashed before storage
- Verification uses constant-time comparison

**Example:**

```javascript
// Hash password on registration
const password_hash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

// Verify password on login
const isValid = await bcrypt.compare(password, user.password_hash);
```

---

## Core Algorithm: CL-Index Calculation

**File:** `backend/src/services/cl-calculation.service.js`

### Formula

```
CL-Index = (W_SR × SR_norm) + (W_PF × PF_norm) + (W_BH × BH_norm) + (W_PH × PH_norm)
```

**Default Weights:**
- SR (Self-Report): 35% (0.35)
- PF (Performance): 30% (0.30)
- BH (Behavioral): 20% (0.20)
- PH (Physiological): 15% (0.15)

### Component Normalization

#### 1. Self-Report (SR) Normalization

**Primary Method - PAAS (Paas Mental Effort Scale):**
```
SR_norm = (PAAS - 1) / 8
```
- PAAS range: 1-9
- Normalized to: 0-1

**Alternative - NASA-TLX:**
```
SR_norm = (Mental_Demand + Effort + Frustration) / 300
```
- Each scale: 0-100
- Combined max: 300
- Normalized to: 0-1

**Implementation:**

```javascript
export function normalizeSR(srData) {
    const { paas_score, nasa_tlx_mental_demand,
            nasa_tlx_effort, nasa_tlx_frustration } = srData;

    // Prefer PAAS if available
    if (paas_score !== null && paas_score !== undefined) {
        const normalized = (paas_score - 1) / 8;
        return clamp(normalized, 0, 1);
    }

    // Fall back to NASA-TLX
    if (nasa_tlx_mental_demand !== null &&
        nasa_tlx_effort !== null &&
        nasa_tlx_frustration !== null) {
        const sum = nasa_tlx_mental_demand +
                    nasa_tlx_effort +
                    nasa_tlx_frustration;
        const normalized = sum / 300;
        return clamp(normalized, 0, 1);
    }

    return null;
}
```

#### 2. Performance (PF) Normalization

**Formula:**
```
PF_norm = (1 - Accuracy) + max(0, (ResponseTime - ExpectedTime) / ExpectedTime)
```
- Clamped to [0, 1]

**Components:**
- **Error Rate:** `(1 - Accuracy)` - Higher errors = higher load
- **Time Pressure:** `(RT - ET) / ET` - Slower than expected = higher load

**Implementation:**

```javascript
export function normalizePF(pfData) {
    const { accuracy, response_time_ms, expected_time_ms } = pfData;

    // Error component (1 - accuracy)
    const errorComponent = 1 - accuracy;

    // If we have timing data, include time pressure
    if (response_time_ms !== null &&
        expected_time_ms !== null &&
        expected_time_ms > 0) {
        const timePressure = (response_time_ms - expected_time_ms) /
                             expected_time_ms;
        const normalized = errorComponent + Math.max(0, timePressure);
        return clamp(normalized, 0, 1);
    }

    // Otherwise, use accuracy-only
    return clamp(errorComponent, 0, 1);
}
```

#### 3. Behavioral (BH) Normalization

**Formula:**
```
BH_norm = (
    min(HintRequests, MaxHints) / MaxHints +
    min(PageRevisits, MaxRevisits) / MaxRevisits +
    min(PauseDuration_mins, MaxPause) / MaxPause
) / 3
```

**Behavioral Caps (from config):**
- `MAX_HINTS`: 5
- `MAX_REVISITS`: 10
- `MAX_PAUSE_MINS`: 3

**Implementation:**

```javascript
export function normalizeBH(bhData) {
    const { hint_requests = 0,
            page_revisits = 0,
            pause_duration_ms = 0 } = bhData;

    // Get caps from config
    const MAX_HINTS = config.BEHAVIORAL_CAPS.MAX_HINTS;
    const MAX_REVISITS = config.BEHAVIORAL_CAPS.MAX_REVISITS;
    const MAX_PAUSE_MINS = config.BEHAVIORAL_CAPS.MAX_PAUSE_MINS;

    // Convert pause to minutes
    const pause_duration_mins = pause_duration_ms / (1000 * 60);

    // Normalize each component
    const hintComponent = Math.min(hint_requests, MAX_HINTS) / MAX_HINTS;
    const revisitComponent = Math.min(page_revisits, MAX_REVISITS) / MAX_REVISITS;
    const pauseComponent = Math.min(pause_duration_mins, MAX_PAUSE_MINS) / MAX_PAUSE_MINS;

    // Average of the three components
    const normalized = (hintComponent + revisitComponent + pauseComponent) / 3;
    return clamp(normalized, 0, 1);
}
```

#### 4. Physiological (PH) Normalization

**Status:** Placeholder for future camera integration

```javascript
export function normalizePH(phData) {
    // Future: Eye tracking, facial analysis, heart rate
    // For now, returns null (excluded from calculation)
    return null;
}
```

### CL Category Determination

**Thresholds (from config):**
- **Low:** CL ≤ 0.29 (Underchallenge)
- **Optimal:** 0.29 < CL ≤ 0.59 (Ideal learning zone)
- **High:** 0.59 < CL ≤ 0.79 (Approaching overload)
- **Overload:** CL > 0.79 (Cognitive overload)

```javascript
export function determineCLCategory(clIndex) {
    const thresholds = config.CL_THRESHOLDS;

    if (clIndex <= thresholds.LOW) return 'low';
    else if (clIndex <= thresholds.OPTIMAL) return 'optimal';
    else if (clIndex <= thresholds.HIGH) return 'high';
    else return 'overload';
}
```

### Complete Calculation Pipeline

```javascript
export function calculateCognitiveLoad(measurementData) {
    // 1. Normalize each component
    const sr_normalized = normalizeSR({ ... });
    const pf_normalized = normalizePF({ ... });
    const bh_normalized = normalizeBH({ ... });
    const ph_normalized = normalizePH({ ... });

    // 2. Calculate weighted CL-Index
    const cl_index = calculateCLIndex({
        sr_normalized,
        pf_normalized,
        bh_normalized,
        ph_normalized,
    });

    // 3. Determine category
    const cl_category = determineCLCategory(cl_index);

    return {
        sr_normalized,
        pf_normalized,
        bh_normalized,
        ph_normalized,
        cl_index,
        cl_category,
        weight_sr: 0.35,
        weight_pf: 0.30,
        weight_bh: 0.20,
        weight_ph: 0.15,
    };
}
```

### Adaptive Weight Calculation

The system automatically adjusts weights when components are missing:

```javascript
// If only SR and PF are available (no BH, no PH):
// Original: SR=0.35, PF=0.30, BH=0.20, PH=0.15
// Weight sum = 0.35 + 0.30 = 0.65
// Normalized: SR=0.35/0.65=0.538, PF=0.30/0.65=0.462
// CL = 0.538×SR + 0.462×PF
```

This ensures CL-Index remains in [0, 1] range regardless of missing components.

---

## API Reference

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
    "email": "student@example.com",
    "password": "SecurePass123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "institution_id": "uuid-optional"
}
```

**Validation Rules:**
- Email: Valid email format, normalized
- Password: Min 8 chars, must contain uppercase, lowercase, and number
- First/Last name: 2-50 characters
- Role: 'student', 'teacher', or 'admin'

**Response (201 Created):**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "user_id": "uuid",
            "email": "student@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "role": "student",
            "institution_id": null
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

**Error Responses:**
- `400` - Validation failed
- `409` - Email already registered

#### POST /auth/login
Authenticate user and receive tokens.

**Request Body:**
```json
{
    "email": "student@example.com",
    "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "user_id": "uuid",
            "email": "student@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "role": "student",
            "institution_id": null
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `403` - Account deactivated

#### POST /auth/refresh
Obtain new access token using refresh token.

**Request Body:**
```json
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

**Error Responses:**
- `401` - Invalid or expired refresh token

#### GET /auth/me
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "user": {
            "user_id": "uuid",
            "email": "student@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "role": "student",
            "institution_id": null,
            "is_active": true,
            "created_at": "2024-01-01T00:00:00.000Z",
            "last_login": "2024-01-02T12:00:00.000Z"
        }
    }
}
```

#### PUT /auth/profile
Update user profile information.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "newmail@example.com"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Profile updated successfully",
    "data": {
        "user": {
            "user_id": "uuid",
            "email": "newmail@example.com",
            "first_name": "Jane",
            "last_name": "Smith",
            "role": "student",
            "institution_id": null
        }
    }
}
```

#### POST /auth/change-password
Change user password.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request Body:**
```json
{
    "current_password": "OldPass123",
    "new_password": "NewSecurePass456"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Password changed successfully"
}
```

**Error Responses:**
- `401` - Current password incorrect

#### POST /auth/logout
Logout (client should clear tokens).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Logout successful. Please clear your tokens."
}
```

---

## Models

### User Model

**File:** `backend/src/models/users.model.js`

**Functions:**

```javascript
// Create new user with hashed password
createUser(userData) → Promise<Object>

// Find user by email (includes password_hash)
findUserByEmail(email) → Promise<Object|null>

// Find user by ID (excludes password_hash)
findUserById(userId) → Promise<Object|null>

// Find users by role with optional institution filter
findUsersByRole(role, institutionId?) → Promise<Array>

// Update user information
updateUser(userId, updateData) → Promise<Object>

// Update user password
updatePassword(userId, newPassword) → Promise<boolean>

// Verify password and return user if valid
verifyUserPassword(email, password) → Promise<Object|null>

// Deactivate/activate user
deactivateUser(userId) → Promise<boolean>
activateUser(userId) → Promise<boolean>

// Delete user permanently
deleteUser(userId) → Promise<boolean>

// Get students/teachers by institution
getStudentsByInstitution(institutionId) → Promise<Array>
getTeachersByInstitution(institutionId) → Promise<Array>

// Count users by role
countUsersByRole(role, institutionId?) → Promise<number>

// Check if email exists
emailExists(email) → Promise<boolean>
```

### Session Model

**File:** `backend/src/models/sessions.model.js`

**Functions:**

```javascript
// Create new learning session
createSession(sessionData) → Promise<Object>

// End session and calculate duration
endSession(sessionId) → Promise<Object>

// Get session by ID
getSessionById(sessionId) → Promise<Object|null>

// Get active sessions for user
getActiveSessions(userId) → Promise<Array>

// Get sessions with pagination and filters
getSessionsByUser(userId, options) → Promise<Array>
// options: { limit, offset, session_type, start_date, end_date }

// Get sessions by topic/quiz
getSessionsByTopic(topicId, options) → Promise<Array>
getSessionsByQuiz(quizId) → Promise<Array>

// Count sessions
countSessionsByUser(userId, filters) → Promise<number>

// Get session statistics
getSessionStatistics(userId, startDate, endDate) → Promise<Object>
// Returns: total_sessions, quiz_sessions, study_sessions, etc.

// Update session metadata
updateSessionMetadata(sessionId, metadata) → Promise<Object>

// Cleanup old sessions
deleteOldSessions(beforeDate) → Promise<number>
```

### Topic Model

**File:** `backend/src/models/topics.model.js`

**Functions:**

```javascript
// Create new topic
createTopic(topicData) → Promise<Object>

// Get topic by ID
getTopicById(topicId) → Promise<Object|null>

// Get topics with filters
getTopics(filters) → Promise<Array>
// filters: { teacher_id, institution_id, subject, grade_level, is_active, limit, offset }

// Get topics by teacher/institution
getTopicsByTeacher(teacherId) → Promise<Array>
getTopicsByInstitution(institutionId) → Promise<Array>

// Update topic
updateTopic(topicId, updateData) → Promise<Object>

// Delete topic (soft delete)
deleteTopic(topicId) → Promise<boolean>

// Permanently delete topic
permanentlyDeleteTopic(topicId) → Promise<boolean>

// Get topic statistics
getTopicStatistics(topicId) → Promise<Object>
// Returns: total_sessions, unique_students, quiz_count, avg_cl_index, overload_percentage

// Count topics
countTopics(filters) → Promise<number>

// Get unique subjects
getUniqueSubjects(institutionId?) → Promise<Array>
```

---

## Services

### CL Calculation Service

**File:** `backend/src/services/cl-calculation.service.js`

**Exported Functions:**

```javascript
// Normalize individual components
normalizeSR(srData) → number
normalizePF(pfData) → number
normalizeBH(bhData) → number
normalizePH(phData) → number|null

// Calculate CL-Index from normalized components
calculateCLIndex(normalizedData) → number

// Determine category from CL-Index
determineCLCategory(clIndex) → string
// Returns: 'low', 'optimal', 'high', 'overload'

// Complete calculation pipeline
calculateCognitiveLoad(measurementData) → Object
// Returns: { sr_normalized, pf_normalized, bh_normalized, ph_normalized,
//            cl_index, cl_category, weight_sr, weight_pf, weight_bh, weight_ph }

// Validate measurement data
validateMeasurementData(data) → Object
// Returns: { valid: boolean, errors: Array }
```

**Usage Example:**

```javascript
import { calculateCognitiveLoad } from './services/cl-calculation.service.js';

const measurementData = {
    sr_paas_score: 7,
    pf_accuracy: 0.75,
    pf_response_time_ms: 5000,
    pf_expected_time_ms: 4000,
    bh_hint_requests: 2,
    bh_page_revisits: 3,
    bh_pause_duration_ms: 45000,
};

const result = calculateCognitiveLoad(measurementData);
console.log(result);
// {
//   sr_normalized: 0.75,
//   pf_normalized: 0.50,
//   bh_normalized: 0.30,
//   ph_normalized: null,
//   cl_index: 0.5423,
//   cl_category: 'optimal',
//   weight_sr: 0.35,
//   weight_pf: 0.30,
//   weight_bh: 0.20,
//   weight_ph: 0.15
// }
```

---

## Configuration

### Environment Variables

**File:** `backend/.env`

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cognilytics_mis
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000

# JWT Configuration
JWT_SECRET=cognilytics-jwt-secret-change-in-production-2024
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=cognilytics-refresh-secret-change-in-production-2024
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt Configuration
BCRYPT_ROUNDS=10

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CL Calculation Weights
CL_WEIGHT_SR=0.35
CL_WEIGHT_PF=0.30
CL_WEIGHT_BH=0.20
CL_WEIGHT_PH=0.15

# CL Category Thresholds
CL_THRESHOLD_LOW=0.29
CL_THRESHOLD_OPTIMAL=0.59
CL_THRESHOLD_HIGH=0.79
CL_THRESHOLD_OVERLOAD=1.0

# Behavioral Normalization Caps
MAX_HINTS=5
MAX_REVISITS=10
MAX_PAUSE_MINS=3

# Decision Rules Thresholds
STUDENT_OVERLOAD_THRESHOLD=0.80
STUDENT_SUPPORT_THRESHOLD=0.60
STUDENT_LOW_CHALLENGE_THRESHOLD=0.30
TEACHER_TOPIC_OVERLOAD=0.70
TEACHER_OVERLOAD_PERCENTAGE=0.30
```

### Configuration Module

**File:** `backend/src/config/env.js`

Loads and validates all environment variables with defaults.

**Key Features:**
- Type conversion (parseInt, parseFloat)
- Production validation (requires secrets to be changed)
- CL weight validation (warns if sum ≠ 1.0)
- Structured configuration object

---

## Setup & Installation

### Prerequisites

- Node.js 18+ (recommended)
- PostgreSQL 14+
- TimescaleDB extension

### Installation Steps

1. **Install Dependencies**

```bash
cd backend
npm install
```

2. **Configure Environment**

```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Create Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE cognilytics_mis;

# Enable extensions
\c cognilytics_mis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

4. **Run Schema Migration**

```bash
psql -U postgres -d cognilytics_mis -f ../database/schema.sql
```

5. **Start Server**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Testing Database Connection

```javascript
import { testConnection } from './src/config/db.js';

testConnection().then(success => {
    if (success) {
        console.log('Database ready!');
    } else {
        console.error('Database connection failed');
    }
});
```

### Expected Output

```
✓ Database connected successfully
  PostgreSQL version: PostgreSQL 14.x
  Server time: 2024-01-01T00:00:00.000Z
  TimescaleDB version: 2.x.x
```

---

## Code Examples

### Example 1: Register and Login Flow

```javascript
// 1. Register new user
const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'student@example.com',
        password: 'SecurePass123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student'
    })
});

const { data } = await registerResponse.json();
const { accessToken, refreshToken } = data;

// 2. Use access token for authenticated requests
const profileResponse = await fetch('http://localhost:3000/api/auth/me', {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});

const profile = await profileResponse.json();
console.log(profile.data.user);
```

### Example 2: Calculate CL-Index

```javascript
import { calculateCognitiveLoad, validateMeasurementData } from './services/cl-calculation.service.js';

const measurementData = {
    // Self-Report (PAAS)
    sr_paas_score: 6,

    // Performance
    pf_accuracy: 0.80,
    pf_response_time_ms: 3500,
    pf_expected_time_ms: 3000,

    // Behavioral
    bh_hint_requests: 1,
    bh_page_revisits: 2,
    bh_pause_duration_ms: 30000,
};

// Validate before calculation
const validation = validateMeasurementData(measurementData);
if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
    return;
}

// Calculate CL
const result = calculateCognitiveLoad(measurementData);
console.log(`CL-Index: ${result.cl_index.toFixed(4)}`);
console.log(`Category: ${result.cl_category}`);
console.log(`Components: SR=${result.sr_normalized}, PF=${result.pf_normalized}, BH=${result.bh_normalized}`);
```

### Example 3: Track Learning Session

```javascript
import { createSession, endSession } from './models/sessions.model.js';

// Start session
const session = await createSession({
    user_id: 'user-uuid',
    topic_id: 'topic-uuid',
    session_type: 'quiz',
    device_type: 'desktop',
});

console.log('Session started:', session.session_id);

// ... student takes quiz ...

// End session
const completedSession = await endSession(session.session_id);
console.log('Duration:', completedSession.duration_seconds, 'seconds');
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized**
```json
{
    "success": false,
    "message": "Authentication required. No token provided."
}
```

**403 Forbidden**
```json
{
    "success": false,
    "message": "Access denied. Required role: teacher or admin"
}
```

**409 Conflict**
```json
{
    "success": false,
    "message": "Email already registered"
}
```

**500 Internal Server Error**
```json
{
    "success": false,
    "message": "Database error occurred",
    "detail": "Error details (development mode only)"
}
```

### Database Error Handling

The system includes a comprehensive error handler in `db.js`:

```javascript
handleDatabaseError(error) → Object
```

Maps PostgreSQL error codes to user-friendly messages:
- `23505` → "A record with this value already exists" (409)
- `23503` → "Referenced record does not exist" (400)
- `23502` → "Required field is missing" (400)
- `22P02` → "Invalid data format" (400)
- `42P01` → "Database table not found" (500)

---

## Performance Considerations

### TimescaleDB Optimizations

1. **Automatic Partitioning**
   - `learning_sessions` partitioned by `started_at`
   - `cl_measurements` partitioned by `measured_at`
   - `behavioral_events` partitioned by `occurred_at`

2. **Index Strategy**
   - Time-based indexes on all hypertables
   - User-specific indexes for fast queries
   - Topic-specific indexes for analytics

3. **Data Retention**
   - Use `deleteOldSessions()` for cleanup
   - Consider retention policies for old measurements

### Connection Pooling

- Max connections: 20 (configurable via `DB_MAX_CONNECTIONS`)
- Idle timeout: 30 seconds (configurable via `DB_IDLE_TIMEOUT`)
- Connection timeout: 5 seconds

---

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` to version control
   - Change default secrets in production
   - Use strong, random secrets (min 32 characters)

2. **Password Policy**
   - Minimum 8 characters
   - Must contain uppercase, lowercase, and number
   - Hashed with bcrypt (10 rounds)

3. **Token Security**
   - Access tokens expire after 24 hours
   - Refresh tokens expire after 7 days
   - Tokens include user ID, email, and role only
   - No sensitive data in JWT payload

4. **Database Security**
   - Use SSL in production (`DB_SSL=true`)
   - Limit database user permissions
   - Enable SSL certificate verification in production

5. **Rate Limiting**
   - 100 requests per 15-minute window per IP
   - Configurable via `RATE_LIMIT_MAX_REQUESTS`

---

## Next Steps (Pending Implementation)

1. **Measurements Model** - CRUD for CL measurements
2. **Quizzes Model** - Quiz and question management
3. **Decision Rules Service** - Alert generation logic
4. **Session Controller** - Session management endpoints
5. **Measure Controller** - CL measurement endpoints
6. **Teacher Controller** - Teacher analytics endpoints
7. **Admin Controller** - System administration endpoints
8. **WebSocket Support** - Real-time CL monitoring
9. **Aggregation Service** - Pre-computed statistics
10. **Report Generation** - PDF/CSV exports

---

## File Sizes & Line Counts

```
backend/src/auth/jwt.js                    112 lines
backend/src/auth/roleGuard.js              145 lines
backend/src/config/db.js                   191 lines
backend/src/config/env.js                  134 lines
backend/src/controllers/auth.controller.js 370 lines
backend/src/models/users.model.js          267 lines
backend/src/models/sessions.model.js       267 lines
backend/src/models/topics.model.js         323 lines
backend/src/routes/auth.routes.js          104 lines
backend/src/services/cl-calculation.service.js 356 lines
database/schema.sql                        536 lines
```

**Total:** ~2,805 lines of production code

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -d cognilytics_mis -c "SELECT version();"

# Check TimescaleDB
psql -U postgres -d cognilytics_mis -c "SELECT extversion FROM pg_extension WHERE extname='timescaledb';"
```

### JWT Token Issues

```javascript
// Decode token without verification (debugging)
import { decodeToken } from './src/auth/jwt.js';

const decoded = decodeToken(token);
console.log('Token payload:', decoded);
console.log('Expires at:', new Date(decoded.exp * 1000));
```

### CL Calculation Issues

```javascript
// Enable validation
import { validateMeasurementData } from './services/cl-calculation.service.js';

const validation = validateMeasurementData(data);
if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
}
```

---

## Changelog

### Version 1.0.0 (2025-12-08)

**Initial Implementation:**
- ✅ Authentication system with JWT
- ✅ User management with RBAC
- ✅ Complete CL-Index calculation algorithm
- ✅ Session tracking model
- ✅ Topic management model
- ✅ PostgreSQL + TimescaleDB schema
- ✅ Environment configuration
- ✅ Error handling & validation

---

## License

Copyright © 2024 CogniLytics MIS

---

**End of Documentation**
