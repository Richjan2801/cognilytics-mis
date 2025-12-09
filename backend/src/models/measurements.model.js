// CL Measurements model - handles cognitive load measurement storage and retrieval
import db from '../config/db.js';

/**
 * Create a new CL measurement
 * @param {Object} measurementData - Measurement data including calculated CL
 * @returns {Promise<Object>} Created measurement object
 */
export async function createMeasurement(measurementData) {
    const {
        session_id,
        user_id,
        topic_id = null,
        quiz_id = null,
        // Self-Report
        sr_paas_score = null,
        sr_nasa_tlx_mental_demand = null,
        sr_nasa_tlx_effort = null,
        sr_nasa_tlx_frustration = null,
        sr_normalized,
        // Performance
        pf_accuracy,
        pf_response_time_ms = null,
        pf_expected_time_ms = null,
        pf_normalized,
        // Behavioral
        bh_hint_requests = 0,
        bh_page_revisits = 0,
        bh_pause_duration_ms = 0,
        bh_normalized,
        // Physiological (optional)
        ph_normalized = null,
        // Computed CL
        cl_index,
        cl_category,
        // Weights used
        weight_sr,
        weight_pf,
        weight_bh,
        weight_ph,
    } = measurementData;

    const measurement = await db.one(
        `INSERT INTO cl_measurements (
            session_id, user_id, topic_id, quiz_id, measured_at,
            sr_paas_score, sr_nasa_tlx_mental_demand, sr_nasa_tlx_effort, sr_nasa_tlx_frustration, sr_normalized,
            pf_accuracy, pf_response_time_ms, pf_expected_time_ms, pf_normalized,
            bh_hint_requests, bh_page_revisits, bh_pause_duration_ms, bh_normalized,
            ph_normalized,
            cl_index, cl_category,
            weight_sr, weight_pf, weight_bh, weight_ph
        ) VALUES (
            $1, $2, $3, $4, NOW(),
            $5, $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16, $17,
            $18,
            $19, $20,
            $21, $22, $23, $24
        )
        RETURNING measurement_id, session_id, user_id, topic_id, quiz_id, measured_at,
                  cl_index, cl_category, sr_normalized, pf_normalized, bh_normalized, ph_normalized`,
        [
            session_id, user_id, topic_id, quiz_id,
            sr_paas_score, sr_nasa_tlx_mental_demand, sr_nasa_tlx_effort, sr_nasa_tlx_frustration, sr_normalized,
            pf_accuracy, pf_response_time_ms, pf_expected_time_ms, pf_normalized,
            bh_hint_requests, bh_page_revisits, bh_pause_duration_ms, bh_normalized,
            ph_normalized,
            cl_index, cl_category,
            weight_sr, weight_pf, weight_bh, weight_ph
        ]
    );

    return measurement;
}

/**
 * Get measurement by ID
 * @param {string} measurementId - Measurement ID
 * @returns {Promise<Object|null>} Measurement object or null
 */
export async function getMeasurementById(measurementId) {
    return await db.oneOrNone(
        `SELECT * FROM cl_measurements WHERE measurement_id = $1`,
        [measurementId]
    );
}

/**
 * Get measurements by session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array>} Array of measurement objects
 */
export async function getMeasurementsBySession(sessionId) {
    return await db.any(
        `SELECT measurement_id, user_id, topic_id, measured_at,
                sr_normalized, pf_normalized, bh_normalized, ph_normalized,
                cl_index, cl_category
         FROM cl_measurements
         WHERE session_id = $1
         ORDER BY measured_at ASC`,
        [sessionId]
    );
}

/**
 * Get measurements by user with filters
 * @param {string} userId - User ID
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Array of measurement objects
 */
export async function getMeasurementsByUser(userId, options = {}) {
    const {
        start_date = null,
        end_date = null,
        topic_id = null,
        cl_category = null,
        limit = 100,
        offset = 0,
    } = options;

    let query = `
        SELECT measurement_id, session_id, topic_id, quiz_id, measured_at,
               sr_normalized, pf_normalized, bh_normalized, ph_normalized,
               cl_index, cl_category
        FROM cl_measurements
        WHERE user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (start_date) {
        query += ` AND measured_at >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
    }

    if (end_date) {
        query += ` AND measured_at <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
    }

    if (topic_id) {
        query += ` AND topic_id = $${paramIndex}`;
        params.push(topic_id);
        paramIndex++;
    }

    if (cl_category) {
        query += ` AND cl_category = $${paramIndex}`;
        params.push(cl_category);
        paramIndex++;
    }

    query += ` ORDER BY measured_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    return await db.any(query, params);
}

/**
 * Get measurements by topic
 * @param {string} topicId - Topic ID
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Array of measurement objects
 */
export async function getMeasurementsByTopic(topicId, options = {}) {
    const { start_date = null, end_date = null, limit = 100, offset = 0 } = options;

    let query = `
        SELECT measurement_id, user_id, session_id, measured_at,
               cl_index, cl_category
        FROM cl_measurements
        WHERE topic_id = $1
    `;

    const params = [topicId];
    let paramIndex = 2;

    if (start_date) {
        query += ` AND measured_at >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
    }

    if (end_date) {
        query += ` AND measured_at <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
    }

    query += ` ORDER BY measured_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    return await db.any(query, params);
}

/**
 * Get user CL statistics
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} CL statistics
 */
export async function getUserCLStatistics(userId, startDate, endDate) {
    const stats = await db.one(
        `SELECT
            COUNT(*) as total_measurements,
            AVG(cl_index) as avg_cl_index,
            MIN(cl_index) as min_cl_index,
            MAX(cl_index) as max_cl_index,
            COUNT(CASE WHEN cl_category = 'low' THEN 1 END) as low_count,
            COUNT(CASE WHEN cl_category = 'optimal' THEN 1 END) as optimal_count,
            COUNT(CASE WHEN cl_category = 'high' THEN 1 END) as high_count,
            COUNT(CASE WHEN cl_category = 'overload' THEN 1 END) as overload_count,
            AVG(sr_normalized) as avg_sr,
            AVG(pf_normalized) as avg_pf,
            AVG(bh_normalized) as avg_bh
         FROM cl_measurements
         WHERE user_id = $1 AND measured_at >= $2 AND measured_at <= $3`,
        [userId, startDate, endDate]
    );

    return {
        total_measurements: parseInt(stats.total_measurements) || 0,
        avg_cl_index: parseFloat(stats.avg_cl_index) || 0,
        min_cl_index: parseFloat(stats.min_cl_index) || 0,
        max_cl_index: parseFloat(stats.max_cl_index) || 0,
        low_count: parseInt(stats.low_count) || 0,
        optimal_count: parseInt(stats.optimal_count) || 0,
        high_count: parseInt(stats.high_count) || 0,
        overload_count: parseInt(stats.overload_count) || 0,
        avg_sr: parseFloat(stats.avg_sr) || 0,
        avg_pf: parseFloat(stats.avg_pf) || 0,
        avg_bh: parseFloat(stats.avg_bh) || 0,
    };
}

/**
 * Get topic CL statistics
 * @param {string} topicId - Topic ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Topic CL statistics
 */
export async function getTopicCLStatistics(topicId, startDate, endDate) {
    const stats = await db.one(
        `SELECT
            COUNT(*) as total_measurements,
            COUNT(DISTINCT user_id) as unique_students,
            AVG(cl_index) as avg_cl_index,
            COUNT(CASE WHEN cl_category = 'overload' THEN 1 END)::FLOAT /
                NULLIF(COUNT(*), 0) as overload_percentage
         FROM cl_measurements
         WHERE topic_id = $1 AND measured_at >= $2 AND measured_at <= $3`,
        [topicId, startDate, endDate]
    );

    return {
        total_measurements: parseInt(stats.total_measurements) || 0,
        unique_students: parseInt(stats.unique_students) || 0,
        avg_cl_index: parseFloat(stats.avg_cl_index) || 0,
        overload_percentage: parseFloat(stats.overload_percentage) || 0,
    };
}

/**
 * Get latest CL measurement for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Latest measurement or null
 */
export async function getLatestMeasurement(userId) {
    return await db.oneOrNone(
        `SELECT measurement_id, session_id, topic_id, measured_at,
                cl_index, cl_category,
                sr_normalized, pf_normalized, bh_normalized, ph_normalized
         FROM cl_measurements
         WHERE user_id = $1
         ORDER BY measured_at DESC
         LIMIT 1`,
        [userId]
    );
}

/**
 * Count measurements for a user
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<number>} Count of measurements
 */
export async function countMeasurements(userId, filters = {}) {
    const { start_date = null, end_date = null, cl_category = null } = filters;

    let query = 'SELECT COUNT(*) as count FROM cl_measurements WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (start_date) {
        query += ` AND measured_at >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
    }

    if (end_date) {
        query += ` AND measured_at <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
    }

    if (cl_category) {
        query += ` AND cl_category = $${paramIndex}`;
        params.push(cl_category);
        paramIndex++;
    }

    const result = await db.one(query, params);
    return parseInt(result.count);
}

/**
 * Delete old measurements (cleanup)
 * @param {Date} beforeDate - Delete measurements before this date
 * @returns {Promise<number>} Number of deleted measurements
 */
export async function deleteOldMeasurements(beforeDate) {
    const result = await db.result(
        `DELETE FROM cl_measurements WHERE measured_at < $1`,
        [beforeDate]
    );

    return result.rowCount;
}
