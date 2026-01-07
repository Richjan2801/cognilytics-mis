-- CogniLytics MIS Database Schema
-- PostgreSQL 14 + TimescaleDB Extension
-- Cognitive Load Measurement and Decision Support System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Institutions Table
CREATE TABLE institutions (
    institution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- 'school', 'university', 'college'
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_institutions_name ON institutions(name);

-- Users Table (Students, Teachers, Admins)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    institution_id UUID REFERENCES institutions(institution_id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES users(user_id) ON DELETE SET NULL, -- For students: their assigned teacher
    student_id VARCHAR(50), -- Student ID number (optional)
    grade_level VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_teacher ON users(teacher_id) WHERE role = 'student';
CREATE INDEX idx_users_institution ON users(institution_id);

-- Topics/Subjects Table
CREATE TABLE topics (
    topic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100), -- 'Mathematics', 'Science', 'Literature', etc.
    grade_level VARCHAR(50),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    teacher_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    institution_id UUID REFERENCES institutions(institution_id) ON DELETE CASCADE,
    estimated_duration_mins INTEGER,
    learning_objectives TEXT[],
    prerequisites TEXT[],
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_topics_teacher ON topics(teacher_id);
CREATE INDEX idx_topics_subject ON topics(subject);
CREATE INDEX idx_topics_institution ON topics(institution_id);
CREATE INDEX idx_topics_active ON topics(is_active) WHERE is_active = true;

-- Quizzes Table
CREATE TABLE quizzes (
    quiz_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES topics(topic_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit_mins INTEGER,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    total_points INTEGER DEFAULT 100,
    question_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}', -- hints_available, max_attempts, randomize_questions, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quizzes_topic ON quizzes(topic_id);
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);
CREATE INDEX idx_quizzes_active ON quizzes(is_active) WHERE is_active = true;

-- Quiz Questions Table
CREATE TABLE quiz_questions (
    question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
    options JSONB, -- For multiple choice: ["Option A", "Option B", "Option C", "Option D"]
    correct_answer TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    order_index INTEGER,
    explanation TEXT,
    hints JSONB DEFAULT '[]', -- Array of hint strings
    expected_time_seconds INTEGER, -- Expected time to answer this question
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_order ON quiz_questions(quiz_id, order_index);

-- Learning Materials Table
CREATE TABLE learning_materials (
    material_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES topics(topic_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) CHECK (content_type IN ('video', 'reading', 'interactive', 'document', 'link')),
    content_url TEXT,
    content_text TEXT,
    file_path VARCHAR(500),
    estimated_duration_mins INTEGER,
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_materials_topic ON learning_materials(topic_id);
CREATE INDEX idx_materials_created_by ON learning_materials(created_by);

-- ============================================================================
-- TIME-SERIES TABLES (TimescaleDB Hypertables)
-- ============================================================================

-- Learning Sessions Table (Hypertable)
CREATE TABLE learning_sessions (
    session_id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(topic_id) ON DELETE SET NULL,
    quiz_id UUID REFERENCES quizzes(quiz_id) ON DELETE SET NULL,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('quiz', 'study', 'practice', 'review')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    device_type VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',

    PRIMARY KEY (started_at, session_id)
);

-- Convert to hypertable partitioned by time
SELECT create_hypertable('learning_sessions', 'started_at', if_not_exists => TRUE);

CREATE INDEX idx_sessions_user_time ON learning_sessions(user_id, started_at DESC);
CREATE INDEX idx_sessions_topic ON learning_sessions(topic_id, started_at DESC);
CREATE INDEX idx_sessions_quiz ON learning_sessions(quiz_id, started_at DESC);
CREATE INDEX idx_sessions_type ON learning_sessions(session_type, started_at DESC);

-- Cognitive Load Measurements Table (Primary Hypertable)
CREATE TABLE cl_measurements (
    measurement_id UUID DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(topic_id) ON DELETE SET NULL,
    quiz_id UUID REFERENCES quizzes(quiz_id) ON DELETE SET NULL,
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
    pf_correct_count INTEGER DEFAULT 0,
    pf_total_count INTEGER DEFAULT 0,
    pf_normalized DECIMAL(5,4) CHECK (pf_normalized BETWEEN 0 AND 1),

    -- Behavioral Component (BH)
    bh_hint_requests INTEGER DEFAULT 0,
    bh_page_revisits INTEGER DEFAULT 0,
    bh_pause_duration_ms INTEGER DEFAULT 0,
    bh_pause_count INTEGER DEFAULT 0,
    bh_answer_changes INTEGER DEFAULT 0,
    bh_normalized DECIMAL(5,4) CHECK (bh_normalized BETWEEN 0 AND 1),

    -- Physiological Component (PH) - Optional/Future
    ph_eye_tracking_data JSONB,
    ph_facial_analysis JSONB,
    ph_heart_rate_data JSONB,
    ph_normalized DECIMAL(5,4) CHECK (ph_normalized BETWEEN 0 AND 1),

    -- Computed CL Index
    cl_index DECIMAL(5,4) NOT NULL CHECK (cl_index BETWEEN 0 AND 1),
    cl_category VARCHAR(20) NOT NULL CHECK (cl_category IN ('low', 'optimal', 'high', 'overload')),

    -- Weights used for calculation (for audit/analysis)
    weight_sr DECIMAL(3,2) DEFAULT 0.35,
    weight_pf DECIMAL(3,2) DEFAULT 0.30,
    weight_bh DECIMAL(3,2) DEFAULT 0.20,
    weight_ph DECIMAL(3,2) DEFAULT 0.15,

    metadata JSONB DEFAULT '{}',

    PRIMARY KEY (measured_at, measurement_id)
);

-- Convert to hypertable
SELECT create_hypertable('cl_measurements', 'measured_at', if_not_exists => TRUE);

CREATE INDEX idx_cl_user_time ON cl_measurements(user_id, measured_at DESC);
CREATE INDEX idx_cl_session ON cl_measurements(session_id);
CREATE INDEX idx_cl_topic ON cl_measurements(topic_id, measured_at DESC);
CREATE INDEX idx_cl_quiz ON cl_measurements(quiz_id, measured_at DESC);
CREATE INDEX idx_cl_category ON cl_measurements(cl_category, measured_at DESC);
CREATE INDEX idx_cl_index ON cl_measurements(cl_index, measured_at DESC);

-- Behavioral Events Table (Hypertable - Granular Tracking)
CREATE TABLE behavioral_events (
    event_id UUID DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    occurred_at TIMESTAMPTZ NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'hint_request',
        'page_revisit',
        'pause_start',
        'pause_end',
        'answer_change',
        'question_viewed',
        'question_skipped',
        'resource_accessed',
        'help_requested'
    )),
    question_id UUID,
    event_data JSONB DEFAULT '{}',

    PRIMARY KEY (occurred_at, event_id)
);

SELECT create_hypertable('behavioral_events', 'occurred_at', if_not_exists => TRUE);

CREATE INDEX idx_behavioral_session_time ON behavioral_events(session_id, occurred_at);
CREATE INDEX idx_behavioral_user ON behavioral_events(user_id, occurred_at DESC);
CREATE INDEX idx_behavioral_type ON behavioral_events(event_type, occurred_at DESC);

-- Quiz Attempts Table
CREATE TABLE quiz_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    score DECIMAL(5,2),
    max_score INTEGER,
    accuracy DECIMAL(5,4),
    time_taken_seconds INTEGER,
    answers JSONB, -- {question_id: {answer, is_correct, time_taken, hints_used}, ...}
    is_completed BOOLEAN DEFAULT false,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_user_time ON quiz_attempts(user_id, started_at DESC);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id, started_at DESC);
CREATE INDEX idx_quiz_attempts_session ON quiz_attempts(session_id);
CREATE INDEX idx_quiz_attempts_completed ON quiz_attempts(is_completed, started_at DESC);

-- ============================================================================
-- AGGREGATED DATA TABLES
-- ============================================================================

-- CL Aggregates Table (Pre-computed Statistics)
CREATE TABLE cl_aggregates (
    aggregate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregation_type VARCHAR(50) NOT NULL CHECK (aggregation_type IN (
        'student_daily',
        'student_weekly',
        'topic_daily',
        'topic_weekly',
        'class_daily',
        'class_weekly',
        'teacher_daily',
        'teacher_weekly'
    )),
    entity_id UUID NOT NULL, -- user_id, topic_id, or teacher_id
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- CL Statistics
    avg_cl_index DECIMAL(5,4),
    max_cl_index DECIMAL(5,4),
    min_cl_index DECIMAL(5,4),
    median_cl_index DECIMAL(5,4),
    std_dev_cl_index DECIMAL(5,4),

    -- Category Counts
    low_count INTEGER DEFAULT 0,
    optimal_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    overload_count INTEGER DEFAULT 0,
    total_measurements INTEGER DEFAULT 0,

    -- Performance Statistics
    avg_accuracy DECIMAL(5,4),
    avg_response_time_ms INTEGER,

    -- Behavioral Statistics
    avg_hint_requests DECIMAL(5,2),
    avg_page_revisits DECIMAL(5,2),
    total_sessions INTEGER DEFAULT 0,

    computed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',

    UNIQUE(aggregation_type, entity_id, period_start)
);

CREATE INDEX idx_aggregates_type_entity_time ON cl_aggregates(aggregation_type, entity_id, period_start DESC);
CREATE INDEX idx_aggregates_period ON cl_aggregates(period_start, period_end);

-- Alerts Table
CREATE TABLE alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'student_overload',
        'student_high_load',
        'student_low_challenge',
        'topic_difficulty',
        'topic_easy',
        'teacher_support_needed',
        'curriculum_review',
        'system_notification'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    target_role VARCHAR(20) NOT NULL CHECK (target_role IN ('student', 'teacher', 'admin', 'all')),

    -- Related Entities
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(topic_id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    session_id UUID,

    -- Alert Content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recommendation TEXT,
    action_url VARCHAR(500),

    -- Alert Metadata
    trigger_data JSONB DEFAULT '{}', -- CL values, thresholds, percentages, etc.
    priority INTEGER DEFAULT 1,

    -- Status
    is_read BOOLEAN DEFAULT false,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(user_id),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(user_id),
    resolution_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_alerts_user_unread ON alerts(user_id, is_read, created_at DESC);
CREATE INDEX idx_alerts_teacher ON alerts(teacher_id, is_resolved, created_at DESC);
CREATE INDEX idx_alerts_type ON alerts(alert_type, created_at DESC);
CREATE INDEX idx_alerts_severity ON alerts(severity, is_resolved, created_at DESC);
CREATE INDEX idx_alerts_target_role ON alerts(target_role, created_at DESC);

-- Curriculum Reviews Table
CREATE TABLE curriculum_reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES topics(topic_id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(institution_id) ON DELETE CASCADE,
    triggered_by VARCHAR(50) CHECK (triggered_by IN ('multiple_term_overload', 'manual', 'admin_request')),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),

    -- Trigger Metrics
    affected_terms INTEGER,
    avg_cl_index DECIMAL(5,4),
    student_count INTEGER,
    overload_percentage DECIMAL(5,2),
    term_data JSONB DEFAULT '[]', -- Array of {term, avg_cl, overload_count}

    -- Review Process
    review_status VARCHAR(50) DEFAULT 'pending' CHECK (review_status IN ('pending', 'in_progress', 'completed', 'dismissed')),
    assigned_to UUID REFERENCES users(user_id),
    assigned_at TIMESTAMPTZ,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Review Outcomes
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    findings TEXT,
    actions_taken TEXT,
    recommendations TEXT,
    outcome VARCHAR(50),

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_curriculum_reviews_topic ON curriculum_reviews(topic_id, review_status);
CREATE INDEX idx_curriculum_reviews_institution ON curriculum_reviews(institution_id, review_status);
CREATE INDEX idx_curriculum_reviews_status ON curriculum_reviews(review_status, triggered_at DESC);

-- ============================================================================
-- HELPER TABLES
-- ============================================================================

-- System Settings Table
CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(user_id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('cl_calculation_weights', '{"sr": 0.35, "pf": 0.30, "bh": 0.20, "ph": 0.15}', 'Weights for CL-Index calculation'),
('cl_thresholds', '{"low": 0.29, "optimal": 0.59, "high": 0.79, "overload": 1.0}', 'CL category thresholds'),
('behavioral_caps', '{"max_hints": 5, "max_revisits": 10, "max_pause_mins": 3}', 'Normalization caps for behavioral metrics'),
('decision_rules', '{"student_overload_threshold": 0.80, "student_support_threshold": 0.60, "teacher_topic_overload": 0.70, "teacher_overload_percentage": 0.30}', 'Thresholds for decision rules');

-- Audit Log Table (Optional - for tracking changes)
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id, created_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_materials_updated_at BEFORE UPDATE ON learning_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculum_reviews_updated_at BEFORE UPDATE ON curriculum_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Latest CL Measurements per Student
CREATE VIEW latest_student_cl AS
SELECT DISTINCT ON (user_id)
    user_id,
    cl_index,
    cl_category,
    measured_at,
    session_id,
    topic_id
FROM cl_measurements
ORDER BY user_id, measured_at DESC;

-- View: Topic Difficulty Summary
CREATE VIEW topic_difficulty_summary AS
SELECT
    t.topic_id,
    t.name AS topic_name,
    t.subject,
    COUNT(DISTINCT ca.session_id) AS total_sessions,
    AVG(clm.cl_index) AS avg_cl_index,
    COUNT(CASE WHEN clm.cl_category = 'overload' THEN 1 END)::FLOAT /
        NULLIF(COUNT(*), 0) AS overload_percentage,
    COUNT(DISTINCT clm.user_id) AS student_count
FROM topics t
LEFT JOIN cl_measurements clm ON t.topic_id = clm.topic_id
LEFT JOIN quiz_attempts ca ON ca.quiz_id IN (SELECT quiz_id FROM quizzes WHERE topic_id = t.topic_id)
WHERE clm.measured_at >= NOW() - INTERVAL '30 days'
GROUP BY t.topic_id, t.name, t.subject;

-- ============================================================================
-- SAMPLE DATA (For Development/Testing)
-- ============================================================================

-- This will be populated by seed.sql

COMMENT ON DATABASE postgres IS 'CogniLytics MIS - Cognitive Load Measurement and Decision Support System';
