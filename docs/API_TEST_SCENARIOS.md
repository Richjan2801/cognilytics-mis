# CogniLytics MIS - API Test Scenarios

**Complete Testing Guide with Expected Results**

Last Updated: 2025-12-08

---

## 📋 Table of Contents

1. [Setup & Prerequisites](#setup--prerequisites)
2. [Authentication APIs](#authentication-apis)
3. [Expected Database State](#expected-database-state)
4. [Error Scenarios](#error-scenarios)
5. [Testing Checklist](#testing-checklist)

---

## Setup & Prerequisites

### Base URL
```
http://localhost:3000
```

### Required Tools
- cURL, Postman, or any HTTP client
- Database running: `docker-compose up database -d`
- Backend running: `cd backend && npm run dev`

### Test Data Variables
```javascript
// Save these after tests
let studentAccessToken = "";
let studentRefreshToken = "";
let studentUserId = "";

let teacherAccessToken = "";
let teacherUserId = "";

let adminAccessToken = "";
let adminUserId = "";
```

---

## Authentication APIs

### TEST 1: Register Student

**Endpoint:** `POST /api/auth/register`

**Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
    "email": "alice.student@cognilytics.com",
    "password": "StudentPass123",
    "first_name": "Alice",
    "last_name": "Johnson",
    "role": "student"
}
```

**Expected Response (201 Created):**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "alice.student@cognilytics.com",
            "first_name": "Alice",
            "last_name": "Johnson",
            "role": "student",
            "institution_id": null
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAwIiwiZW1haWwiOiJhbGljZS5zdHVkZW50QGNvZ25pbHl0aWNzLmNvbSIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzAyMDQwNDAwLCJleHAiOjE3MDIxMjY4MDB9.xyz...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Expected Database State:**
```sql
-- Check in database
SELECT user_id, email, first_name, last_name, role, is_active, created_at
FROM users
WHERE email = 'alice.student@cognilytics.com';

-- Expected Result:
user_id                              | email                           | first_name | last_name | role    | is_active | created_at
550e8400-e29b-41d4-a716-446655440000 | alice.student@cognilytics.com  | Alice      | Johnson   | student | true      | 2024-12-08 10:00:00

-- Password should be hashed (bcrypt)
SELECT password_hash FROM users WHERE email = 'alice.student@cognilytics.com';
-- Expected: $2b$10$... (60 character bcrypt hash)
```

**Save for later:**
```javascript
studentAccessToken = data.accessToken;
studentRefreshToken = data.refreshToken;
studentUserId = data.user.user_id;
```

**cURL Command:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.student@cognilytics.com",
    "password": "StudentPass123",
    "first_name": "Alice",
    "last_name": "Johnson",
    "role": "student"
  }'
```

---

### TEST 2: Register Teacher

**Endpoint:** `POST /api/auth/register`

**Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
    "email": "bob.teacher@cognilytics.com",
    "password": "TeacherPass123",
    "first_name": "Bob",
    "last_name": "Smith",
    "role": "teacher"
}
```

**Expected Response (201 Created):**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "user_id": "660e8400-e29b-41d4-a716-446655440001",
            "email": "bob.teacher@cognilytics.com",
            "first_name": "Bob",
            "last_name": "Smith",
            "role": "teacher",
            "institution_id": null
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Save for later:**
```javascript
teacherAccessToken = data.accessToken;
teacherUserId = data.user.user_id;
```

---

### TEST 3: Register Admin

**Endpoint:** `POST /api/auth/register`

**Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
    "email": "admin@cognilytics.com",
    "password": "AdminPass123",
    "first_name": "Carol",
    "last_name": "Williams",
    "role": "admin"
}
```

**Expected Response (201 Created):**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "user_id": "770e8400-e29b-41d4-a716-446655440002",
            "email": "admin@cognilytics.com",
            "first_name": "Carol",
            "last_name": "Williams",
            "role": "admin",
            "institution_id": null
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Save for later:**
```javascript
adminAccessToken = data.accessToken;
adminUserId = data.user.user_id;
```

---

### TEST 4: Login Student

**Endpoint:** `POST /api/auth/login`

**Request:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
    "email": "alice.student@cognilytics.com",
    "password": "StudentPass123"
}
```

**Expected Response (200 OK):**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "alice.student@cognilytics.com",
            "first_name": "Alice",
            "last_name": "Johnson",
            "role": "student",
            "institution_id": null
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Expected Database State:**
```sql
-- last_login should be updated
SELECT user_id, email, last_login
FROM users
WHERE email = 'alice.student@cognilytics.com';

-- Expected:
user_id                              | email                          | last_login
550e8400-e29b-41d4-a716-446655440000 | alice.student@cognilytics.com | 2024-12-08 10:05:00
-- last_login should be recent (within last few seconds)
```

**cURL Command:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.student@cognilytics.com",
    "password": "StudentPass123"
  }'
```

---

### TEST 5: Get Current User Profile

**Endpoint:** `GET /api/auth/me`

**Request:**
```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer {{studentAccessToken}}
```

**Expected Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "user": {
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "alice.student@cognilytics.com",
            "first_name": "Alice",
            "last_name": "Johnson",
            "role": "student",
            "institution_id": null,
            "is_active": true,
            "created_at": "2024-12-08T10:00:00.000Z",
            "last_login": "2024-12-08T10:05:00.000Z"
        }
    }
}
```

**Expected Database State:**
```sql
-- last_login should be updated again (middleware updates it)
SELECT user_id, email, last_login
FROM users
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- last_login should be the most recent timestamp
```

**cURL Command:**
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### TEST 6: Update Profile

**Endpoint:** `PUT /api/auth/profile`

**Request:**
```http
PUT http://localhost:3000/api/auth/profile
Authorization: Bearer {{studentAccessToken}}
Content-Type: application/json

{
    "first_name": "Alicia",
    "last_name": "Johnson-Smith",
    "email": "alicia.student@cognilytics.com"
}
```

**Expected Response (200 OK):**
```json
{
    "success": true,
    "message": "Profile updated successfully",
    "data": {
        "user": {
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "alicia.student@cognilytics.com",
            "first_name": "Alicia",
            "last_name": "Johnson-Smith",
            "role": "student",
            "institution_id": null
        }
    }
}
```

**Expected Database State:**
```sql
SELECT user_id, email, first_name, last_name, updated_at
FROM users
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Expected:
user_id                              | email                           | first_name | last_name      | updated_at
550e8400-e29b-41d4-a716-446655440000 | alicia.student@cognilytics.com | Alicia     | Johnson-Smith  | 2024-12-08 10:10:00
-- updated_at should be recent
```

**cURL Command:**
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Alicia",
    "last_name": "Johnson-Smith",
    "email": "alicia.student@cognilytics.com"
  }'
```

---

### TEST 7: Change Password

**Endpoint:** `POST /api/auth/change-password`

**Request:**
```http
POST http://localhost:3000/api/auth/change-password
Authorization: Bearer {{studentAccessToken}}
Content-Type: application/json

{
    "current_password": "StudentPass123",
    "new_password": "NewStudentPass456"
}
```

**Expected Response (200 OK):**
```json
{
    "success": true,
    "message": "Password changed successfully"
}
```

**Expected Database State:**
```sql
-- Password hash should be different
SELECT password_hash FROM users
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Should return a NEW bcrypt hash (different from before)
-- Old hash: $2b$10$abc...
-- New hash: $2b$10$xyz...
```

**Verify:** Login should now fail with old password, succeed with new password

**cURL Command:**
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "StudentPass123",
    "new_password": "NewStudentPass456"
  }'
```

---

### TEST 8: Refresh Access Token

**Endpoint:** `POST /api/auth/refresh`

**Request:**
```http
POST http://localhost:3000/api/auth/refresh
Content-Type: application/json

{
    "refreshToken": "{{studentRefreshToken}}"
}
```

**Expected Response (200 OK):**
```json
{
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Expected Behavior:**
- Old access token becomes invalid
- New access token works for authenticated requests
- New refresh token can be used for next refresh

**cURL Command:**
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

### TEST 9: Logout

**Endpoint:** `POST /api/auth/logout`

**Request:**
```http
POST http://localhost:3000/api/auth/logout
Authorization: Bearer {{studentAccessToken}}
```

**Expected Response (200 OK):**
```json
{
    "success": true,
    "message": "Logout successful. Please clear your tokens."
}
```

**Expected Behavior:**
- Client should delete tokens
- Token remains valid on server (stateless JWT)
- For real invalidation, implement token blacklist (future feature)

**cURL Command:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Error Scenarios

### ERROR 1: Duplicate Email Registration

**Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
    "email": "alice.student@cognilytics.com",
    "password": "AnotherPass123",
    "first_name": "Duplicate",
    "last_name": "User",
    "role": "student"
}
```

**Expected Response (409 Conflict):**
```json
{
    "success": false,
    "message": "Email already registered"
}
```

**Expected Database State:**
- No new user created
- Original user unchanged

---

### ERROR 2: Invalid Email Format

**Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
    "email": "not-an-email",
    "password": "ValidPass123",
    "first_name": "Test",
    "last_name": "User",
    "role": "student"
}
```

**Expected Response (400 Bad Request):**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "type": "field",
            "value": "not-an-email",
            "msg": "Valid email is required",
            "path": "email",
            "location": "body"
        }
    ]
}
```

---

### ERROR 3: Weak Password

**Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
    "email": "weak@cognilytics.com",
    "password": "weak",
    "first_name": "Weak",
    "last_name": "Password",
    "role": "student"
}
```

**Expected Response (400 Bad Request):**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "msg": "Password must be at least 8 characters long",
            "param": "password",
            "location": "body"
        },
        {
            "msg": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
            "param": "password",
            "location": "body"
        }
    ]
}
```

---

### ERROR 4: Wrong Password on Login

**Request:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
    "email": "alice.student@cognilytics.com",
    "password": "WrongPassword123"
}
```

**Expected Response (401 Unauthorized):**
```json
{
    "success": false,
    "message": "Invalid email or password"
}
```

**Expected Database State:**
- last_login NOT updated (failed login)

---

### ERROR 5: Non-existent User Login

**Request:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
    "email": "nonexistent@cognilytics.com",
    "password": "AnyPassword123"
}
```

**Expected Response (401 Unauthorized):**
```json
{
    "success": false,
    "message": "Invalid email or password"
}
```

---

### ERROR 6: Missing Authentication Token

**Request:**
```http
GET http://localhost:3000/api/auth/me
```

**Expected Response (401 Unauthorized):**
```json
{
    "success": false,
    "message": "Authentication required. No token provided."
}
```

---

### ERROR 7: Invalid Token Format

**Request:**
```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer invalid-token-format
```

**Expected Response (401 Unauthorized):**
```json
{
    "success": false,
    "message": "Invalid authentication token."
}
```

---

### ERROR 8: Expired Access Token

**Request:**
```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer {{expiredAccessToken}}
```

**Expected Response (401 Unauthorized):**
```json
{
    "success": false,
    "message": "Invalid authentication token."
}
```

**Note:** To test this, you'd need to wait 24 hours or temporarily change `JWT_EXPIRES_IN` to a short duration.

---

### ERROR 9: Invalid Refresh Token

**Request:**
```http
POST http://localhost:3000/api/auth/refresh
Content-Type: application/json

{
    "refreshToken": "invalid.token.here"
}
```

**Expected Response (401 Unauthorized):**
```json
{
    "success": false,
    "message": "Invalid refresh token"
}
```

---

### ERROR 10: Wrong Current Password on Change

**Request:**
```http
POST http://localhost:3000/api/auth/change-password
Authorization: Bearer {{studentAccessToken}}
Content-Type: application/json

{
    "current_password": "WrongPassword",
    "new_password": "NewValidPass123"
}
```

**Expected Response (401 Unauthorized):**
```json
{
    "success": false,
    "message": "Current password is incorrect"
}
```

**Expected Database State:**
- Password NOT changed
- password_hash remains the same

---

### ERROR 11: Email Already Taken (Profile Update)

**Request:**
```http
PUT http://localhost:3000/api/auth/profile
Authorization: Bearer {{studentAccessToken}}
Content-Type: application/json

{
    "email": "bob.teacher@cognilytics.com"
}
```

**Expected Response (409 Conflict):**
```json
{
    "success": false,
    "message": "Email already in use"
}
```

**Expected Database State:**
- Email NOT changed
- User profile unchanged

---

### ERROR 12: Short Name Validation

**Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
    "email": "test@cognilytics.com",
    "password": "ValidPass123",
    "first_name": "A",
    "last_name": "B",
    "role": "student"
}
```

**Expected Response (400 Bad Request):**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "msg": "First name must be between 2 and 50 characters",
            "param": "first_name",
            "location": "body"
        },
        {
            "msg": "Last name must be between 2 and 50 characters",
            "param": "last_name",
            "location": "body"
        }
    ]
}
```

---

### ERROR 13: Invalid Role

**Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
    "email": "test@cognilytics.com",
    "password": "ValidPass123",
    "first_name": "Test",
    "last_name": "User",
    "role": "superuser"
}
```

**Expected Response (400 Bad Request):**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "msg": "Role must be student, teacher, or admin",
            "param": "role",
            "location": "body"
        }
    ]
}
```

---

## Expected Database State

After running all successful tests (TEST 1-9), your database should have:

### Users Table

```sql
SELECT user_id, email, first_name, last_name, role, is_active, created_at
FROM users
ORDER BY created_at;
```

**Expected Result:**
```
user_id                              | email                           | first_name | last_name      | role    | is_active | created_at
-------------------------------------|--------------------------------|------------|----------------|---------|-----------|-------------------------
550e8400-e29b-41d4-a716-446655440000 | alicia.student@cognilytics.com | Alicia     | Johnson-Smith  | student | true      | 2024-12-08 10:00:00
660e8400-e29b-41d4-a716-446655440001 | bob.teacher@cognilytics.com    | Bob        | Smith          | teacher | true      | 2024-12-08 10:01:00
770e8400-e29b-41d4-a716-446655440002 | admin@cognilytics.com          | Carol      | Williams       | admin   | true      | 2024-12-08 10:02:00
```

**Count by Role:**
```sql
SELECT role, COUNT(*) as count FROM users GROUP BY role;
```

**Expected Result:**
```
role    | count
--------|------
student | 1
teacher | 1
admin   | 1
```

---

## Testing Checklist

### ✅ Pre-Test Setup
- [ ] Docker database running: `docker-compose up database -d`
- [ ] Backend server running: `npm run dev`
- [ ] Database initialized: `docker-compose exec database psql -U postgres -d cognilytics_mis -c "\dt"`
- [ ] Environment variables configured in `backend/.env`

### ✅ Authentication Tests
- [ ] TEST 1: Register Student (201)
- [ ] TEST 2: Register Teacher (201)
- [ ] TEST 3: Register Admin (201)
- [ ] TEST 4: Login Student (200)
- [ ] TEST 5: Get Current User Profile (200)
- [ ] TEST 6: Update Profile (200)
- [ ] TEST 7: Change Password (200)
- [ ] TEST 8: Refresh Access Token (200)
- [ ] TEST 9: Logout (200)

### ✅ Error Tests
- [ ] ERROR 1: Duplicate Email (409)
- [ ] ERROR 2: Invalid Email Format (400)
- [ ] ERROR 3: Weak Password (400)
- [ ] ERROR 4: Wrong Password (401)
- [ ] ERROR 5: Non-existent User (401)
- [ ] ERROR 6: Missing Token (401)
- [ ] ERROR 7: Invalid Token (401)
- [ ] ERROR 8: Expired Token (401)
- [ ] ERROR 9: Invalid Refresh Token (401)
- [ ] ERROR 10: Wrong Current Password (401)
- [ ] ERROR 11: Email Already Taken (409)
- [ ] ERROR 12: Short Name (400)
- [ ] ERROR 13: Invalid Role (400)

### ✅ Database Verification
- [ ] Users created successfully
- [ ] Passwords hashed with bcrypt
- [ ] Emails unique in database
- [ ] last_login updated on login
- [ ] updated_at updated on profile change
- [ ] Password hash changed after password change

---

## Quick Test Script

### Bash Script to Run All Tests

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=== CogniLytics MIS API Tests ==="
echo ""

# TEST 1: Register Student
echo "TEST 1: Register Student..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.student@cognilytics.com",
    "password": "StudentPass123",
    "first_name": "Alice",
    "last_name": "Johnson",
    "role": "student"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "201" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Student registered (201)"
    STUDENT_TOKEN=$(echo "$BODY" | jq -r '.data.accessToken')
else
    echo -e "${RED}✗ FAIL${NC} - Expected 201, got $HTTP_CODE"
fi
echo ""

# TEST 2: Login Student
echo "TEST 2: Login Student..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.student@cognilytics.com",
    "password": "StudentPass123"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Login successful (200)"
else
    echo -e "${RED}✗ FAIL${NC} - Expected 200, got $HTTP_CODE"
fi
echo ""

# TEST 3: Get Profile
echo "TEST 3: Get Profile..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Profile retrieved (200)"
else
    echo -e "${RED}✗ FAIL${NC} - Expected 200, got $HTTP_CODE"
fi
echo ""

# ERROR TEST: Duplicate Email
echo "ERROR TEST: Duplicate Email..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.student@cognilytics.com",
    "password": "AnotherPass123",
    "first_name": "Duplicate",
    "last_name": "User",
    "role": "student"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "409" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Duplicate email rejected (409)"
else
    echo -e "${RED}✗ FAIL${NC} - Expected 409, got $HTTP_CODE"
fi
echo ""

echo "=== Tests Complete ==="
```

**Save as:** `test-api.sh`

**Run:**
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Postman Collection Variables

After importing the Postman collection, set these variables:

```javascript
// Collection Variables
{
    "baseUrl": "http://localhost:3000",
    "studentAccessToken": "",
    "studentRefreshToken": "",
    "teacherAccessToken": "",
    "adminAccessToken": ""
}
```

The collection auto-saves tokens after login/register!

---

## Success Criteria

### All Tests Pass If:

1. ✅ All successful endpoints return expected status codes
2. ✅ All error endpoints return correct error status codes
3. ✅ Response bodies match expected JSON structure
4. ✅ Database state matches expected values
5. ✅ Tokens work for authenticated requests
6. ✅ Password changes are persisted
7. ✅ Validation catches all invalid inputs
8. ✅ No 500 errors occur

---

## Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Check database is running
docker-compose ps

# Check logs
docker-compose logs database

# Restart database
docker-compose restart database
```

**401 Unauthorized:**
- Check token is valid
- Check `Authorization: Bearer <token>` format
- Token may have expired

**409 Conflict (Email exists):**
- Email already registered in previous test
- Clear database or use different email

**400 Validation Error:**
- Check all required fields present
- Check password meets requirements (8+ chars, uppercase, lowercase, number)
- Check email format

---

**End of API Test Scenarios**

**Total Tests:** 22 (9 success + 13 error scenarios)
**Estimated Test Time:** 10 minutes
