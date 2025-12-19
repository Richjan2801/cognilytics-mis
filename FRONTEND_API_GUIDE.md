# Frontend Development - API Integration Guide

**Version:** 1.0
**Last Updated:** 2025-12-10
**Base URL:** `http://localhost:3000/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Student Dashboard APIs](#student-dashboard-apis)
3. [Teacher Dashboard APIs](#teacher-dashboard-apis)
4. [Admin Dashboard APIs](#admin-dashboard-apis)
5. [Common Response Format](#common-response-format)
6. [Error Handling](#error-handling)
7. [Authentication Flow](#authentication-flow)

---

## Authentication

### Base URL: `/api/auth`

All authenticated endpoints require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",  // "student" | "teacher" | "admin"
  "institution_id": "uuid-here" // optional
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "student@example.com",
      "role": "student",
      "first_name": "John",
      "last_name": "John"
    },
    "tokens": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_in": 86400
    }
  }
}
```

### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!"
}

Response: (same as register)
```

### 3. Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 4. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your-refresh-token"
}

Response:
{
  "success": true,
  "data": {
    "access_token": "new-jwt-token",
    "expires_in": 86400
  }
}
```

### 5. Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "student@example.com",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-10T12:00:00Z"
  }
}
```

### 6. Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "grade_level": "Grade 10"
}

Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user object */ }
}
```

### 7. Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Student Dashboard APIs

### Learning Sessions

#### 1. Start a Learning Session
```http
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic_id": "uuid",          // optional
  "quiz_id": "uuid",           // optional (at least one required)
  "session_type": "study"      // "quiz" | "study" | "practice" | "review"
}

Response:
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "user_id": "uuid",
    "topic_id": "uuid",
    "session_type": "study",
    "started_at": "2024-01-10T12:00:00Z"
  }
}
```

#### 2. End a Learning Session
```http
PUT /api/sessions/:sessionId/end
Authorization: Bearer <token>
Content-Type: application/json

{
  "duration_seconds": 1800
}

Response:
{
  "success": true,
  "message": "Session ended successfully",
  "data": {
    "session_id": "uuid",
    "duration_seconds": 1800,
    "ended_at": "2024-01-10T12:30:00Z"
  }
}
```

#### 3. Get My Sessions
```http
GET /api/sessions/user/:userId?limit=10&offset=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "sessions": [
      {
        "session_id": "uuid",
        "topic_name": "Algebra Basics",
        "session_type": "study",
        "started_at": "2024-01-10T12:00:00Z",
        "ended_at": "2024-01-10T12:30:00Z",
        "duration_seconds": 1800
      }
    ],
    "pagination": {
      "total": 50,
      "limit": 10,
      "offset": 0,
      "has_more": true
    }
  }
}
```

#### 4. Get Session Details
```http
GET /api/sessions/:sessionId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "user_id": "uuid",
    "topic_id": "uuid",
    "topic_name": "Algebra Basics",
    "session_type": "study",
    "started_at": "2024-01-10T12:00:00Z",
    "ended_at": "2024-01-10T12:30:00Z",
    "duration_seconds": 1800
  }
}
```

### Cognitive Load Measurements

#### 1. Submit CL Measurement
```http
POST /api/measurements
Authorization: Bearer <token>
Content-Type: application/json

{
  "session_id": "uuid",
  "topic_id": "uuid",              // optional

  // Self-Report Component
  "sr_paas_score": 7,               // 1-9
  "sr_nasa_tlx_mental_demand": 75, // 0-100
  "sr_nasa_tlx_effort": 80,         // 0-100
  "sr_nasa_tlx_frustration": 60,   // 0-100

  // Performance Component
  "pf_accuracy": 0.85,              // 0-1
  "pf_response_time_ms": 5000,
  "pf_correct_count": 17,
  "pf_total_count": 20,

  // Behavioral Component
  "bh_hint_requests": 3,
  "bh_page_revisits": 5,
  "bh_pause_duration_ms": 30000,
  "bh_pause_count": 2,
  "bh_answer_changes": 4
}

Response:
{
  "success": true,
  "data": {
    "measurement_id": "uuid",
    "cl_index": 0.68,
    "cl_category": "high",           // "low" | "optimal" | "high" | "overload"
    "measured_at": "2024-01-10T12:15:00Z",
    "components": {
      "sr_normalized": 0.72,
      "pf_normalized": 0.65,
      "bh_normalized": 0.68,
      "ph_normalized": 0.00
    }
  }
}
```

#### 2. Get My CL History
```http
GET /api/measurements/user/:userId?limit=50&offset=0&days=30
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "measurements": [
      {
        "measurement_id": "uuid",
        "session_id": "uuid",
        "topic_name": "Algebra",
        "cl_index": 0.68,
        "cl_category": "high",
        "measured_at": "2024-01-10T12:15:00Z"
      }
    ],
    "statistics": {
      "avg_cl": 0.55,
      "min_cl": 0.23,
      "max_cl": 0.87,
      "total_measurements": 45
    },
    "pagination": {
      "total": 45,
      "limit": 50,
      "offset": 0,
      "has_more": false
    }
  }
}
```

#### 3. Get My CL Statistics
```http
GET /api/measurements/user/:userId/stats?days=30
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "overall": {
      "avg_cl": 0.55,
      "total_measurements": 45,
      "distribution": {
        "low": 10,
        "optimal": 20,
        "high": 12,
        "overload": 3
      }
    },
    "by_topic": [
      {
        "topic_id": "uuid",
        "topic_name": "Algebra",
        "avg_cl": 0.62,
        "measurement_count": 15
      }
    ],
    "trend": [
      {
        "date": "2024-01-10",
        "avg_cl": 0.58,
        "count": 5
      }
    ]
  }
}
```

### Topics & Materials

#### 1. Get Available Topics
```http
GET /api/topics?limit=20&offset=0&subject=Mathematics&difficulty_level=2
Authorization: Bearer <token>

Query Parameters:
  - subject (optional): Filter by subject
  - difficulty_level (optional): 1-5
  - teacher_id (optional): Filter by teacher
  - limit: default 20
  - offset: default 0

Response:
{
  "success": true,
  "data": {
    "topics": [
      {
        "topic_id": "uuid",
        "name": "Algebra Basics",
        "description": "Introduction to algebraic concepts",
        "subject": "Mathematics",
        "difficulty_level": 2,
        "teacher_name": "Dr. Smith",
        "estimated_duration_mins": 60
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "has_more": true
    }
  }
}
```

#### 2. Get Topic Details
```http
GET /api/topics/:topicId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "topic_id": "uuid",
    "name": "Algebra Basics",
    "description": "Detailed description...",
    "subject": "Mathematics",
    "grade_level": "Grade 10",
    "difficulty_level": 2,
    "teacher_id": "uuid",
    "teacher_name": "Dr. Smith",
    "estimated_duration_mins": 60,
    "learning_objectives": ["Objective 1", "Objective 2"],
    "prerequisites": ["Basic Math"],
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Quizzes

#### 1. Get Available Quizzes
```http
GET /api/quizzes?topic_id=uuid&limit=10&offset=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "quizzes": [
      {
        "quiz_id": "uuid",
        "title": "Algebra Quiz 1",
        "description": "Test your knowledge...",
        "topic_id": "uuid",
        "topic_name": "Algebra Basics",
        "time_limit_mins": 30,
        "passing_score": 70.00,
        "total_points": 100,
        "question_count": 20,
        "is_active": true
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 10,
      "offset": 0,
      "has_more": true
    }
  }
}
```

#### 2. Get Quiz Details
```http
GET /api/quizzes/:quizId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "quiz_id": "uuid",
    "title": "Algebra Quiz 1",
    "description": "Test your knowledge...",
    "topic_id": "uuid",
    "time_limit_mins": 30,
    "passing_score": 70.00,
    "total_points": 100,
    "question_count": 20,
    "settings": {
      "randomize_questions": true,
      "show_correct_answers": false,
      "max_attempts": 3
    }
  }
}
```

#### 3. Get Quiz Questions
```http
GET /api/quizzes/:quizId/questions
Authorization: Bearer <token>

Note: Does NOT include correct answers (for students)

Response:
{
  "success": true,
  "data": {
    "questions": [
      {
        "question_id": "uuid",
        "question_text": "What is 2 + 2?",
        "question_type": "multiple_choice",
        "options": ["2", "3", "4", "5"],
        "points": 5,
        "order_index": 1,
        "hints": ["Think about basic addition"]
      }
    ]
  }
}
```

#### 4. Start Quiz Attempt
```http
POST /api/quizzes/:quizId/attempts
Authorization: Bearer <token>
Content-Type: application/json

{
  "session_id": "uuid"  // optional
}

Response:
{
  "success": true,
  "data": {
    "attempt_id": "uuid",
    "quiz_id": "uuid",
    "user_id": "uuid",
    "started_at": "2024-01-10T12:00:00Z",
    "is_completed": false
  }
}
```

#### 5. Submit Quiz Attempt
```http
PUT /api/quizzes/attempts/:attemptId/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "answers": {
    "question-uuid-1": "4",
    "question-uuid-2": "Option B",
    "question-uuid-3": "True"
  }
}

Response:
{
  "success": true,
  "data": {
    "attempt_id": "uuid",
    "score": 85.50,
    "max_score": 100,
    "accuracy": 0.85,
    "passed": true,
    "submitted_at": "2024-01-10T12:25:00Z",
    "time_taken_seconds": 1500,
    "answers": {
      "question-uuid-1": {
        "answer": "4",
        "is_correct": true,
        "points_earned": 5
      }
    }
  }
}
```

#### 6. Get My Quiz Attempts
```http
GET /api/quizzes/attempts/user/:userId?quiz_id=uuid&limit=10&offset=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "attempts": [
      {
        "attempt_id": "uuid",
        "quiz_id": "uuid",
        "quiz_title": "Algebra Quiz 1",
        "started_at": "2024-01-10T12:00:00Z",
        "submitted_at": "2024-01-10T12:25:00Z",
        "score": 85.50,
        "max_score": 100,
        "passed": true,
        "is_completed": true
      }
    ],
    "pagination": {
      "total": 8,
      "limit": 10,
      "offset": 0,
      "has_more": false
    }
  }
}
```

### Reports (Student)

#### 1. Get My Detailed Report
```http
GET /api/reports/student/:studentId?days=30
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "student": {
      "user_id": "uuid",
      "name": "John Doe",
      "email": "student@example.com",
      "enrolled_since": "2024-01-01T00:00:00Z"
    },
    "time_range_days": 30,
    "cognitive_load": {
      "statistics": {
        "total_measurements": 45,
        "avg_cl": "0.55",
        "min_cl": "0.23",
        "max_cl": "0.87",
        "stddev_cl": "0.15",
        "distribution": {
          "low": 10,
          "optimal": 20,
          "high": 12,
          "overload": 3
        }
      },
      "trends": [
        {
          "date": "2024-01-10",
          "avg_cl": "0.58",
          "min_cl": "0.45",
          "max_cl": "0.72",
          "measurement_count": 5
        }
      ]
    },
    "topic_performance": [
      {
        "topic_id": "uuid",
        "topic_name": "Algebra Basics",
        "subject": "Mathematics",
        "difficulty_level": 2,
        "session_count": 8,
        "avg_cl": "0.62",
        "overload_count": 2,
        "avg_session_duration": "45.5"
      }
    ],
    "quiz_performance": [
      {
        "quiz_id": "uuid",
        "quiz_title": "Algebra Quiz 1",
        "attempts": 3,
        "avg_score": "82.33",
        "best_score": "92.00",
        "passed_count": 2
      }
    ],
    "session_stats": {
      "total_sessions": 25,
      "avg_duration": "42.50",
      "total_duration": "1062.50",
      "unique_topics": 5
    }
  }
}
```

---

## Teacher Dashboard APIs

### Overview Dashboard

#### 1. Get Teacher Dashboard
```http
GET /api/teacher/dashboard
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "students": {
      "total": 45
    },
    "topics": {
      "total": 12,
      "active": 10
    },
    "sessions": {
      "recent_7_days": 120
    },
    "cognitive_load": {
      "avg_cl_index": "0.58",
      "total_measurements": 450,
      "distribution": {
        "low": 90,
        "optimal": 220,
        "high": 110,
        "overload": 30
      }
    },
    "quizzes": {
      "total": 15,
      "attempts_30_days": 380,
      "avg_score": "76.50",
      "pass_rate": "82.50"
    }
  }
}
```

### Student Management

#### 1. Get My Students
```http
GET /api/teacher/students?limit=50&offset=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "students": [
      {
        "user_id": "uuid",
        "first_name": "John",
        "last_name": "Doe",
        "email": "student@example.com",
        "enrolled_at": "2024-01-01T00:00:00Z",
        "session_count": 25,
        "quiz_attempts": 15,
        "avg_cl_30days": "0.55",
        "latest_cl_category": "optimal"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 50,
      "offset": 0,
      "has_more": false
    }
  }
}
```

#### 2. Get At-Risk Students
```http
GET /api/teacher/at-risk-students?threshold=0.7&days=7
Authorization: Bearer <token>

Query Parameters:
  - threshold: CL threshold (default 0.7)
  - days: Time range (default 7)

Response:
{
  "success": true,
  "data": {
    "threshold": 0.7,
    "time_range_days": 7,
    "summary": {
      "total_at_risk": 8,
      "critical": 2,
      "high": 3,
      "warning": 2,
      "monitor": 1
    },
    "at_risk_students": [
      {
        "user_id": "uuid",
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@example.com",
        "avg_cl": "0.82",
        "max_cl": "0.95",
        "measurement_count": 12,
        "overload_count": 5,
        "high_cl_count": 8,
        "last_measurement": "2024-01-10T12:00:00Z",
        "struggling_topics": ["Algebra Basics", "Geometry"],
        "risk_level": "critical"
      }
    ]
  }
}
```

### Analytics

#### 1. Get Class-Wide Analytics
```http
GET /api/teacher/class-analytics?days=30
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "time_range_days": 30,
    "overall_stats": {
      "avg_cl": "0.58",
      "stddev_cl": "0.15",
      "min_cl": "0.23",
      "max_cl": "0.92",
      "active_students": 42,
      "total_measurements": 450
    },
    "cl_trends": [
      {
        "date": "2024-01-10",
        "avg_cl": "0.60",
        "measurement_count": 45,
        "overload_count": 3
      }
    ],
    "topic_performance": [
      {
        "topic_id": "uuid",
        "topic_name": "Algebra Basics",
        "subject": "Mathematics",
        "session_count": 85,
        "student_count": 38,
        "avg_cl": "0.62",
        "overload_rate": "8.50"
      }
    ]
  }
}
```

#### 2. Get Topic-Specific Analytics
```http
GET /api/teacher/topic/:topicId/analytics
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "topic": {
      "topic_id": "uuid",
      "name": "Algebra Basics",
      "subject": "Mathematics",
      "difficulty_level": 2
    },
    "statistics": {
      "total_sessions": 85,
      "unique_students": 38,
      "avg_session_duration": "45.50",
      "quiz_count": 3,
      "avg_cl": "0.62",
      "cl_distribution": {
        "low": 15,
        "optimal": 40,
        "high": 25,
        "overload": 5
      }
    },
    "student_performance": [
      {
        "user_id": "uuid",
        "first_name": "John",
        "last_name": "Doe",
        "session_count": 3,
        "avg_cl": "0.55",
        "last_activity": "2024-01-10T12:00:00Z",
        "overload_count": 0
      }
    ],
    "cl_trends": [
      {
        "date": "2024-01-10",
        "avg_cl": "0.58",
        "measurement_count": 8
      }
    ]
  }
}
```

### Topic Management

#### 1. Create Topic
```http
POST /api/topics
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Advanced Algebra",
  "description": "Complex algebraic concepts",
  "subject": "Mathematics",
  "grade_level": "Grade 11",
  "difficulty_level": 4,
  "estimated_duration_mins": 90,
  "learning_objectives": ["Objective 1", "Objective 2"],
  "prerequisites": ["Algebra Basics"]
}

Response:
{
  "success": true,
  "data": {
    "topic_id": "uuid",
    "name": "Advanced Algebra",
    "teacher_id": "uuid",
    "created_at": "2024-01-10T12:00:00Z"
  }
}
```

#### 2. Update Topic
```http
PUT /api/topics/:topicId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Advanced Algebra - Updated",
  "description": "Updated description",
  "is_active": true
}

Response:
{
  "success": true,
  "message": "Topic updated successfully",
  "data": { /* updated topic */ }
}
```

#### 3. Delete Topic
```http
DELETE /api/topics/:topicId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Topic deleted successfully"
}
```

### Quiz Management

#### 1. Create Quiz
```http
POST /api/quizzes
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic_id": "uuid",
  "title": "Algebra Final Exam",
  "description": "Comprehensive algebra test",
  "time_limit_mins": 60,
  "passing_score": 75.00,
  "total_points": 100,
  "settings": {
    "randomize_questions": true,
    "show_correct_answers": true,
    "max_attempts": 2
  }
}

Response:
{
  "success": true,
  "data": {
    "quiz_id": "uuid",
    "title": "Algebra Final Exam",
    "created_by": "uuid",
    "created_at": "2024-01-10T12:00:00Z"
  }
}
```

#### 2. Add Question to Quiz
```http
POST /api/quizzes/:quizId/questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "question_text": "What is 5 × 7?",
  "question_type": "multiple_choice",
  "options": ["30", "35", "40", "42"],
  "correct_answer": "35",
  "points": 5,
  "order_index": 1,
  "explanation": "5 times 7 equals 35",
  "hints": ["Use multiplication table"]
}

Response:
{
  "success": true,
  "data": {
    "question_id": "uuid",
    "quiz_id": "uuid",
    "created_at": "2024-01-10T12:00:00Z"
  }
}
```

#### 3. Update Question
```http
PUT /api/quizzes/questions/:questionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "question_text": "Updated question?",
  "points": 10
}

Response:
{
  "success": true,
  "message": "Question updated successfully"
}
```

#### 4. Delete Question
```http
DELETE /api/quizzes/questions/:questionId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Question deleted successfully"
}
```

#### 5. Get Quiz Attempts
```http
GET /api/quizzes/:quizId/attempts?limit=50&offset=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "attempts": [
      {
        "attempt_id": "uuid",
        "user_id": "uuid",
        "student_name": "John Doe",
        "started_at": "2024-01-10T12:00:00Z",
        "submitted_at": "2024-01-10T12:45:00Z",
        "score": 85.00,
        "max_score": 100,
        "passed": true
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 50,
      "offset": 0,
      "has_more": false
    }
  }
}
```

### Reports (Teacher)

#### 1. Get Topic Report
```http
GET /api/reports/topic/:topicId?days=30
Authorization: Bearer <token>

Response: (Similar structure to topic analytics but with more detailed reporting)
```

#### 2. Get Class Report
```http
GET /api/reports/class/:teacherId?days=30
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "teacher": {
      "user_id": "uuid",
      "name": "Dr. Smith",
      "email": "teacher@example.com"
    },
    "time_range_days": 30,
    "class_statistics": {
      "total_students": 45,
      "total_sessions": 450,
      "avg_session_duration": "42.50",
      "total_topics": 12,
      "avg_cl": "0.58",
      "total_measurements": 450,
      "overload_rate": "6.67"
    },
    "student_summary": [ /* array of student stats */ ],
    "topic_breakdown": [ /* array of topic stats */ ],
    "daily_trends": [ /* daily CL trends */ ]
  }
}
```

---

## Admin Dashboard APIs

### Overview

#### 1. Get Admin Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "users": {
      "total": 523,
      "students": 450,
      "teachers": 68,
      "admins": 5,
      "active": 498,
      "new_7days": 12
    },
    "topics": {
      "total": 85,
      "active": 78,
      "unique_subjects": 12,
      "teachers_with_topics": 62
    },
    "quizzes": {
      "total": 145,
      "active": 132,
      "total_attempts": 4580,
      "avg_score": "74.50"
    },
    "sessions": {
      "total": 8520,
      "recent_7days": 520,
      "avg_duration": "38.75",
      "unique_users": 445
    },
    "cognitive_load": {
      "total_measurements": 12450,
      "avg_cl_index": "0.56",
      "measurements_24h": 450,
      "distribution": {
        "low": 2850,
        "optimal": 6200,
        "high": 2800,
        "overload": 600
      }
    }
  }
}
```

### User Management

#### 1. Get All Users
```http
GET /api/admin/users?role=student&is_active=true&limit=100&offset=0
Authorization: Bearer <token>

Query Parameters:
  - role (optional): "student" | "teacher" | "admin"
  - is_active (optional): "true" | "false"
  - limit: default 100
  - offset: default 0

Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "user_id": "uuid",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "role": "student",
        "is_active": true,
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": "2024-01-10T12:00:00Z",
        "session_count": 25,
        "quiz_attempt_count": 15,
        "avg_cl": "0.55"
      }
    ],
    "pagination": {
      "total": 450,
      "limit": 100,
      "offset": 0,
      "has_more": true
    }
  }
}
```

#### 2. Activate User
```http
POST /api/admin/users/:userId/activate
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "User activated successfully"
}
```

#### 3. Deactivate User
```http
POST /api/admin/users/:userId/deactivate
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "User deactivated successfully"
}
```

### System Statistics

#### 1. Get System Stats
```http
GET /api/admin/system-stats?days=30
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "time_range_days": 30,
    "daily_active_users": [
      {
        "date": "2024-01-10",
        "active_users": 145
      }
    ],
    "daily_sessions": [
      {
        "date": "2024-01-10",
        "session_count": 285,
        "unique_users": 142,
        "avg_duration": "42.50"
      }
    ],
    "daily_quizzes": [
      {
        "date": "2024-01-10",
        "quiz_attempts": 158,
        "avg_score": "76.30",
        "pass_rate": "83.50"
      }
    ],
    "database_stats": {
      "users": 523,
      "topics": 85,
      "sessions": 8520,
      "measurements": 12450,
      "quizzes": 145,
      "questions": 2850,
      "quiz_attempts": 4580
    }
  }
}
```

#### 2. Get CL Trends
```http
GET /api/admin/cl-trends?days=30
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "time_range_days": 30,
    "overall_stats": {
      "avg_cl": "0.56",
      "stddev_cl": "0.18",
      "total_measurements": 12450,
      "unique_students": 442,
      "overload_rate": "4.82"
    },
    "daily_trends": [
      {
        "date": "2024-01-10",
        "avg_cl": "0.58",
        "min_cl": "0.15",
        "max_cl": "0.95",
        "stddev_cl": "0.17",
        "measurement_count": 450,
        "low_count": 95,
        "optimal_count": 220,
        "high_count": 110,
        "overload_count": 25
      }
    ],
    "subject_distribution": [
      {
        "subject": "Mathematics",
        "measurement_count": 4500,
        "avg_cl": "0.62",
        "overload_rate": "7.50"
      }
    ],
    "difficulty_distribution": [
      {
        "difficulty_level": 1,
        "measurement_count": 2800,
        "avg_cl": "0.45",
        "overload_rate": "2.30"
      },
      {
        "difficulty_level": 5,
        "measurement_count": 1200,
        "avg_cl": "0.72",
        "overload_rate": "12.50"
      }
    ]
  }
}
```

---

## Common Response Format

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "detail": "Additional error details (optional)",
  "errors": [ /* validation errors array (optional) */ ]
}
```

### Pagination
```json
{
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

### Common Error Messages

```json
// Validation Error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}

// Authentication Error
{
  "success": false,
  "message": "Invalid or expired token"
}

// Authorization Error
{
  "success": false,
  "message": "Access denied. Teachers only."
}

// Not Found Error
{
  "success": false,
  "message": "Topic not found"
}
```

---

## Authentication Flow

### 1. Registration/Login Flow
```
1. POST /api/auth/register OR POST /api/auth/login
   ↓
2. Store tokens in localStorage/sessionStorage
   - access_token (expires in 24h)
   - refresh_token (expires in 7 days)
   ↓
3. Include access_token in all requests:
   Authorization: Bearer <access_token>
```

### 2. Token Refresh Flow
```
1. When access_token expires (401 error)
   ↓
2. POST /api/auth/refresh with refresh_token
   ↓
3. Store new access_token
   ↓
4. Retry failed request with new token
```

### 3. Logout Flow
```
1. POST /api/auth/logout
   ↓
2. Clear stored tokens
   ↓
3. Redirect to login page
```

---

## Frontend Implementation Tips

### 1. API Client Setup (Axios Example)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', {
            refresh_token: refreshToken
          });
          localStorage.setItem('access_token', data.data.access_token);
          // Retry original request
          return api(error.config);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

### 2. Role-Based Routing
```javascript
// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useAuth(); // Get current user from context

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// Usage
<Route path="/teacher/dashboard" element={
  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
    <TeacherDashboard />
  </ProtectedRoute>
} />
```

### 3. Real-time CL Monitoring
```javascript
// Submit CL measurement during quiz/study session
const submitCLMeasurement = async (sessionData) => {
  try {
    const response = await api.post('/measurements', {
      session_id: sessionData.session_id,
      sr_paas_score: sessionData.paas,
      sr_nasa_tlx_mental_demand: sessionData.mentalDemand,
      pf_accuracy: sessionData.accuracy,
      pf_response_time_ms: sessionData.responseTime,
      bh_hint_requests: sessionData.hintsUsed,
      // ... other metrics
    });

    const { cl_index, cl_category } = response.data.data;

    // Show warning if overload
    if (cl_category === 'overload') {
      showOverloadWarning();
    }
  } catch (error) {
    console.error('Failed to submit CL measurement:', error);
  }
};
```

---

## Additional Resources

- **API Base URL:** `http://localhost:3000/api`
- **Database Schema:** See `database/schema.sql`
- **Bug Fixes:** See `API_FIXES_SUMMARY.md`
- **Progress Tracker:** See `PROGRESS.md`

---

**Last Updated:** 2025-12-10
**Total Endpoints:** 61
**Status:** ✅ All endpoints tested and working
