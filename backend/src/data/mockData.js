/**
 * Mock Data for Development & Testing
 * 
 * Data ini mensimulasikan response dari database untuk development tanpa koneksi database.
 * Struktur mengikuti schema database yang ada di schema.sql
 */

import { calculateCLIndex } from '../services/cl-calculation.service.js';

// ============================================
// USERS - Mock user data dengan berbagai role
// ============================================
export let mockUsers = [
  {
    user_id: 'usr_001',
    email: 'admin@cognilytics.com',
    password_hash: '$2b$10$example_hash_for_password123', // password: password123
    first_name: 'John',
    last_name: 'Doe',
    role: 'admin',
    institution_id: null,
    is_active: true,
    created_at: '2024-01-01T08:00:00Z',
    last_login: '2024-12-19T08:30:00Z',
  },
  {
    user_id: 'usr_002',
    email: 'teacher@cognilytics.com',
    password_hash: '$2b$10$example_hash_for_password123', // password: password123
    first_name: 'John',
    last_name: 'Doe',
    role: 'teacher',
    institution_id: null,
    is_active: true,
    created_at: '2024-01-15T08:00:00Z',
    last_login: '2024-12-19T08:30:00Z',
  },
  {
    user_id: 'usr_003',
    email: 'student@cognilytics.com',
    password_hash: '$2b$10$example_hash_for_password123', // password: password123
    first_name: 'John',
    last_name: 'Doe',
    role: 'student',
    institution_id: null,
    is_active: true,
    created_at: '2024-09-01T10:00:00Z',
    last_login: '2024-12-19T09:30:00Z',
  },
  {
    user_id: 'usr_003',
    email: 'student1@example.com',
    password_hash: '$2b$10$example_hash',
    first_name: 'John',
    last_name: 'Doe',
    role: 'student',
    institution_id: null,
    is_active: true,
    created_at: '2024-09-01T10:00:00Z',
    last_login: '2024-12-19T09:30:00Z',
  },
  {
    user_id: 'usr_004',
    email: 'student2@example.com',
    password_hash: '$2b$10$example_hash',
    first_name: 'John',
    last_name: 'Doe',
    role: 'student',
    institution_id: null,
    is_active: true,
    created_at: '2024-09-01T10:15:00Z',
    last_login: '2024-12-19T09:15:00Z',
  },
  {
    user_id: 'usr_005',
    email: 'student3@example.com',
    password_hash: '$2b$10$example_hash',
    first_name: 'John',
    last_name: 'Doe',
    role: 'student',
    institution_id: null,
    is_active: true,
    created_at: '2024-09-01T10:30:00Z',
    last_login: '2024-12-19T08:45:00Z',
  },
  {
    user_id: 'usr_006',
    email: 'student4@example.com',
    password_hash: '$2b$10$example_hash',
    first_name: 'John',
    last_name: 'Doe',
    role: 'student',
    institution_id: null,
    is_active: true,
    created_at: '2024-09-01T11:00:00Z',
    last_login: '2024-12-19T08:30:00Z',
  },
  {
    user_id: 'usr_007',
    email: 'student5@example.com',
    password_hash: '$2b$10$example_hash',
    first_name: 'John',
    last_name: 'Doe',
    role: 'student',
    institution_id: null,
    is_active: true,
    created_at: '2024-09-01T11:15:00Z',
    last_login: '2024-12-19T08:00:00Z',
  },
  {
    user_id: 'usr_007',
    email: 'admin@cognilytics.com',
    password_hash: '$2b$10$example_hash',
    first_name: 'System',
    last_name: 'Admin',
    role: 'admin',
    institution_id: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-12-19T07:00:00Z',
  },
];

// ============================================
// TOPICS - Mock subject/topic data
// ============================================
export const mockTopics = [
  {
    topic_id: 'tpc_001',
    topic_name: 'Aljabar Linear',
    description: 'Materi fundamental aljabar linear untuk pemula',
    subject_area: 'Matematika',
    difficulty_level: 'intermediate',
    teacher_id: 'usr_001',
    is_active: true,
    created_at: '2024-09-01T00:00:00Z',
  },
  {
    topic_id: 'tpc_002',
    topic_name: 'Kalkulus Integral',
    description: 'Pengenalan konsep integral dan aplikasinya',
    subject_area: 'Matematika',
    difficulty_level: 'advanced',
    teacher_id: 'usr_001',
    is_active: true,
    created_at: '2024-09-05T00:00:00Z',
  },
  {
    topic_id: 'tpc_003',
    topic_name: 'Geometri Analitik',
    description: 'Geometri dalam sistem koordinat kartesian',
    subject_area: 'Matematika',
    difficulty_level: 'intermediate',
    teacher_id: 'usr_001',
    is_active: true,
    created_at: '2024-09-10T00:00:00Z',
  },
  {
    topic_id: 'tpc_004',
    topic_name: 'Statistika Dasar',
    description: 'Konsep dasar statistika deskriptif dan inferensial',
    subject_area: 'Matematika',
    difficulty_level: 'beginner',
    teacher_id: 'usr_001',
    is_active: true,
    created_at: '2024-09-15T00:00:00Z',
  },
];

// ============================================
// SESSIONS - Mock learning session data
// ============================================
export const mockSessions = [
  {
    session_id: 'ses_001',
    user_id: 'usr_002',
    topic_id: 'tpc_001',
    quiz_id: null,
    session_type: 'video',
    started_at: '2024-12-19T09:25:00Z',
    ended_at: '2024-12-19T09:40:00Z',
    duration_seconds: 900,
    device_type: 'desktop',
    metadata: { browser: 'Chrome', os: 'Windows' },
  },
  {
    session_id: 'ses_002',
    user_id: 'usr_003',
    topic_id: 'tpc_002',
    quiz_id: null,
    session_type: 'reading',
    started_at: '2024-12-19T09:10:00Z',
    ended_at: '2024-12-19T09:25:00Z',
    duration_seconds: 900,
    device_type: 'mobile',
    metadata: { browser: 'Safari', os: 'iOS' },
  },
  {
    session_id: 'ses_003',
    user_id: 'usr_004',
    topic_id: 'tpc_003',
    quiz_id: null,
    session_type: 'quiz',
    started_at: '2024-12-19T08:30:00Z',
    ended_at: '2024-12-19T09:00:00Z',
    duration_seconds: 1800,
    device_type: 'desktop',
    metadata: { browser: 'Firefox', os: 'Windows' },
  },
];

// ============================================
// MEASUREMENTS - Mock CL measurement data
// ============================================
export const mockMeasurements = [
  {
    measurement_id: 'mes_001',
    session_id: 'ses_001',
    user_id: 'usr_002',
    topic_id: 'tpc_001',
    quiz_id: null,
    measured_at: '2024-12-19T09:30:00Z',
    // Self-Report
    sr_paas_score: 6,
    sr_nasa_tlx_mental_demand: 70,
    sr_nasa_tlx_effort: 65,
    sr_nasa_tlx_frustration: 60,
    sr_normalized: 68,
    // Performance
    pf_accuracy: 0.75,
    pf_response_time_ms: 5500,
    pf_expected_time_ms: 4000,
    pf_normalized: 65,
    // Behavioral
    bh_hint_requests: 3,
    bh_page_revisits: 5,
    bh_pause_duration_ms: 15000,
    bh_normalized: 70,
    // Physiological (optional)
    ph_normalized: 65,
    // Computed CL
    cl_index: 67.2,
    cl_category: 'high',
    weight_sr: 0.35,
    weight_pf: 0.30,
    weight_bh: 0.20,
    weight_ph: 0.15,
  },
  {
    measurement_id: 'mes_002',
    session_id: 'ses_002',
    user_id: 'usr_003',
    topic_id: 'tpc_002',
    quiz_id: null,
    measured_at: '2024-12-19T09:15:00Z',
    sr_paas_score: 4,
    sr_nasa_tlx_mental_demand: 45,
    sr_nasa_tlx_effort: 40,
    sr_nasa_tlx_frustration: 35,
    sr_normalized: 42,
    pf_accuracy: 0.85,
    pf_response_time_ms: 3800,
    pf_expected_time_ms: 4000,
    pf_normalized: 48,
    bh_hint_requests: 1,
    bh_page_revisits: 2,
    bh_pause_duration_ms: 8000,
    bh_normalized: 45,
    ph_normalized: 42,
    cl_index: 45.1,
    cl_category: 'optimal',
    weight_sr: 0.35,
    weight_pf: 0.30,
    weight_bh: 0.20,
    weight_ph: 0.15,
  },
  {
    measurement_id: 'mes_003',
    session_id: 'ses_003',
    user_id: 'usr_004',
    topic_id: 'tpc_003',
    quiz_id: null,
    measured_at: '2024-12-19T08:45:00Z',
    sr_paas_score: 8,
    sr_nasa_tlx_mental_demand: 85,
    sr_nasa_tlx_effort: 88,
    sr_nasa_tlx_frustration: 82,
    sr_normalized: 85,
    pf_accuracy: 0.60,
    pf_response_time_ms: 7200,
    pf_expected_time_ms: 4000,
    pf_normalized: 82,
    bh_hint_requests: 7,
    bh_page_revisits: 9,
    bh_pause_duration_ms: 25000,
    bh_normalized: 88,
    ph_normalized: 80,
    cl_index: 84.5,
    cl_category: 'overload',
    weight_sr: 0.35,
    weight_pf: 0.30,
    weight_bh: 0.20,
    weight_ph: 0.15,
  },
  {
    measurement_id: 'mes_004',
    session_id: null,
    user_id: 'usr_005',
    topic_id: 'tpc_004',
    quiz_id: null,
    measured_at: '2024-12-19T08:30:00Z',
    sr_paas_score: 3,
    sr_nasa_tlx_mental_demand: 32,
    sr_nasa_tlx_effort: 35,
    sr_nasa_tlx_frustration: 28,
    sr_normalized: 35,
    pf_accuracy: 0.92,
    pf_response_time_ms: 3200,
    pf_expected_time_ms: 4000,
    pf_normalized: 38,
    bh_hint_requests: 0,
    bh_page_revisits: 1,
    bh_pause_duration_ms: 3000,
    bh_normalized: 32,
    ph_normalized: 35,
    cl_index: 35.8,
    cl_category: 'optimal',
    weight_sr: 0.35,
    weight_pf: 0.30,
    weight_bh: 0.20,
    weight_ph: 0.15,
  },
  {
    measurement_id: 'mes_005',
    session_id: null,
    user_id: 'usr_006',
    topic_id: 'tpc_001',
    quiz_id: null,
    measured_at: '2024-12-19T08:00:00Z',
    sr_paas_score: 5,
    sr_nasa_tlx_mental_demand: 55,
    sr_nasa_tlx_effort: 52,
    sr_nasa_tlx_frustration: 48,
    sr_normalized: 53,
    pf_accuracy: 0.80,
    pf_response_time_ms: 4200,
    pf_expected_time_ms: 4000,
    pf_normalized: 56,
    bh_hint_requests: 2,
    bh_page_revisits: 3,
    bh_pause_duration_ms: 10000,
    bh_normalized: 55,
    ph_normalized: 52,
    cl_index: 54.6,
    cl_category: 'optimal',
    weight_sr: 0.35,
    weight_pf: 0.30,
    weight_bh: 0.20,
    weight_ph: 0.15,
  },
];

// ============================================
// COMPUTED CL - Mock aggregated CL data
// ============================================
export const mockComputedCL = [
  {
    computed_id: 'cmp_001',
    user_id: 'usr_002',
    topic_id: 'tpc_001',
    aggregation_period: 'daily',
    period_start: '2024-12-19T00:00:00Z',
    period_end: '2024-12-19T23:59:59Z',
    avg_cl_index: 67.2,
    min_cl_index: 67.2,
    max_cl_index: 67.2,
    measurement_count: 1,
    avg_sr_normalized: 68,
    avg_pf_normalized: 65,
    avg_bh_normalized: 70,
    avg_ph_normalized: 65,
    trend_direction: 'stable',
    computed_at: '2024-12-19T10:00:00Z',
  },
  {
    computed_id: 'cmp_002',
    user_id: 'usr_003',
    topic_id: 'tpc_002',
    aggregation_period: 'daily',
    period_start: '2024-12-19T00:00:00Z',
    period_end: '2024-12-19T23:59:59Z',
    avg_cl_index: 45.1,
    min_cl_index: 45.1,
    max_cl_index: 45.1,
    measurement_count: 1,
    avg_sr_normalized: 42,
    avg_pf_normalized: 48,
    avg_bh_normalized: 45,
    avg_ph_normalized: 42,
    trend_direction: 'stable',
    computed_at: '2024-12-19T10:00:00Z',
  },
];

// ============================================
// TEACHER DASHBOARD DATA - Aggregated stats
// ============================================
export const mockTeacherDashboard = {
  overview: {
    avg_cl_index: 52.4,
    cl_trend_percentage: 2.3, // +2.3% vs last week
    high_load_students: 8,
    active_students: 42,
    total_students: 45,
    performance_index: 7.8,
    performance_trend: 0.5, // +0.5 points
  },
  cl_trend_7days: [
    { date: '2024-12-13', avg_cl: 45, day_name: '13 Dec' },
    { date: '2024-12-14', avg_cl: 52, day_name: '14 Dec' },
    { date: '2024-12-15', avg_cl: 48, day_name: '15 Dec' },
    { date: '2024-12-16', avg_cl: 58, day_name: '16 Dec' },
    { date: '2024-12-17', avg_cl: 62, day_name: '17 Dec' },
    { date: '2024-12-18', avg_cl: 55, day_name: '18 Dec' },
    { date: '2024-12-19', avg_cl: 51, day_name: '19 Dec' },
  ],
  recent_submissions: [
    {
      measurement_id: 'mes_001',
      student_id: 'usr_002',
      student_name: 'Ahmad Fauzi',
      topic_id: 'tpc_001',
      topic_name: 'Aljabar Linear',
      cl_value: 67,
      cl_category: 'high',
      measured_at: '2024-12-19T09:30:00Z',
    },
    {
      measurement_id: 'mes_002',
      student_id: 'usr_003',
      student_name: 'Siti Nurhaliza',
      topic_id: 'tpc_002',
      topic_name: 'Kalkulus Integral',
      cl_value: 45,
      cl_category: 'optimal',
      measured_at: '2024-12-19T09:15:00Z',
    },
    {
      measurement_id: 'mes_003',
      student_id: 'usr_004',
      student_name: 'Budi Santoso',
      topic_id: 'tpc_003',
      topic_name: 'Geometri Analitik',
      cl_value: 82,
      cl_category: 'overload',
      measured_at: '2024-12-19T08:45:00Z',
    },
    {
      measurement_id: 'mes_004',
      student_id: 'usr_005',
      student_name: 'Dewi Lestari',
      topic_id: 'tpc_004',
      topic_name: 'Statistika Dasar',
      cl_value: 38,
      cl_category: 'optimal',
      measured_at: '2024-12-19T08:30:00Z',
    },
    {
      measurement_id: 'mes_005',
      student_id: 'usr_006',
      student_name: 'Eko Prasetyo',
      topic_id: 'tpc_001',
      topic_name: 'Aljabar Linear',
      cl_value: 55,
      cl_category: 'optimal',
      measured_at: '2024-12-19T08:00:00Z',
    },
  ],
  topic_breakdown: [
    {
      topic_id: 'tpc_001',
      topic_name: 'Aljabar Linear',
      avg_cl: 61.0,
      student_count: 12,
      measurement_count: 45,
      high_load_count: 3,
    },
    {
      topic_id: 'tpc_002',
      topic_name: 'Kalkulus Integral',
      avg_cl: 48.5,
      student_count: 10,
      measurement_count: 38,
      high_load_count: 2,
    },
    {
      topic_id: 'tpc_003',
      topic_name: 'Geometri Analitik',
      avg_cl: 55.2,
      student_count: 15,
      measurement_count: 52,
      high_load_count: 2,
    },
    {
      topic_id: 'tpc_004',
      topic_name: 'Statistika Dasar',
      avg_cl: 42.8,
      student_count: 8,
      measurement_count: 28,
      high_load_count: 1,
    },
  ],
  class_list: [
    {
      student_id: 'usr_002',
      student_name: 'John Doe',
      email: 'student1@example.com',
      current_cl: 67,
      cl_category: 'high',
      sessions_completed: 12,
      avg_cl: 62.5,
      last_active: '2024-12-19T09:30:00Z',
      high_load_count: 3,
      topics_studied: ['Aljabar Linear', 'Kalkulus'],
    },
    {
      student_id: 'usr_003',
      student_name: 'John Doe',
      email: 'student2@example.com',
      current_cl: 45,
      cl_category: 'optimal',
      sessions_completed: 10,
      avg_cl: 48.2,
      last_active: '2024-12-19T09:15:00Z',
      high_load_count: 1,
      topics_studied: ['Kalkulus Integral'],
    },
    {
      student_id: 'usr_004',
      student_name: 'John Doe',
      email: 'student3@example.com',
      current_cl: 82,
      cl_category: 'overload',
      sessions_completed: 15,
      avg_cl: 78.4,
      last_active: '2024-12-19T08:45:00Z',
      high_load_count: 8,
      topics_studied: ['Geometri Analitik', 'Aljabar'],
    },
    {
      student_id: 'usr_005',
      student_name: 'John Doe',
      email: 'student4@example.com',
      current_cl: 38,
      cl_category: 'optimal',
      sessions_completed: 8,
      avg_cl: 42.1,
      last_active: '2024-12-19T08:30:00Z',
      high_load_count: 0,
      topics_studied: ['Statistika Dasar'],
    },
    {
      student_id: 'usr_006',
      student_name: 'John Doe',
      email: 'student5@example.com',
      current_cl: 55,
      cl_category: 'optimal',
      sessions_completed: 14,
      avg_cl: 52.8,
      last_active: '2024-12-19T08:00:00Z',
      high_load_count: 2,
      topics_studied: ['Aljabar Linear', 'Statistika'],
    },
  ],
  alerts: [
    {
      alert_id: 'alt_001',
      type: 'overload',
      severity: 'critical',
      student_id: 'usr_004',
      student_name: 'John Doe',
      message: 'Student has CL of 82 (Overload). Immediate intervention needed.',
      topic: 'Geometri Analitik',
      current_cl: 82,
      recommendation: 'Reduce task complexity or provide extended break time.',
      timestamp: '2024-12-19T08:45:00Z',
    },
    {
      alert_id: 'alt_002',
      type: 'high_load',
      severity: 'warning',
      student_id: 'usr_002',
      student_name: 'John Doe',
      message: 'Student has sustained high CL (67) for 3 consecutive sessions.',
      topic: 'Aljabar Linear',
      current_cl: 67,
      recommendation: 'Consider breaking down complex topics into smaller chunks.',
      timestamp: '2024-12-19T09:30:00Z',
    },
    {
      alert_id: 'alt_003',
      type: 'topic_difficulty',
      severity: 'info',
      message: 'Aljabar Linear shows highest class average CL (61.0). Consider curriculum review.',
      topic: 'Aljabar Linear',
      avg_cl: 61.0,
      affected_students: 12,
      recommendation: 'Review teaching materials or adjust pacing for this topic.',
      timestamp: '2024-12-19T10:00:00Z',
    },
  ],
  recommendations: [
    {
      id: 'rec_001',
      type: 'intervention',
      priority: 'high',
      title: 'Immediate Attention Required',
      description: '1 student in overload state (CL > 80). Schedule one-on-one session.',
      action: 'Contact John Doe (student3@example.com)',
      icon: 'alert-circle',
    },
    {
      id: 'rec_002',
      type: 'teaching_strategy',
      priority: 'medium',
      title: 'Adjust Aljabar Linear Approach',
      description: 'This topic has highest CL (61.0). Consider using more visual aids or practical examples.',
      action: 'Review lesson plan',
      icon: 'lightbulb',
    },
    {
      id: 'rec_003',
      type: 'positive',
      priority: 'low',
      title: 'Great Progress in Statistika',
      description: 'Students show optimal CL (42.8) in this topic. Current teaching method is effective.',
      action: 'Keep up the good work!',
      icon: 'trophy',
    },
    {
      id: 'rec_004',
      type: 'break_time',
      priority: 'medium',
      title: 'Schedule Class Break',
      description: 'Class average CL has been >50 for 3 days. Consider scheduling a review/break day.',
      action: 'Plan lighter activities',
      icon: 'coffee',
    },
  ],
};

// ============================================
// STUDENT DASHBOARD DATA
// ============================================
export const mockStudentDashboard = {
  usr_002: {
    overview: {
      current_cl: 67,
      avg_cl_last_week: 58.5,
      total_sessions: 12,
      active_topics: 3,
      learning_streak_days: 5,
    },
    recent_measurements: [
      {
        measurement_id: 'mes_001',
        topic_name: 'Aljabar Linear',
        cl_value: 67,
        cl_category: 'high',
        measured_at: '2024-12-19T09:30:00Z',
      },
    ],
    cl_trend_7days: [
      { date: '2024-12-13', cl_value: 52 },
      { date: '2024-12-14', cl_value: 58 },
      { date: '2024-12-15', cl_value: 55 },
      { date: '2024-12-16', cl_value: 62 },
      { date: '2024-12-17', cl_value: 65 },
      { date: '2024-12-18', cl_value: 60 },
      { date: '2024-12-19', cl_value: 67 },
    ],
    recommendations: [
      {
        recommendation_id: 'rec_001',
        type: 'break',
        priority: 'high',
        message: 'Cognitive load Anda sedang tinggi. Sebaiknya istirahat 10-15 menit.',
        created_at: '2024-12-19T09:35:00Z',
      },
      {
        recommendation_id: 'rec_002',
        type: 'resource',
        priority: 'medium',
        message: 'Coba gunakan video tutorial untuk topik Aljabar Linear.',
        created_at: '2024-12-19T09:35:00Z',
      },
    ],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get user by email (for login mock)
 */
export function findUserByEmail(email) {
  return mockUsers.find(u => u.email === email);
}

/**
 * Get user by ID
 */
export function findUserById(userId) {
  return mockUsers.find(u => u.user_id === userId);
}

/**
 * Get teacher dashboard data
 */
export function getTeacherDashboardData(teacherId) {
  return mockTeacherDashboard;
}

/**
 * Get student dashboard data
 */
export function getStudentDashboardData(studentId) {
  return mockStudentDashboard[studentId] || null;
}

/**
 * Get measurements by user
 */
export function getMeasurementsByUser(userId, limit = 10) {
  return mockMeasurements
    .filter(m => m.user_id === userId)
    .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))
    .slice(0, limit);
}

/**
 * Get measurements by topic
 */
export function getMeasurementsByTopic(topicId, limit = 50) {
  return mockMeasurements
    .filter(m => m.topic_id === topicId)
    .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))
    .slice(0, limit);
}

/**
 * Get all topics for a teacher
 */
export function getTopicsByTeacher(teacherId) {
  return mockTopics.filter(t => t.teacher_id === teacherId);
}

/**
 * Get recent sessions
 */
export function getRecentSessions(userId = null, limit = 10) {
  let sessions = mockSessions;
  if (userId) {
    sessions = sessions.filter(s => s.user_id === userId);
  }
  return sessions
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
    .slice(0, limit);
}

export default {
  mockUsers,
  mockTopics,
  mockSessions,
  mockMeasurements,
  mockComputedCL,
  mockTeacherDashboard,
  mockStudentDashboard,
  findUserByEmail,
  findUserById,
  getTeacherDashboardData,
  getStudentDashboardData,
  getMeasurementsByUser,
  getMeasurementsByTopic,
  getTopicsByTeacher,
  getRecentSessions,
};
