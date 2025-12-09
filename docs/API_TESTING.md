# API Testing Guide - CogniLytics MIS

## Complete Test Scenarios for All Implemented Endpoints

---

## Base Configuration

**Base URL:** `http://localhost:3000`

**Headers (for authenticated requests):**
```json
{
    "Authorization": "Bearer YOUR_ACCESS_TOKEN",
    "Content-Type": "application/json"
}
```

---

## Test Scenario 1: User Registration & Authentication Flow

### 1.1 Register New Student

**Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
    "email": "student1@cognilytics.com",
    "password": "StudentPass123",
    "first_name": "Alice",
    "last_name": "Johnson",
    "role": "student"
}
```

**Expected Response (201):**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "student1@cognilytics.com",
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

**Save:** `accessToken` and `refreshToken` for next tests

### 1.2 Register Teacher

**Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
    "email": "teacher1@cognilytics.com",
    "password": "TeacherPass123",
    "first_name": "Bob",
    "last_name": "Smith",
    "role": "teacher"
}
```

### 1.3 Register Admin

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

### 1.4 Login with Student Account

**Request:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
    "email": "student1@cognilytics.com",
    "password": "StudentPass123"
}
```

**Expected Response (200):**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "student1@cognilytics.com",
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

---

## Test Scenario 2: Profile Management

### 2.1 Get Current User Profile

**Request:**
```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response (200):**
```json
{
    "success": true,
    "data": {
        "user": {
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "student1@cognilytics.com",
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

### 2.2 Update Profile

**Request:**
```http
PUT http://localhost:3000/api/auth/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
    "first_name": "Alicia",
    "last_name": "Johnson-Smith"
}
```

**Expected Response (200):**
```json
{
    "success": true,
    "message": "Profile updated successfully",
    "data": {
        "user": {
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "email": "student1@cognilytics.com",
            "first_name": "Alicia",
            "last_name": "Johnson-Smith",
            "role": "student",
            "institution_id": null
        }
    }
}
```

### 2.3 Change Password

**Request:**
```http
POST http://localhost:3000/api/auth/change-password
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
    "current_password": "StudentPass123",
    "new_password": "NewStudentPass456"
}
```

**Expected Response (200):**
```json
{
    "success": true,
    "message": "Password changed successfully"
}
```

---

## Test Scenario 3: Token Refresh

### 3.1 Refresh Access Token

**Request:**
```http
POST http://localhost:3000/api/auth/refresh
Content-Type: application/json

{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response (200):**
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

---

## Test Scenario 4: Error Cases

### 4.1 Register with Duplicate Email

**Request:**
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
    "email": "student1@cognilytics.com",
    "password": "AnotherPass123",
    "first_name": "Duplicate",
    "last_name": "User",
    "role": "student"
}
```

**Expected Response (409):**
```json
{
    "success": false,
    "message": "Email already registered"
}
```

### 4.2 Login with Wrong Password

**Request:**
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
    "email": "student1@cognilytics.com",
    "password": "WrongPassword"
}
```

**Expected Response (401):**
```json
{
    "success": false,
    "message": "Invalid email or password"
}
```

### 4.3 Access Protected Route Without Token

**Request:**
```http
GET http://localhost:3000/api/auth/me
```

**Expected Response (401):**
```json
{
    "success": false,
    "message": "Authentication required. No token provided."
}
```

### 4.4 Invalid Password Format

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

**Expected Response (400):**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "msg": "Password must be at least 8 characters long",
            "param": "password"
        },
        {
            "msg": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
            "param": "password"
        }
    ]
}
```

### 4.5 Expired Access Token

**Request:**
```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer EXPIRED_TOKEN
```

**Expected Response (401):**
```json
{
    "success": false,
    "message": "Token has expired. Please login again."
}
```

---

## Test Scenario 5: Logout

### 5.1 Logout User

**Request:**
```http
POST http://localhost:3000/api/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response (200):**
```json
{
    "success": true,
    "message": "Logout successful. Please clear your tokens."
}
```

**Note:** Client should delete stored tokens after logout.

---

## Postman Collection

### Import this collection into Postman:

```json
{
    "info": {
        "name": "CogniLytics MIS API",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        {
            "key": "baseUrl",
            "value": "http://localhost:3000"
        },
        {
            "key": "accessToken",
            "value": ""
        },
        {
            "key": "refreshToken",
            "value": ""
        }
    ],
    "item": [
        {
            "name": "Auth",
            "item": [
                {
                    "name": "Register Student",
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "if (pm.response.code === 201) {",
                                    "    var jsonData = pm.response.json();",
                                    "    pm.collectionVariables.set('accessToken', jsonData.data.accessToken);",
                                    "    pm.collectionVariables.set('refreshToken', jsonData.data.refreshToken);",
                                    "}"
                                ]
                            }
                        }
                    ],
                    "request": {
                        "method": "POST",
                        "header": [],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n    \"email\": \"student1@cognilytics.com\",\n    \"password\": \"StudentPass123\",\n    \"first_name\": \"Alice\",\n    \"last_name\": \"Johnson\",\n    \"role\": \"student\"\n}",
                            "options": {
                                "raw": {
                                    "language": "json"
                                }
                            }
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/register",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "register"]
                        }
                    }
                },
                {
                    "name": "Login",
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "if (pm.response.code === 200) {",
                                    "    var jsonData = pm.response.json();",
                                    "    pm.collectionVariables.set('accessToken', jsonData.data.accessToken);",
                                    "    pm.collectionVariables.set('refreshToken', jsonData.data.refreshToken);",
                                    "}"
                                ]
                            }
                        }
                    ],
                    "request": {
                        "method": "POST",
                        "header": [],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n    \"email\": \"student1@cognilytics.com\",\n    \"password\": \"StudentPass123\"\n}",
                            "options": {
                                "raw": {
                                    "language": "json"
                                }
                            }
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/login",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "login"]
                        }
                    }
                },
                {
                    "name": "Get Profile",
                    "request": {
                        "method": "GET",
                        "header": [
                            {
                                "key": "Authorization",
                                "value": "Bearer {{accessToken}}"
                            }
                        ],
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/me",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "me"]
                        }
                    }
                },
                {
                    "name": "Update Profile",
                    "request": {
                        "method": "PUT",
                        "header": [
                            {
                                "key": "Authorization",
                                "value": "Bearer {{accessToken}}"
                            }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n    \"first_name\": \"Alicia\",\n    \"last_name\": \"Johnson-Smith\"\n}",
                            "options": {
                                "raw": {
                                    "language": "json"
                                }
                            }
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/profile",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "profile"]
                        }
                    }
                },
                {
                    "name": "Change Password",
                    "request": {
                        "method": "POST",
                        "header": [
                            {
                                "key": "Authorization",
                                "value": "Bearer {{accessToken}}"
                            }
                        ],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n    \"current_password\": \"StudentPass123\",\n    \"new_password\": \"NewStudentPass456\"\n}",
                            "options": {
                                "raw": {
                                    "language": "json"
                                }
                            }
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/change-password",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "change-password"]
                        }
                    }
                },
                {
                    "name": "Refresh Token",
                    "event": [
                        {
                            "listen": "test",
                            "script": {
                                "exec": [
                                    "if (pm.response.code === 200) {",
                                    "    var jsonData = pm.response.json();",
                                    "    pm.collectionVariables.set('accessToken', jsonData.data.accessToken);",
                                    "    pm.collectionVariables.set('refreshToken', jsonData.data.refreshToken);",
                                    "}"
                                ]
                            }
                        }
                    ],
                    "request": {
                        "method": "POST",
                        "header": [],
                        "body": {
                            "mode": "raw",
                            "raw": "{\n    \"refreshToken\": \"{{refreshToken}}\"\n}",
                            "options": {
                                "raw": {
                                    "language": "json"
                                }
                            }
                        },
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/refresh",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "refresh"]
                        }
                    }
                },
                {
                    "name": "Logout",
                    "request": {
                        "method": "POST",
                        "header": [
                            {
                                "key": "Authorization",
                                "value": "Bearer {{accessToken}}"
                            }
                        ],
                        "url": {
                            "raw": "{{baseUrl}}/api/auth/logout",
                            "host": ["{{baseUrl}}"],
                            "path": ["api", "auth", "logout"]
                        }
                    }
                }
            ]
        }
    ]
}
```

---

## cURL Test Scripts

### Bash Script for Complete Test Flow

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "=== CogniLytics MIS API Tests ==="
echo

# 1. Register Student
echo "1. Registering student..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.student@cognilytics.com",
    "password": "TestPass123",
    "first_name": "Test",
    "last_name": "Student",
    "role": "student"
  }')

echo "$REGISTER_RESPONSE" | jq .
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.refreshToken')
echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo

# 2. Get Profile
echo "2. Getting profile..."
curl -s "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
echo

# 3. Update Profile
echo "3. Updating profile..."
curl -s -X PUT "$BASE_URL/api/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "last_name": "Name"
  }' | jq .
echo

# 4. Refresh Token
echo "4. Refreshing token..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

echo "$REFRESH_RESPONSE" | jq .
NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.data.accessToken')
echo "New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
echo

# 5. Logout
echo "5. Logging out..."
curl -s -X POST "$BASE_URL/api/auth/logout" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN" | jq .
echo

echo "=== Tests Complete ==="
```

**To run:**
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## HTTP Client (VS Code REST Client)

Create a file `api-tests.http`:

```http
### Variables
@baseUrl = http://localhost:3000
@accessToken =

### 1. Register Student
POST {{baseUrl}}/api/auth/register HTTP/1.1
Content-Type: application/json

{
    "email": "student@test.com",
    "password": "TestPass123",
    "first_name": "Test",
    "last_name": "Student",
    "role": "student"
}

### 2. Login
POST {{baseUrl}}/api/auth/login HTTP/1.1
Content-Type: application/json

{
    "email": "student@test.com",
    "password": "TestPass123"
}

### 3. Get Profile
GET {{baseUrl}}/api/auth/me HTTP/1.1
Authorization: Bearer {{accessToken}}

### 4. Update Profile
PUT {{baseUrl}}/api/auth/profile HTTP/1.1
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
    "first_name": "Updated",
    "last_name": "Name"
}

### 5. Change Password
POST {{baseUrl}}/api/auth/change-password HTTP/1.1
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
    "current_password": "TestPass123",
    "new_password": "NewPass456"
}

### 6. Logout
POST {{baseUrl}}/api/auth/logout HTTP/1.1
Authorization: Bearer {{accessToken}}
```

---

## Automated Testing with Jest

### Example Test File

```javascript
// tests/auth.test.js
import request from 'supertest';
import app from '../src/server.js';

describe('Authentication API', () => {
    let accessToken;
    let refreshToken;

    test('POST /api/auth/register - Create new user', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: `test${Date.now()}@example.com`,
                password: 'TestPass123',
                first_name: 'Test',
                last_name: 'User',
                role: 'student'
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');

        accessToken = response.body.data.accessToken;
        refreshToken = response.body.data.refreshToken;
    });

    test('GET /api/auth/me - Get profile', async () => {
        const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toHaveProperty('email');
    });

    test('POST /api/auth/refresh - Refresh token', async () => {
        const response = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('accessToken');
    });
});
```

**Run tests:**
```bash
npm test
```

---

## Status Code Reference

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | OK | Successful GET, PUT, POST |
| 201 | Created | Successful registration |
| 400 | Bad Request | Validation error, invalid data |
| 401 | Unauthorized | Missing/invalid token, wrong password |
| 403 | Forbidden | Account deactivated, insufficient permissions |
| 409 | Conflict | Duplicate email, resource already exists |
| 500 | Internal Server Error | Database error, unexpected error |

---

## Next Steps

Once measurements, quizzes, and other endpoints are implemented, add tests for:
- Session management
- CL measurements
- Quiz creation and attempts
- Teacher analytics
- Admin operations

---

**Happy Testing! 🧪**
