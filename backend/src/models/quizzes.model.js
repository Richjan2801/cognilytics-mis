// Quizzes model - handles quiz and quiz question management
import db from '../config/db.js';

/**
 * Create a new quiz
 * @param {Object} quizData - Quiz data
 * @returns {Promise<Object>} Created quiz object
 */
export async function createQuiz(quizData) {
    const {
        topic_id,
        title,
        description = null,
        time_limit_mins = null,
        passing_score = 70.00,
        total_points = 100,
        created_by,
        settings = {},
    } = quizData;

    const quiz = await db.one(
        `INSERT INTO quizzes
         (topic_id, title, description, time_limit_mins, passing_score,
          total_points, created_by, settings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING quiz_id, topic_id, title, description, time_limit_mins,
                   passing_score, total_points, question_count, is_active, created_at`,
        [topic_id, title, description, time_limit_mins, passing_score,
         total_points, created_by, settings]
    );

    return quiz;
}

/**
 * Get quiz by ID
 * @param {string} quizId - Quiz ID
 * @returns {Promise<Object|null>} Quiz object or null
 */
export async function getQuizById(quizId) {
    return await db.oneOrNone(
        `SELECT quiz_id, topic_id, title, description, time_limit_mins,
                passing_score, total_points, question_count, created_by,
                is_active, settings, created_at, updated_at
         FROM quizzes
         WHERE quiz_id = $1`,
        [quizId]
    );
}

/**
 * Get quizzes with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of quiz objects
 */
export async function getQuizzes(filters = {}) {
    const {
        topic_id = null,
        created_by = null,
        is_active = true,
        limit = 100,
        offset = 0,
    } = filters;

    let query = `
        SELECT q.quiz_id, q.topic_id, q.title, q.description,
               q.time_limit_mins, q.passing_score, q.total_points,
               q.question_count, q.created_by, q.is_active,
               q.created_at, q.updated_at,
               t.name as topic_name,
               u.first_name || ' ' || u.last_name as creator_name
        FROM quizzes q
        LEFT JOIN topics t ON q.topic_id = t.topic_id
        LEFT JOIN users u ON q.created_by = u.user_id
        WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (is_active !== null) {
        query += ` AND q.is_active = $${paramIndex}`;
        params.push(is_active);
        paramIndex++;
    }

    if (topic_id) {
        query += ` AND q.topic_id = $${paramIndex}`;
        params.push(topic_id);
        paramIndex++;
    }

    if (created_by) {
        query += ` AND q.created_by = $${paramIndex}`;
        params.push(created_by);
        paramIndex++;
    }

    query += ` ORDER BY q.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    return await db.any(query, params);
}

/**
 * Get quizzes by topic
 * @param {string} topicId - Topic ID
 * @returns {Promise<Array>} Array of quiz objects
 */
export async function getQuizzesByTopic(topicId) {
    return await db.any(
        `SELECT quiz_id, topic_id, title, description, time_limit_mins,
                passing_score, total_points, question_count, is_active, created_at
         FROM quizzes
         WHERE topic_id = $1 AND is_active = true
         ORDER BY created_at DESC`,
        [topicId]
    );
}

/**
 * Update quiz
 * @param {string} quizId - Quiz ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated quiz object
 */
export async function updateQuiz(quizId, updateData) {
    const allowedFields = [
        'title', 'description', 'time_limit_mins', 'passing_score',
        'total_points', 'is_active', 'settings'
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

    values.push(quizId);

    const quiz = await db.one(
        `UPDATE quizzes
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE quiz_id = $${paramIndex}
         RETURNING quiz_id, topic_id, title, description, time_limit_mins,
                   passing_score, total_points, question_count, is_active,
                   created_at, updated_at`,
        values
    );

    return quiz;
}

/**
 * Delete quiz (soft delete)
 * @param {string} quizId - Quiz ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteQuiz(quizId) {
    await db.none(
        `UPDATE quizzes SET is_active = false, updated_at = NOW() WHERE quiz_id = $1`,
        [quizId]
    );

    return true;
}

/**
 * Count quizzes with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<number>} Count of quizzes
 */
export async function countQuizzes(filters = {}) {
    const {
        topic_id = null,
        created_by = null,
        is_active = true,
    } = filters;

    let query = 'SELECT COUNT(*) as count FROM quizzes WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (is_active !== null) {
        query += ` AND is_active = $${paramIndex}`;
        params.push(is_active);
        paramIndex++;
    }

    if (topic_id) {
        query += ` AND topic_id = $${paramIndex}`;
        params.push(topic_id);
        paramIndex++;
    }

    if (created_by) {
        query += ` AND created_by = $${paramIndex}`;
        params.push(created_by);
        paramIndex++;
    }

    const result = await db.one(query, params);
    return parseInt(result.count);
}

// ===== Quiz Questions =====

/**
 * Add question to quiz
 * @param {Object} questionData - Question data
 * @returns {Promise<Object>} Created question object
 */
export async function addQuizQuestion(questionData) {
    const {
        quiz_id,
        question_text,
        question_type,
        options = null,
        correct_answer,
        points = 1,
        order_index = null,
        explanation = null,
    } = questionData;

    const question = await db.one(
        `INSERT INTO quiz_questions
         (quiz_id, question_text, question_type, options, correct_answer,
          points, order_index, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING question_id, quiz_id, question_text, question_type,
                   options, points, order_index, created_at`,
        [quiz_id, question_text, question_type, options, correct_answer,
         points, order_index, explanation]
    );

    // Update question count in quiz
    await db.none(
        `UPDATE quizzes
         SET question_count = (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = $1),
             updated_at = NOW()
         WHERE quiz_id = $1`,
        [quiz_id]
    );

    return question;
}

/**
 * Get questions for a quiz
 * @param {string} quizId - Quiz ID
 * @param {boolean} includeAnswers - Include correct answers (for teachers)
 * @returns {Promise<Array>} Array of question objects
 */
export async function getQuizQuestions(quizId, includeAnswers = false) {
    if (includeAnswers) {
        return await db.any(
            `SELECT question_id, quiz_id, question_text, question_type,
                    options, correct_answer, points, order_index,
                    explanation, created_at
             FROM quiz_questions
             WHERE quiz_id = $1
             ORDER BY order_index ASC, created_at ASC`,
            [quizId]
        );
    }

    // For students - don't include correct answers
    return await db.any(
        `SELECT question_id, quiz_id, question_text, question_type,
                options, points, order_index, created_at
         FROM quiz_questions
         WHERE quiz_id = $1
         ORDER BY order_index ASC, created_at ASC`,
        [quizId]
    );
}

/**
 * Update quiz question
 * @param {string} questionId - Question ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated question object
 */
export async function updateQuizQuestion(questionId, updateData) {
    const allowedFields = [
        'question_text', 'question_type', 'options', 'correct_answer',
        'points', 'order_index', 'explanation'
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

    values.push(questionId);

    const question = await db.one(
        `UPDATE quiz_questions
         SET ${updates.join(', ')}
         WHERE question_id = $${paramIndex}
         RETURNING question_id, quiz_id, question_text, question_type,
                   options, correct_answer, points, order_index, explanation`,
        values
    );

    return question;
}

/**
 * Delete quiz question
 * @param {string} questionId - Question ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteQuizQuestion(questionId) {
    // Get quiz_id before deleting
    const question = await db.oneOrNone(
        'SELECT quiz_id FROM quiz_questions WHERE question_id = $1',
        [questionId]
    );

    if (!question) {
        throw new Error('Question not found');
    }

    await db.none(
        'DELETE FROM quiz_questions WHERE question_id = $1',
        [questionId]
    );

    // Update question count
    await db.none(
        `UPDATE quizzes
         SET question_count = (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = $1),
             updated_at = NOW()
         WHERE quiz_id = $1`,
        [question.quiz_id]
    );

    return true;
}

// ===== Quiz Attempts =====

/**
 * Create quiz attempt
 * @param {Object} attemptData - Attempt data
 * @returns {Promise<Object>} Created attempt object
 */
export async function createQuizAttempt(attemptData) {
    const {
        quiz_id,
        user_id,
        session_id = null,
    } = attemptData;

    const attempt = await db.one(
        `INSERT INTO quiz_attempts
         (quiz_id, user_id, session_id, started_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING attempt_id, quiz_id, user_id, session_id, started_at`,
        [quiz_id, user_id, session_id]
    );

    return attempt;
}

/**
 * Submit quiz attempt
 * @param {string} attemptId - Attempt ID
 * @param {Object} submissionData - Submission data
 * @returns {Promise<Object>} Updated attempt object
 */
export async function submitQuizAttempt(attemptId, submissionData) {
    const {
        answers,
        score,
        max_score,
        passed,
    } = submissionData;

    const attempt = await db.one(
        `UPDATE quiz_attempts
         SET completed_at = NOW(),
             duration_mins = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60,
             answers = $2,
             score = $3,
             max_score = $4,
             passed = $5
         WHERE attempt_id = $1
         RETURNING attempt_id, quiz_id, user_id, session_id, started_at,
                   completed_at, duration_mins, score, max_score, passed`,
        [attemptId, answers, score, max_score, passed]
    );

    return attempt;
}

/**
 * Get quiz attempts by user
 * @param {string} userId - User ID
 * @param {string} quizId - Optional quiz ID filter
 * @returns {Promise<Array>} Array of attempt objects
 */
export async function getQuizAttemptsByUser(userId, quizId = null) {
    let query = `
        SELECT qa.attempt_id, qa.quiz_id, qa.user_id, qa.session_id,
               qa.started_at, qa.completed_at, qa.duration_mins,
               qa.score, qa.max_score, qa.passed,
               q.title as quiz_title,
               q.passing_score
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.quiz_id
        WHERE qa.user_id = $1
    `;

    const params = [userId];

    if (quizId) {
        query += ' AND qa.quiz_id = $2';
        params.push(quizId);
    }

    query += ' ORDER BY qa.started_at DESC';

    return await db.any(query, params);
}

/**
 * Get quiz attempt by ID
 * @param {string} attemptId - Attempt ID
 * @returns {Promise<Object|null>} Attempt object or null
 */
export async function getQuizAttemptById(attemptId) {
    return await db.oneOrNone(
        `SELECT attempt_id, quiz_id, user_id, session_id, started_at,
                completed_at, duration_mins, answers, score, max_score, passed
         FROM quiz_attempts
         WHERE attempt_id = $1`,
        [attemptId]
    );
}
