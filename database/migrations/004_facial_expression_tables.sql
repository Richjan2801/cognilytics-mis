-- Migration: Add Facial Expression Detection Tables
-- Description: Creates tables for storing facial expression detection data

-- Table for individual expression detections
CREATE TABLE IF NOT EXISTS facial_expression_data (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES learning_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expression_data JSONB NOT NULL,
    cognitive_load FLOAT NOT NULL CHECK (cognitive_load >= 0 AND cognitive_load <= 1),
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table for batch analysis results
CREATE TABLE IF NOT EXISTS facial_expression_batch_data (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES learning_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    batch_data JSONB NOT NULL,
    average_cognitive_load FLOAT NOT NULL CHECK (average_cognitive_load >= 0 AND average_cognitive_load <= 1),
    stress_indicators JSONB,
    frame_count INTEGER DEFAULT 0,
    faces_detected_count INTEGER DEFAULT 0,
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table for user calibration data
CREATE TABLE IF NOT EXISTS user_calibration_data (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    calibration_data JSONB NOT NULL,
    calibration_samples INTEGER DEFAULT 0,
    baseline_avg_cl FLOAT CHECK (baseline_avg_cl IS NULL OR (baseline_avg_cl >= 0 AND baseline_avg_cl <= 1)),
    calibrated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table for stress episodes (detected high cognitive load periods)
CREATE TABLE IF NOT EXISTS stress_episodes (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES learning_sessions(session_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    average_cl FLOAT NOT NULL CHECK (average_cl >= 0 AND average_cl <= 1),
    peak_cl FLOAT NOT NULL CHECK (peak_cl >= 0 AND peak_cl <= 1),
    duration_seconds INTEGER,
    indicators TEXT[],
    notes TEXT,
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_facial_expr_session ON facial_expression_data(session_id);
CREATE INDEX idx_facial_expr_user ON facial_expression_data(user_id);
CREATE INDEX idx_facial_expr_time ON facial_expression_data(detected_at);

CREATE INDEX idx_facial_batch_session ON facial_expression_batch_data(session_id);
CREATE INDEX idx_facial_batch_user ON facial_expression_batch_data(user_id);
CREATE INDEX idx_facial_batch_time ON facial_expression_batch_data(recorded_at);

CREATE INDEX idx_stress_episode_session ON stress_episodes(session_id);
CREATE INDEX idx_stress_episode_user ON stress_episodes(user_id);
CREATE INDEX idx_stress_episode_time ON stress_episodes(start_time);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON facial_expression_data TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON facial_expression_batch_data TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_calibration_data TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON stress_episodes TO postgres;
