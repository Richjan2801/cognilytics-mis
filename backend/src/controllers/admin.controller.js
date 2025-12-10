// Admin controller - handles admin dashboard and system management
import db, { handleDatabaseError } from '../config/db.js';

/**
 * Get admin dashboard overview
 * GET /api/admin/dashboard
 */
export async function getDashboard(req, res) {
    try {
        // Only admins can access
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admins only.',
            });
        }

        // Get user statistics
        const userStats = await db.oneOrNone(
            `SELECT
                COUNT(*) as total_users,
                COUNT(CASE WHEN role = 'student' THEN 1 END) as total_students,
                COUNT(CASE WHEN role = 'teacher' THEN 1 END) as total_teachers,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_7days
             FROM users`
        );

        // Get topic statistics
        const topicStats = await db.oneOrNone(
            `SELECT
                COUNT(*) as total_topics,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_topics,
                COUNT(DISTINCT subject) as unique_subjects,
                COUNT(DISTINCT teacher_id) as teachers_with_topics
             FROM topics`
        );

        // Get quiz statistics
        const quizStats = await db.oneOrNone(
            `SELECT
                COUNT(*) as total_quizzes,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_quizzes,
                COUNT(DISTINCT qa.attempt_id) as total_attempts,
                AVG(qa.score) as avg_score
             FROM quizzes q
             LEFT JOIN quiz_attempts qa ON q.quiz_id = qa.quiz_id`
        );

        // Get session statistics
        const sessionStats = await db.oneOrNone(
            `SELECT
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN ended_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_sessions_7days,
                AVG(duration_seconds / 60.0) as avg_session_duration,
                COUNT(DISTINCT user_id) as unique_session_users
             FROM learning_sessions`
        );

        // Get cognitive load statistics
        const clStats = await db.oneOrNone(
            `SELECT
                COUNT(*) as total_measurements,
                AVG(cl_index) as avg_cl_index,
                COUNT(CASE WHEN cl_category = 'low' THEN 1 END) as low_count,
                COUNT(CASE WHEN cl_category = 'optimal' THEN 1 END) as optimal_count,
                COUNT(CASE WHEN cl_category = 'high' THEN 1 END) as high_count,
                COUNT(CASE WHEN cl_category = 'overload' THEN 1 END) as overload_count,
                COUNT(CASE WHEN measured_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as measurements_24h
             FROM cl_measurements`
        );

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: parseInt(userStats?.total_users || 0),
                    students: parseInt(userStats?.total_students || 0),
                    teachers: parseInt(userStats?.total_teachers || 0),
                    admins: parseInt(userStats?.total_admins || 0),
                    active: parseInt(userStats?.active_users || 0),
                    new_7days: parseInt(userStats?.new_users_7days || 0),
                },
                topics: {
                    total: parseInt(topicStats?.total_topics || 0),
                    active: parseInt(topicStats?.active_topics || 0),
                    unique_subjects: parseInt(topicStats?.unique_subjects || 0),
                    teachers_with_topics: parseInt(topicStats?.teachers_with_topics || 0),
                },
                quizzes: {
                    total: parseInt(quizStats?.total_quizzes || 0),
                    active: parseInt(quizStats?.active_quizzes || 0),
                    total_attempts: parseInt(quizStats?.total_attempts || 0),
                    avg_score: parseFloat(quizStats?.avg_score || 0).toFixed(2),
                },
                sessions: {
                    total: parseInt(sessionStats?.total_sessions || 0),
                    recent_7days: parseInt(sessionStats?.recent_sessions_7days || 0),
                    avg_duration: parseFloat(sessionStats?.avg_session_duration || 0).toFixed(2),
                    unique_users: parseInt(sessionStats?.unique_session_users || 0),
                },
                cognitive_load: {
                    total_measurements: parseInt(clStats?.total_measurements || 0),
                    avg_cl_index: parseFloat(clStats?.avg_cl_index || 0).toFixed(2),
                    measurements_24h: parseInt(clStats?.measurements_24h || 0),
                    distribution: {
                        low: parseInt(clStats?.low_count || 0),
                        optimal: parseInt(clStats?.optimal_count || 0),
                        high: parseInt(clStats?.high_count || 0),
                        overload: parseInt(clStats?.overload_count || 0),
                    },
                },
            },
        });
    } catch (error) {
        console.error('Get admin dashboard error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get all users with filters
 * GET /api/admin/users
 */
export async function getUsers(req, res) {
    try {
        // Only admins can access
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admins only.',
            });
        }

        const {
            role = null,
            is_active = null,
            limit = 100,
            offset = 0,
        } = req.query;

        let query = `
            SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.role,
                u.is_active,
                u.created_at,
                u.last_login,
                (SELECT COUNT(*) FROM learning_sessions s WHERE s.user_id = u.user_id) as session_count,
                (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.user_id = u.user_id) as quiz_attempt_count,
                (SELECT AVG(m.cl_index) FROM cl_measurements m WHERE m.user_id = u.user_id) as avg_cl
            FROM users u
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (role) {
            query += ` AND u.role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        if (is_active !== null) {
            query += ` AND u.is_active = $${paramIndex}`;
            params.push(is_active === 'true');
            paramIndex++;
        }

        query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const users = await db.any(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const countParams = [];
        let countIndex = 1;

        if (role) {
            countQuery += ` AND role = $${countIndex}`;
            countParams.push(role);
            countIndex++;
        }

        if (is_active !== null) {
            countQuery += ` AND is_active = $${countIndex}`;
            countParams.push(is_active === 'true');
            countIndex++;
        }

        const totalResult = await db.oneOrNone(countQuery, countParams);
        const total = parseInt(totalResult?.total || 0);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    has_more: total > parseInt(offset) + users.length,
                },
            },
        });
    } catch (error) {
        console.error('Get users error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Activate user
 * POST /api/admin/users/:id/activate
 */
export async function activateUser(req, res) {
    try {
        // Only admins can access
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admins only.',
            });
        }

        const { id } = req.params;

        // Check if user exists
        const user = await db.oneOrNone(
            'SELECT user_id, is_active FROM users WHERE user_id = $1',
            [id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (user.is_active) {
            return res.status(400).json({
                success: false,
                message: 'User is already active',
            });
        }

        // Activate user
        await db.none(
            'UPDATE users SET is_active = true, updated_at = NOW() WHERE user_id = $1',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'User activated successfully',
        });
    } catch (error) {
        console.error('Activate user error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Deactivate user
 * POST /api/admin/users/:id/deactivate
 */
export async function deactivateUser(req, res) {
    try {
        // Only admins can access
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admins only.',
            });
        }

        const { id } = req.params;

        // Prevent deactivating yourself
        if (id === req.user.user_id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account',
            });
        }

        // Check if user exists
        const user = await db.oneOrNone(
            'SELECT user_id, is_active FROM users WHERE user_id = $1',
            [id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (!user.is_active) {
            return res.status(400).json({
                success: false,
                message: 'User is already inactive',
            });
        }

        // Deactivate user
        await db.none(
            'UPDATE users SET is_active = false, updated_at = NOW() WHERE user_id = $1',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'User deactivated successfully',
        });
    } catch (error) {
        console.error('Deactivate user error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get system-wide statistics
 * GET /api/admin/system-stats
 */
export async function getSystemStats(req, res) {
    try {
        // Only admins can access
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admins only.',
            });
        }

        const { days = 30 } = req.query;
        const dayRange = parseInt(days);

        // Get daily active users
        const dailyActiveUsers = await db.any(
            `SELECT
                DATE(last_login) as date,
                COUNT(DISTINCT user_id) as active_users
             FROM users
             WHERE last_login >= NOW() - INTERVAL '1 day' * $1
             GROUP BY DATE(last_login)
             ORDER BY date DESC`,
            [dayRange]
        );

        // Get daily session activity
        const dailySessions = await db.any(
            `SELECT
                DATE(started_at) as date,
                COUNT(*) as session_count,
                COUNT(DISTINCT user_id) as unique_users,
                AVG(duration_seconds / 60.0) as avg_duration
             FROM learning_sessions
             WHERE started_at >= NOW() - INTERVAL '1 day' * $1
             GROUP BY DATE(started_at)
             ORDER BY date DESC`,
            [dayRange]
        );

        // Get daily quiz activity
        const dailyQuizzes = await db.any(
            `SELECT
                DATE(qa.started_at) as date,
                COUNT(*) as quiz_attempts,
                AVG(qa.score) as avg_score,
                COUNT(CASE WHEN (qa.score / q.max_score * 100) >= q.passing_score THEN 1 END)::float /
                    NULLIF(COUNT(qa.attempt_id), 0) * 100 as pass_rate
             FROM quiz_attempts qa
             JOIN quizzes q ON qa.quiz_id = q.quiz_id
             WHERE qa.started_at >= NOW() - INTERVAL '1 day' * $1
             GROUP BY DATE(qa.started_at)
             ORDER BY date DESC`,
            [dayRange]
        );

        // Get database size statistics
        const dbStats = await db.oneOrNone(
            `SELECT
                (SELECT COUNT(*) FROM users) as user_count,
                (SELECT COUNT(*) FROM topics) as topic_count,
                (SELECT COUNT(*) FROM learning_sessions) as session_count,
                (SELECT COUNT(*) FROM cl_measurements) as measurement_count,
                (SELECT COUNT(*) FROM quizzes) as quiz_count,
                (SELECT COUNT(*) FROM quiz_questions) as question_count,
                (SELECT COUNT(*) FROM quiz_attempts) as attempt_count`
        );

        res.status(200).json({
            success: true,
            data: {
                time_range_days: dayRange,
                daily_active_users: dailyActiveUsers,
                daily_sessions: dailySessions,
                daily_quizzes: dailyQuizzes,
                database_stats: {
                    users: parseInt(dbStats?.user_count || 0),
                    topics: parseInt(dbStats?.topic_count || 0),
                    sessions: parseInt(dbStats?.session_count || 0),
                    measurements: parseInt(dbStats?.measurement_count || 0),
                    quizzes: parseInt(dbStats?.quiz_count || 0),
                    questions: parseInt(dbStats?.question_count || 0),
                    quiz_attempts: parseInt(dbStats?.attempt_count || 0),
                },
            },
        });
    } catch (error) {
        console.error('Get system stats error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get cognitive load trends across the system
 * GET /api/admin/cl-trends
 */
export async function getCLTrends(req, res) {
    try {
        // Only admins can access
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admins only.',
            });
        }

        const { days = 30 } = req.query;
        const dayRange = parseInt(days);

        // Get daily CL trends
        const dailyTrends = await db.any(
            `SELECT
                DATE(measured_at) as date,
                AVG(cl_index) as avg_cl,
                MIN(cl_index) as min_cl,
                MAX(cl_index) as max_cl,
                STDDEV(cl_index) as stddev_cl,
                COUNT(*) as measurement_count,
                COUNT(CASE WHEN cl_category = 'low' THEN 1 END) as low_count,
                COUNT(CASE WHEN cl_category = 'optimal' THEN 1 END) as optimal_count,
                COUNT(CASE WHEN cl_category = 'high' THEN 1 END) as high_count,
                COUNT(CASE WHEN cl_category = 'overload' THEN 1 END) as overload_count
             FROM cl_measurements
             WHERE measured_at >= NOW() - INTERVAL '1 day' * $1
             GROUP BY DATE(measured_at)
             ORDER BY date DESC`,
            [dayRange]
        );

        // Get CL distribution by subject
        const subjectDistribution = await db.any(
            `SELECT
                t.subject,
                COUNT(*) as measurement_count,
                AVG(m.cl_index) as avg_cl,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END)::float /
                    NULLIF(COUNT(m.measurement_id), 0) * 100 as overload_rate
             FROM cl_measurements m
             JOIN learning_sessions s ON m.session_id = s.session_id
             JOIN topics t ON s.topic_id = t.topic_id
             WHERE m.measured_at >= NOW() - INTERVAL '1 day' * $1
             GROUP BY t.subject
             ORDER BY avg_cl DESC`,
            [dayRange]
        );

        // Get CL distribution by difficulty level
        const difficultyDistribution = await db.any(
            `SELECT
                t.difficulty_level,
                COUNT(*) as measurement_count,
                AVG(m.cl_index) as avg_cl,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END)::float /
                    NULLIF(COUNT(m.measurement_id), 0) * 100 as overload_rate
             FROM cl_measurements m
             JOIN learning_sessions s ON m.session_id = s.session_id
             JOIN topics t ON s.topic_id = t.topic_id
             WHERE m.measured_at >= NOW() - INTERVAL '1 day' * $1
             GROUP BY t.difficulty_level
             ORDER BY t.difficulty_level`,
            [dayRange]
        );

        // Get overall statistics
        const overallStats = await db.oneOrNone(
            `SELECT
                AVG(cl_index) as avg_cl,
                STDDEV(cl_index) as stddev_cl,
                COUNT(*) as total_measurements,
                COUNT(DISTINCT user_id) as unique_students,
                COUNT(CASE WHEN cl_category = 'overload' THEN 1 END)::float /
                    NULLIF(COUNT(measurement_id), 0) * 100 as overload_rate
             FROM cl_measurements
             WHERE measured_at >= NOW() - INTERVAL '1 day' * $1`,
            [dayRange]
        );

        res.status(200).json({
            success: true,
            data: {
                time_range_days: dayRange,
                overall_stats: {
                    avg_cl: parseFloat(overallStats?.avg_cl || 0).toFixed(2),
                    stddev_cl: parseFloat(overallStats?.stddev_cl || 0).toFixed(2),
                    total_measurements: parseInt(overallStats?.total_measurements || 0),
                    unique_students: parseInt(overallStats?.unique_students || 0),
                    overload_rate: parseFloat(overallStats?.overload_rate || 0).toFixed(2),
                },
                daily_trends: dailyTrends,
                subject_distribution: subjectDistribution,
                difficulty_distribution: difficultyDistribution,
            },
        });
    } catch (error) {
        console.error('Get CL trends error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}
