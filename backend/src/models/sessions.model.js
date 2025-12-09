// Learning sessions model - handles session tracking
import db from '../config/db.js';

/**
 * Create a new learning session
 * @param {Object} sessionData - Session data
 * @returns {Promise<Object>} Created session object
 */
export async function createSession(sessionData) {
    const {
        user_id,
        topic_id = null,
        quiz_id = null,
        session_type,
        device_type = null,
        ip_address = null,
        user_agent = null,
        metadata = {},
    } = sessionData;

    const session = await db.one(
        `INSERT INTO learning_sessions
         (user_id, topic_id, quiz_id, session_type, started_at, device_type, ip_address, user_agent, metadata)
         VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8)
         RETURNING session_id, user_id, topic_id, quiz_id, session_type, started_at, device_type, metadata`,
        [user_id, topic_id, quiz_id, session_type, device_type, ip_address, user_agent, metadata]
    );

    return session;
}

/**
 * End a learning session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Updated session object
 */
export async function endSession(sessionId) {
    const session = await db.one(
        `UPDATE learning_sessions
         SET ended_at = NOW(),
             duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
         WHERE session_id = $1
         RETURNING session_id, user_id, topic_id, quiz_id, session_type,
                   started_at, ended_at, duration_seconds`,
        [sessionId]
    );

    return session;
}

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Session object or null
 */
export async function getSessionById(sessionId) {
    return await db.oneOrNone(
        `SELECT session_id, user_id, topic_id, quiz_id, session_type,
                started_at, ended_at, duration_seconds, device_type,
                ip_address, user_agent, metadata
         FROM learning_sessions
         WHERE session_id = $1`,
        [sessionId]
    );
}

/**
 * Get active sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of active session objects
 */
export async function getActiveSessions(userId) {
    return await db.any(
        `SELECT session_id, user_id, topic_id, quiz_id, session_type,
                started_at, device_type, metadata
         FROM learning_sessions
         WHERE user_id = $1 AND ended_at IS NULL
         ORDER BY started_at DESC`,
        [userId]
    );
}

/**
 * Get sessions by user with pagination
 * @param {string} userId - User ID
 * @param {Object} options - Query options (limit, offset, sessionType, startDate, endDate)
 * @returns {Promise<Array>} Array of session objects
 */
export async function getSessionsByUser(userId, options = {}) {
    const {
        limit = 50,
        offset = 0,
        session_type = null,
        start_date = null,
        end_date = null,
    } = options;

    let query = `
        SELECT session_id, user_id, topic_id, quiz_id, session_type,
               started_at, ended_at, duration_seconds, device_type, metadata
        FROM learning_sessions
        WHERE user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (session_type) {
        query += ` AND session_type = $${paramIndex}`;
        params.push(session_type);
        paramIndex++;
    }

    if (start_date) {
        query += ` AND started_at >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
    }

    if (end_date) {
        query += ` AND started_at <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
    }

    query += ` ORDER BY started_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    return await db.any(query, params);
}

/**
 * Get sessions by topic
 * @param {string} topicId - Topic ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of session objects
 */
export async function getSessionsByTopic(topicId, options = {}) {
    const { limit = 100, offset = 0 } = options;

    return await db.any(
        `SELECT session_id, user_id, topic_id, quiz_id, session_type,
                started_at, ended_at, duration_seconds
         FROM learning_sessions
         WHERE topic_id = $1
         ORDER BY started_at DESC
         LIMIT $2 OFFSET $3`,
        [topicId, limit, offset]
    );
}

/**
 * Get sessions by quiz
 * @param {string} quizId - Quiz ID
 * @returns {Promise<Array>} Array of session objects
 */
export async function getSessionsByQuiz(quizId) {
    return await db.any(
        `SELECT session_id, user_id, topic_id, quiz_id, session_type,
                started_at, ended_at, duration_seconds
         FROM learning_sessions
         WHERE quiz_id = $1
         ORDER BY started_at DESC`,
        [quizId]
    );
}

/**
 * Count sessions by user
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<number>} Count of sessions
 */
export async function countSessionsByUser(userId, filters = {}) {
    const { session_type = null, start_date = null, end_date = null } = filters;

    let query = 'SELECT COUNT(*) as count FROM learning_sessions WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (session_type) {
        query += ` AND session_type = $${paramIndex}`;
        params.push(session_type);
        paramIndex++;
    }

    if (start_date) {
        query += ` AND started_at >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
    }

    if (end_date) {
        query += ` AND started_at <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
    }

    const result = await db.one(query, params);
    return parseInt(result.count);
}

/**
 * Get session statistics for a user
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Session statistics
 */
export async function getSessionStatistics(userId, startDate, endDate) {
    const stats = await db.one(
        `SELECT
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN session_type = 'quiz' THEN 1 END) as quiz_sessions,
            COUNT(CASE WHEN session_type = 'study' THEN 1 END) as study_sessions,
            COUNT(CASE WHEN session_type = 'practice' THEN 1 END) as practice_sessions,
            COUNT(CASE WHEN ended_at IS NOT NULL THEN 1 END) as completed_sessions,
            AVG(duration_seconds) as avg_duration_seconds,
            SUM(duration_seconds) as total_duration_seconds,
            MAX(started_at) as last_session_at
         FROM learning_sessions
         WHERE user_id = $1 AND started_at >= $2 AND started_at <= $3`,
        [userId, startDate, endDate]
    );

    return {
        total_sessions: parseInt(stats.total_sessions) || 0,
        quiz_sessions: parseInt(stats.quiz_sessions) || 0,
        study_sessions: parseInt(stats.study_sessions) || 0,
        practice_sessions: parseInt(stats.practice_sessions) || 0,
        completed_sessions: parseInt(stats.completed_sessions) || 0,
        avg_duration_seconds: parseFloat(stats.avg_duration_seconds) || 0,
        total_duration_seconds: parseInt(stats.total_duration_seconds) || 0,
        last_session_at: stats.last_session_at,
    };
}

/**
 * Update session metadata
 * @param {string} sessionId - Session ID
 * @param {Object} metadata - Metadata to update
 * @returns {Promise<Object>} Updated session
 */
export async function updateSessionMetadata(sessionId, metadata) {
    return await db.one(
        `UPDATE learning_sessions
         SET metadata = metadata || $2::jsonb
         WHERE session_id = $1
         RETURNING session_id, metadata`,
        [sessionId, metadata]
    );
}

/**
 * Delete old sessions (cleanup)
 * @param {Date} beforeDate - Delete sessions before this date
 * @returns {Promise<number>} Number of deleted sessions
 */
export async function deleteOldSessions(beforeDate) {
    const result = await db.result(
        `DELETE FROM learning_sessions
         WHERE started_at < $1`,
        [beforeDate]
    );

    return result.rowCount;
}
