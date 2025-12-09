// Topics model - handles subject/topic management
import db from '../config/db.js';

/**
 * Create a new topic
 * @param {Object} topicData - Topic data
 * @returns {Promise<Object>} Created topic object
 */
export async function createTopic(topicData) {
    const {
        name,
        description = null,
        subject,
        grade_level = null,
        difficulty_level = null,
        teacher_id,
        institution_id,
        estimated_duration_mins = null,
        learning_objectives = [],
        prerequisites = [],
        metadata = {},
    } = topicData;

    const topic = await db.one(
        `INSERT INTO topics
         (name, description, subject, grade_level, difficulty_level, teacher_id,
          institution_id, estimated_duration_mins, learning_objectives, prerequisites, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING topic_id, name, description, subject, grade_level, difficulty_level,
                   teacher_id, institution_id, estimated_duration_mins, is_active, created_at`,
        [name, description, subject, grade_level, difficulty_level, teacher_id,
         institution_id, estimated_duration_mins, learning_objectives, prerequisites, metadata]
    );

    return topic;
}

/**
 * Get topic by ID
 * @param {string} topicId - Topic ID
 * @returns {Promise<Object|null>} Topic object or null
 */
export async function getTopicById(topicId) {
    return await db.oneOrNone(
        `SELECT topic_id, name, description, subject, grade_level, difficulty_level,
                teacher_id, institution_id, estimated_duration_mins,
                learning_objectives, prerequisites, is_active, metadata,
                created_at, updated_at
         FROM topics
         WHERE topic_id = $1`,
        [topicId]
    );
}

/**
 * Get all topics with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of topic objects
 */
export async function getTopics(filters = {}) {
    const {
        teacher_id = null,
        institution_id = null,
        subject = null,
        grade_level = null,
        is_active = true,
        limit = 100,
        offset = 0,
    } = filters;

    let query = `
        SELECT topic_id, name, description, subject, grade_level, difficulty_level,
               teacher_id, institution_id, estimated_duration_mins, is_active,
               created_at, updated_at
        FROM topics
        WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (is_active !== null) {
        query += ` AND is_active = $${paramIndex}`;
        params.push(is_active);
        paramIndex++;
    }

    if (teacher_id) {
        query += ` AND teacher_id = $${paramIndex}`;
        params.push(teacher_id);
        paramIndex++;
    }

    if (institution_id) {
        query += ` AND institution_id = $${paramIndex}`;
        params.push(institution_id);
        paramIndex++;
    }

    if (subject) {
        query += ` AND subject = $${paramIndex}`;
        params.push(subject);
        paramIndex++;
    }

    if (grade_level) {
        query += ` AND grade_level = $${paramIndex}`;
        params.push(grade_level);
        paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    return await db.any(query, params);
}

/**
 * Get topics by teacher
 * @param {string} teacherId - Teacher user ID
 * @returns {Promise<Array>} Array of topic objects
 */
export async function getTopicsByTeacher(teacherId) {
    return await db.any(
        `SELECT topic_id, name, description, subject, grade_level, difficulty_level,
                estimated_duration_mins, is_active, created_at
         FROM topics
         WHERE teacher_id = $1 AND is_active = true
         ORDER BY name ASC`,
        [teacherId]
    );
}

/**
 * Get topics by institution
 * @param {string} institutionId - Institution ID
 * @returns {Promise<Array>} Array of topic objects
 */
export async function getTopicsByInstitution(institutionId) {
    return await db.any(
        `SELECT topic_id, name, description, subject, grade_level, difficulty_level,
                teacher_id, estimated_duration_mins, is_active, created_at
         FROM topics
         WHERE institution_id = $1 AND is_active = true
         ORDER BY subject, name ASC`,
        [institutionId]
    );
}

/**
 * Update topic
 * @param {string} topicId - Topic ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated topic object
 */
export async function updateTopic(topicId, updateData) {
    const allowedFields = [
        'name', 'description', 'subject', 'grade_level', 'difficulty_level',
        'estimated_duration_mins', 'learning_objectives', 'prerequisites',
        'is_active', 'metadata'
    ];

    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
            updates.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    if (updates.length === 0) {
        throw new Error('No valid fields to update');
    }

    values.push(topicId);

    const topic = await db.one(
        `UPDATE topics
         SET ${updates.join(', ')}
         WHERE topic_id = $${paramIndex}
         RETURNING topic_id, name, description, subject, grade_level, difficulty_level,
                   teacher_id, institution_id, estimated_duration_mins, is_active,
                   created_at, updated_at`,
        values
    );

    return topic;
}

/**
 * Delete topic (soft delete by setting is_active to false)
 * @param {string} topicId - Topic ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTopic(topicId) {
    await db.none(
        `UPDATE topics SET is_active = false WHERE topic_id = $1`,
        [topicId]
    );

    return true;
}

/**
 * Permanently delete topic
 * @param {string} topicId - Topic ID
 * @returns {Promise<boolean>} Success status
 */
export async function permanentlyDeleteTopic(topicId) {
    await db.none(
        `DELETE FROM topics WHERE topic_id = $1`,
        [topicId]
    );

    return true;
}

/**
 * Get topic statistics
 * @param {string} topicId - Topic ID
 * @returns {Promise<Object>} Topic statistics
 */
export async function getTopicStatistics(topicId) {
    const stats = await db.one(
        `SELECT
            t.topic_id,
            t.name,
            COUNT(DISTINCT ls.session_id) as total_sessions,
            COUNT(DISTINCT ls.user_id) as unique_students,
            COUNT(DISTINCT q.quiz_id) as quiz_count,
            AVG(clm.cl_index) as avg_cl_index,
            COUNT(CASE WHEN clm.cl_category = 'overload' THEN 1 END)::FLOAT /
                NULLIF(COUNT(clm.measurement_id), 0) as overload_percentage
         FROM topics t
         LEFT JOIN learning_sessions ls ON t.topic_id = ls.topic_id
         LEFT JOIN quizzes q ON t.topic_id = q.topic_id
         LEFT JOIN cl_measurements clm ON t.topic_id = clm.topic_id
         WHERE t.topic_id = $1
         GROUP BY t.topic_id, t.name`,
        [topicId]
    );

    return {
        topic_id: stats.topic_id,
        name: stats.name,
        total_sessions: parseInt(stats.total_sessions) || 0,
        unique_students: parseInt(stats.unique_students) || 0,
        quiz_count: parseInt(stats.quiz_count) || 0,
        avg_cl_index: parseFloat(stats.avg_cl_index) || null,
        overload_percentage: parseFloat(stats.overload_percentage) || 0,
    };
}

/**
 * Count topics with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<number>} Count of topics
 */
export async function countTopics(filters = {}) {
    const {
        teacher_id = null,
        institution_id = null,
        subject = null,
        is_active = true,
    } = filters;

    let query = 'SELECT COUNT(*) as count FROM topics WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (is_active !== null) {
        query += ` AND is_active = $${paramIndex}`;
        params.push(is_active);
        paramIndex++;
    }

    if (teacher_id) {
        query += ` AND teacher_id = $${paramIndex}`;
        params.push(teacher_id);
        paramIndex++;
    }

    if (institution_id) {
        query += ` AND institution_id = $${paramIndex}`;
        params.push(institution_id);
        paramIndex++;
    }

    if (subject) {
        query += ` AND subject = $${paramIndex}`;
        params.push(subject);
        paramIndex++;
    }

    const result = await db.one(query, params);
    return parseInt(result.count);
}

/**
 * Get unique subjects
 * @param {string} institutionId - Optional institution filter
 * @returns {Promise<Array>} Array of unique subjects
 */
export async function getUniqueSubjects(institutionId = null) {
    let query = `
        SELECT DISTINCT subject
        FROM topics
        WHERE is_active = true AND subject IS NOT NULL
    `;

    if (institutionId) {
        query += ` AND institution_id = $1`;
        const results = await db.any(query, [institutionId]);
        return results.map(r => r.subject);
    }

    const results = await db.any(query);
    return results.map(r => r.subject);
}
