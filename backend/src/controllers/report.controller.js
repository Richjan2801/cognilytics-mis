// Report controller - handles report generation and analytics
import { validationResult } from 'express-validator';
import db, { handleDatabaseError } from '../config/db.js';

/**
 * Get teacher dashboard overview
 * GET /api/reports/teacher/dashboard
 */
export async function getTeacherDashboard(req, res) {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { start_date, end_date } = req.query;
        const teacherId = req.user.user_id;

        // Build date filter
        let dateFilter = '';
        let dateParams = [];
        if (start_date && end_date) {
            dateFilter = 'AND s.started_at BETWEEN $1 AND $2';
            dateParams = [start_date, end_date];
        } else if (start_date) {
            dateFilter = 'AND s.started_at >= $1';
            dateParams = [start_date];
        } else if (end_date) {
            dateFilter = 'AND s.started_at <= $1';
            dateParams = [end_date];
        }

        // Get dashboard statistics
        const stats = await db.oneOrNone(
            `SELECT
                COUNT(DISTINCT s.user_id) as total_students,
                COUNT(DISTINCT s.session_id) as total_sessions,
                COUNT(DISTINCT t.topic_id) as total_topics,
                AVG(s.duration_seconds / 60.0) as avg_session_duration,
                AVG(m.cl_index) as avg_cl,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count,
                COUNT(m.measurement_id) as total_measurements
             FROM topics t
             LEFT JOIN learning_sessions s ON t.topic_id = s.topic_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             WHERE t.teacher_id = $${dateParams.length + 1} ${dateFilter}`,
            [...dateParams, teacherId]
        );

        // Get recent sessions
        const recentSessions = await db.any(
            `SELECT
                s.session_id,
                s.started_at,
                s.duration_seconds,
                t.name as topic_name,
                u.first_name || ' ' || u.last_name as student_name,
                AVG(m.cl_index) as avg_cl
             FROM learning_sessions s
             JOIN topics t ON s.topic_id = t.topic_id
             JOIN users u ON s.user_id = u.user_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             WHERE t.teacher_id = $1
             GROUP BY s.session_id, s.started_at, s.duration_seconds, t.name, u.first_name, u.last_name
             ORDER BY s.started_at DESC
             LIMIT 10`,
            [teacherId]
        );

        // Get CL trends (last 30 days)
        const clTrends = await db.any(
            `SELECT
                DATE(m.measured_at) as date,
                AVG(m.cl_index) as avg_cl,
                COUNT(*) as measurement_count
             FROM cl_measurements m
             JOIN learning_sessions s ON m.session_id = s.session_id
             JOIN topics t ON s.topic_id = t.topic_id
             WHERE t.teacher_id = $1
               AND m.measured_at >= NOW() - INTERVAL '30 days'
             GROUP BY DATE(m.measured_at)
             ORDER BY date DESC`,
            [teacherId]
        );

        res.status(200).json({
            success: true,
            data: {
                statistics: {
                    total_students: parseInt(stats?.total_students || 0),
                    total_sessions: parseInt(stats?.total_sessions || 0),
                    total_topics: parseInt(stats?.total_topics || 0),
                    avg_session_duration: parseFloat(stats?.avg_session_duration || 0).toFixed(2),
                    avg_cl: parseFloat(stats?.avg_cl || 0).toFixed(2),
                    overload_count: parseInt(stats?.overload_count || 0),
                    total_measurements: parseInt(stats?.total_measurements || 0),
                },
                recent_sessions: recentSessions,
                cl_trends: clTrends,
            },
        });
    } catch (error) {
        console.error('Get teacher dashboard error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get admin dashboard overview
 * GET /api/reports/admin/dashboard
 */
export async function getAdminDashboard(req, res) {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { start_date, end_date } = req.query;

        // Build date filter
        let dateFilter = '';
        let dateParams = [];
        if (start_date && end_date) {
            dateFilter = 'AND s.started_at BETWEEN $1 AND $2';
            dateParams = [start_date, end_date];
        } else if (start_date) {
            dateFilter = 'AND s.started_at >= $1';
            dateParams = [start_date];
        } else if (end_date) {
            dateFilter = 'AND s.started_at <= $1';
            dateParams = [end_date];
        }

        // Get system-wide statistics
        const stats = await db.oneOrNone(
            `SELECT
                COUNT(DISTINCT u.user_id) as total_users,
                COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.user_id END) as total_students,
                COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.user_id END) as total_teachers,
                COUNT(DISTINCT s.session_id) as total_sessions,
                COUNT(DISTINCT t.topic_id) as total_topics,
                COUNT(DISTINCT i.institution_id) as total_institutions,
                AVG(s.duration_seconds / 60.0) as avg_session_duration,
                AVG(m.cl_index) as avg_cl,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count,
                COUNT(m.measurement_id) as total_measurements
             FROM users u
             LEFT JOIN learning_sessions s ON u.user_id = s.user_id
             LEFT JOIN topics t ON s.topic_id = t.topic_id
             LEFT JOIN institutions i ON u.institution_id = i.institution_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             WHERE 1=1 ${dateFilter}`,
            dateParams
        );

        // Get institution breakdown
        const institutionStats = await db.any(
            `SELECT
                i.name as institution_name,
                COUNT(DISTINCT u.user_id) as total_users,
                COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.user_id END) as students,
                COUNT(DISTINCT CASE WHEN u.role = 'teacher' THEN u.user_id END) as teachers,
                COUNT(DISTINCT s.session_id) as sessions,
                AVG(m.cl_index) as avg_cl
             FROM institutions i
             LEFT JOIN users u ON i.institution_id = u.institution_id
             LEFT JOIN learning_sessions s ON u.user_id = s.user_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             GROUP BY i.institution_id, i.name
             ORDER BY total_users DESC`,
            []
        );

        // Get system CL trends (last 30 days)
        const clTrends = await db.any(
            `SELECT
                DATE(m.measured_at) as date,
                AVG(m.cl_index) as avg_cl,
                COUNT(*) as measurement_count,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count
             FROM cl_measurements m
             WHERE m.measured_at >= NOW() - INTERVAL '30 days'
             GROUP BY DATE(m.measured_at)
             ORDER BY date DESC`,
            []
        );

        res.status(200).json({
            success: true,
            data: {
                system_statistics: {
                    total_users: parseInt(stats?.total_users || 0),
                    total_students: parseInt(stats?.total_students || 0),
                    total_teachers: parseInt(stats?.total_teachers || 0),
                    total_sessions: parseInt(stats?.total_sessions || 0),
                    total_topics: parseInt(stats?.total_topics || 0),
                    total_institutions: parseInt(stats?.total_institutions || 0),
                    avg_session_duration: parseFloat(stats?.avg_session_duration || 0).toFixed(2),
                    avg_cl: parseFloat(stats?.avg_cl || 0).toFixed(2),
                    overload_count: parseInt(stats?.overload_count || 0),
                    total_measurements: parseInt(stats?.total_measurements || 0),
                },
                institution_breakdown: institutionStats,
                cl_trends: clTrends,
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
 * Get CL trends over time
 * GET /api/reports/trends/:entityType/:entityId?
 */
export async function getCLTrends(req, res) {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { entityType, entityId } = req.params;
        const { period = 'daily', start_date, end_date } = req.query;

        // Build date filter
        let dateFilter = '';
        let dateParams = [];
        if (start_date && end_date) {
            dateFilter = 'AND m.measured_at BETWEEN $1 AND $2';
            dateParams = [start_date, end_date];
        } else if (start_date) {
            dateFilter = 'AND m.measured_at >= $1';
            dateParams = [start_date];
        } else if (end_date) {
            dateFilter = 'AND m.measured_at <= $1';
            dateParams = [end_date];
        } else {
            // Default to last 30 days
            dateFilter = 'AND m.measured_at >= NOW() - INTERVAL \'30 days\'';
        }

        // Build entity filter
        let entityFilter = '';
        let entityParams = [];
        let groupBy = '';

        if (entityType === 'user') {
            if (entityId) {
                entityFilter = 'AND m.user_id = $1';
                entityParams = [entityId];
                groupBy = 'DATE(m.measured_at)';
            } else {
                groupBy = 'm.user_id, DATE(m.measured_at)';
            }
        } else if (entityType === 'topic') {
            if (entityId) {
                entityFilter = 'AND s.topic_id = $1';
                entityParams = [entityId];
                groupBy = 'DATE(m.measured_at)';
            } else {
                groupBy = 's.topic_id, DATE(m.measured_at)';
            }
        } else if (entityType === 'system') {
            groupBy = 'DATE(m.measured_at)';
        }

        // Determine grouping based on period
        let timeGroup = 'DATE(m.measured_at)';
        if (period === 'weekly') {
            timeGroup = 'DATE_TRUNC(\'week\', m.measured_at)';
        } else if (period === 'monthly') {
            timeGroup = 'DATE_TRUNC(\'month\', m.measured_at)';
        }

        const trends = await db.any(
            `SELECT
                ${timeGroup} as time_period,
                AVG(m.cl_index) as avg_cl,
                MIN(m.cl_index) as min_cl,
                MAX(m.cl_index) as max_cl,
                COUNT(*) as measurement_count,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count,
                ${entityType === 'user' && !entityId ? 'u.first_name || \' \' || u.last_name as entity_name,' : ''}
                ${entityType === 'topic' && !entityId ? 't.name as entity_name,' : ''}
                ${entityType === 'user' && !entityId ? 'm.user_id as entity_id' : ''}
                ${entityType === 'topic' && !entityId ? 's.topic_id as entity_id' : ''}
                ${entityType === 'system' ? 'NULL as entity_name, NULL as entity_id' : ''}
             FROM cl_measurements m
             ${entityType !== 'system' ? 'JOIN learning_sessions s ON m.session_id = s.session_id' : ''}
             ${entityType === 'user' && !entityId ? 'JOIN users u ON m.user_id = u.user_id' : ''}
             ${entityType === 'topic' && !entityId ? 'JOIN topics t ON s.topic_id = t.topic_id' : ''}
             WHERE 1=1 ${dateFilter} ${entityFilter}
             GROUP BY ${timeGroup}${entityType !== 'system' && !entityId ? ', ' + (entityType === 'user' ? 'm.user_id, u.first_name, u.last_name' : 's.topic_id, t.name') : ''}
             ORDER BY time_period DESC`,
            [...dateParams, ...entityParams]
        );

        res.status(200).json({
            success: true,
            data: {
                entity_type: entityType,
                entity_id: entityId || null,
                period,
                trends,
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

/**
 * Get student performance insights
 * GET /api/reports/students/performance
 */
export async function getStudentPerformanceInsights(req, res) {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { start_date, end_date, limit = 50 } = req.query;

        // Build date filter
        let dateFilter = '';
        let dateParams = [];
        if (start_date && end_date) {
            dateFilter = 'AND s.started_at BETWEEN $1 AND $2';
            dateParams = [start_date, end_date];
        } else if (start_date) {
            dateFilter = 'AND s.started_at >= $1';
            dateParams = [start_date];
        } else if (end_date) {
            dateFilter = 'AND s.started_at <= $1';
            dateParams = [end_date];
        }

        const students = await db.any(
            `SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                COUNT(DISTINCT s.session_id) as total_sessions,
                SUM(s.duration_seconds) as total_duration_seconds,
                AVG(s.duration_seconds / 60.0) as avg_session_duration,
                AVG(m.cl_index) as avg_cl,
                COUNT(m.measurement_id) as total_measurements,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count,
                COUNT(CASE WHEN m.cl_category = 'low' THEN 1 END) as low_count,
                COUNT(CASE WHEN m.cl_category = 'optimal' THEN 1 END) as optimal_count,
                COUNT(CASE WHEN m.cl_category = 'high' THEN 1 END) as high_count,
                MAX(s.started_at) as last_session_date,
                COUNT(DISTINCT t.topic_id) as unique_topics_attempted
             FROM users u
             LEFT JOIN learning_sessions s ON u.user_id = s.user_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             LEFT JOIN topics t ON s.topic_id = t.topic_id
             WHERE u.role = 'student' ${dateFilter}
             GROUP BY u.user_id, u.first_name, u.last_name, u.email
             ORDER BY avg_cl DESC NULLS LAST
             LIMIT $${dateParams.length + 1}`,
            [...dateParams, parseInt(limit)]
        );

        res.status(200).json({
            success: true,
            data: {
                students: students.map(student => ({
                    ...student,
                    total_duration_minutes: parseFloat((student.total_duration_seconds || 0) / 60).toFixed(2),
                    avg_cl: parseFloat(student.avg_cl || 0).toFixed(2),
                    avg_session_duration: parseFloat(student.avg_session_duration || 0).toFixed(2),
                    cl_distribution: {
                        low: parseInt(student.low_count || 0),
                        optimal: parseInt(student.optimal_count || 0),
                        high: parseInt(student.high_count || 0),
                        overload: parseInt(student.overload_count || 0),
                    },
                })),
                total_count: students.length,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error('Get student performance insights error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get topic difficulty analysis
 * GET /api/reports/topics/difficulty
 */
export async function getTopicDifficultyAnalysis(req, res) {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { start_date, end_date, subject, limit = 50 } = req.query;

        // Build date filter
        let dateFilter = '';
        let dateParams = [];
        if (start_date && end_date) {
            dateFilter = 'AND s.started_at BETWEEN $1 AND $2';
            dateParams = [start_date, end_date];
        } else if (start_date) {
            dateFilter = 'AND s.started_at >= $1';
            dateParams = [start_date];
        } else if (end_date) {
            dateFilter = 'AND s.started_at <= $1';
            dateParams = [end_date];
        }

        // Build subject filter
        let subjectFilter = '';
        let subjectParams = [];
        if (subject) {
            subjectFilter = 'AND t.subject = $1';
            subjectParams = [subject];
        }

        const topics = await db.any(
            `SELECT
                t.topic_id,
                t.name,
                t.subject,
                t.difficulty_level,
                t.estimated_duration_mins,
                COUNT(DISTINCT s.session_id) as total_sessions,
                COUNT(DISTINCT s.user_id) as unique_students,
                AVG(s.duration_seconds / 60.0) as avg_session_duration,
                AVG(m.cl_index) as avg_cl,
                COUNT(m.measurement_id) as total_measurements,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count,
                COUNT(CASE WHEN m.cl_category = 'low' THEN 1 END) as low_count,
                COUNT(CASE WHEN m.cl_category = 'optimal' THEN 1 END) as optimal_count,
                COUNT(CASE WHEN m.cl_category = 'high' THEN 1 END) as high_count,
                AVG(qa.score) as avg_quiz_score,
                COUNT(qa.attempt_id) as total_quiz_attempts
             FROM topics t
             LEFT JOIN learning_sessions s ON t.topic_id = s.topic_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             LEFT JOIN quizzes q ON t.topic_id = q.topic_id
             LEFT JOIN quiz_attempts qa ON q.quiz_id = qa.quiz_id
             WHERE 1=1 ${dateFilter} ${subjectFilter}
             GROUP BY t.topic_id, t.name, t.subject, t.difficulty_level, t.estimated_duration_mins
             ORDER BY avg_cl DESC NULLS LAST
             LIMIT $${dateParams.length + subjectParams.length + 1}`,
            [...dateParams, ...subjectParams, parseInt(limit)]
        );

        res.status(200).json({
            success: true,
            data: {
                topics: topics.map(topic => ({
                    ...topic,
                    avg_cl: parseFloat(topic.avg_cl || 0).toFixed(2),
                    avg_session_duration: parseFloat(topic.avg_session_duration || 0).toFixed(2),
                    avg_quiz_score: parseFloat(topic.avg_quiz_score || 0).toFixed(2),
                    cl_distribution: {
                        low: parseInt(topic.low_count || 0),
                        optimal: parseInt(topic.optimal_count || 0),
                        high: parseInt(topic.high_count || 0),
                        overload: parseInt(topic.overload_count || 0),
                    },
                    difficulty_indicator: topic.avg_cl > 7.5 ? 'high' : topic.avg_cl > 5.5 ? 'medium' : 'low',
                })),
                total_count: topics.length,
                limit: parseInt(limit),
                filters: {
                    subject: subject || null,
                    date_range: start_date && end_date ? { start: start_date, end: end_date } : null,
                },
            },
        });
    } catch (error) {
        console.error('Get topic difficulty analysis error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get CL distribution report
 * GET /api/reports/distribution/:entityType/:entityId?
 */
export async function getCLDistributionReport(req, res) {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { entityType, entityId } = req.params;
        const { start_date, end_date } = req.query;

        // Build date filter
        let dateFilter = '';
        let dateParams = [];
        if (start_date && end_date) {
            dateFilter = 'AND m.measured_at BETWEEN $1 AND $2';
            dateParams = [start_date, end_date];
        } else if (start_date) {
            dateFilter = 'AND m.measured_at >= $1';
            dateParams = [start_date];
        } else if (end_date) {
            dateFilter = 'AND m.measured_at <= $1';
            dateParams = [end_date];
        } else {
            // Default to last 30 days
            dateFilter = 'AND m.measured_at >= NOW() - INTERVAL \'30 days\'';
        }

        // Build entity filter
        let entityFilter = '';
        let entityParams = [];
        let entityName = '';

        if (entityType === 'user') {
            if (entityId) {
                entityFilter = 'AND m.user_id = $1';
                entityParams = [entityId];
                const user = await db.oneOrNone('SELECT first_name, last_name FROM users WHERE user_id = $1', [entityId]);
                entityName = user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
            }
        } else if (entityType === 'topic') {
            if (entityId) {
                entityFilter = 'AND s.topic_id = $1';
                entityParams = [entityId];
                const topic = await db.oneOrNone('SELECT name FROM topics WHERE topic_id = $1', [entityId]);
                entityName = topic ? topic.name : 'Unknown Topic';
            }
        }

        const distribution = await db.oneOrNone(
            `SELECT
                COUNT(*) as total_measurements,
                AVG(cl_index) as avg_cl,
                STDDEV(cl_index) as stddev_cl,
                COUNT(CASE WHEN cl_category = 'low' THEN 1 END) as low_count,
                COUNT(CASE WHEN cl_category = 'optimal' THEN 1 END) as optimal_count,
                COUNT(CASE WHEN cl_category = 'high' THEN 1 END) as high_count,
                COUNT(CASE WHEN cl_category = 'overload' THEN 1 END) as overload_count,
                MIN(cl_index) as min_cl,
                MAX(cl_index) as max_cl
             FROM cl_measurements m
             ${entityType !== 'system' ? 'JOIN learning_sessions s ON m.session_id = s.session_id' : ''}
             WHERE 1=1 ${dateFilter} ${entityFilter}`,
            [...dateParams, ...entityParams]
        );

        // Get CL ranges distribution
        const ranges = await db.any(
            `SELECT
                CASE
                    WHEN cl_index < 3 THEN '0-3'
                    WHEN cl_index < 5 THEN '3-5'
                    WHEN cl_index < 7 THEN '5-7'
                    WHEN cl_index < 9 THEN '7-9'
                    ELSE '9+'
                END as cl_range,
                COUNT(*) as count
             FROM cl_measurements m
             ${entityType !== 'system' ? 'JOIN learning_sessions s ON m.session_id = s.session_id' : ''}
             WHERE 1=1 ${dateFilter} ${entityFilter}
             GROUP BY
                CASE
                    WHEN cl_index < 3 THEN '0-3'
                    WHEN cl_index < 5 THEN '3-5'
                    WHEN cl_index < 7 THEN '5-7'
                    WHEN cl_index < 9 THEN '7-9'
                    ELSE '9+'
                END
             ORDER BY cl_range`,
            [...dateParams, ...entityParams]
        );

        res.status(200).json({
            success: true,
            data: {
                entity_type: entityType,
                entity_id: entityId || null,
                entity_name: entityName,
                summary: {
                    total_measurements: parseInt(distribution?.total_measurements || 0),
                    avg_cl: parseFloat(distribution?.avg_cl || 0).toFixed(2),
                    stddev_cl: parseFloat(distribution?.stddev_cl || 0).toFixed(2),
                    min_cl: parseFloat(distribution?.min_cl || 0).toFixed(2),
                    max_cl: parseFloat(distribution?.max_cl || 0).toFixed(2),
                },
                categories: {
                    low: parseInt(distribution?.low_count || 0),
                    optimal: parseInt(distribution?.optimal_count || 0),
                    high: parseInt(distribution?.high_count || 0),
                    overload: parseInt(distribution?.overload_count || 0),
                },
                ranges,
            },
        });
    } catch (error) {
        console.error('Get CL distribution report error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get comparative analytics
 * POST /api/reports/compare
 */
export async function getComparativeAnalytics(req, res) {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { group_ids, group_type, start_date, end_date } = req.body;

        // Build date filter
        let dateFilter = '';
        let dateParams = [];
        if (start_date && end_date) {
            dateFilter = 'AND m.measured_at BETWEEN $1 AND $2';
            dateParams = [start_date, end_date];
        } else if (start_date) {
            dateFilter = 'AND m.measured_at >= $1';
            dateParams = [start_date];
        } else if (end_date) {
            dateFilter = 'AND m.measured_at <= $1';
            dateParams = [end_date];
        } else {
            // Default to last 30 days
            dateFilter = 'AND m.measured_at >= NOW() - INTERVAL \'30 days\'';
        }

        let comparisonData = [];

        if (group_type === 'topic') {
            // Compare topics
            const topicsData = await db.any(
                `SELECT
                    t.topic_id,
                    t.name as topic_name,
                    t.subject,
                    t.difficulty_level,
                    COUNT(DISTINCT s.session_id) as total_sessions,
                    COUNT(DISTINCT s.user_id) as unique_students,
                    AVG(m.cl_index) as avg_cl,
                    COUNT(m.measurement_id) as total_measurements,
                    COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count,
                    AVG(qa.score) as avg_quiz_score
                 FROM topics t
                 LEFT JOIN learning_sessions s ON t.topic_id = s.topic_id
                 LEFT JOIN cl_measurements m ON s.session_id = m.session_id
                 LEFT JOIN quizzes q ON t.topic_id = q.topic_id
                 LEFT JOIN quiz_attempts qa ON q.quiz_id = qa.quiz_id
                 WHERE t.topic_id = ANY($1) ${dateFilter}
                 GROUP BY t.topic_id, t.name, t.subject, t.difficulty_level
                 ORDER BY avg_cl DESC NULLS LAST`,
                [group_ids, ...dateParams]
            );

            comparisonData = topicsData.map(topic => ({
                id: topic.topic_id,
                name: topic.topic_name,
                type: 'topic',
                metrics: {
                    total_sessions: parseInt(topic.total_sessions || 0),
                    unique_students: parseInt(topic.unique_students || 0),
                    avg_cl: parseFloat(topic.avg_cl || 0).toFixed(2),
                    total_measurements: parseInt(topic.total_measurements || 0),
                    overload_count: parseInt(topic.overload_count || 0),
                    avg_quiz_score: parseFloat(topic.avg_quiz_score || 0).toFixed(2),
                },
            }));

        } else if (group_type === 'user') {
            // Compare users
            const usersData = await db.any(
                `SELECT
                    u.user_id,
                    u.first_name || ' ' || u.last_name as user_name,
                    COUNT(DISTINCT s.session_id) as total_sessions,
                    COUNT(DISTINCT t.topic_id) as unique_topics,
                    AVG(m.cl_index) as avg_cl,
                    COUNT(m.measurement_id) as total_measurements,
                    COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count,
                    AVG(qa.score) as avg_quiz_score
                 FROM users u
                 LEFT JOIN learning_sessions s ON u.user_id = s.user_id
                 LEFT JOIN cl_measurements m ON s.session_id = m.session_id
                 LEFT JOIN topics t ON s.topic_id = t.topic_id
                 LEFT JOIN quiz_attempts qa ON u.user_id = qa.user_id
                 WHERE u.user_id = ANY($1) ${dateFilter}
                 GROUP BY u.user_id, u.first_name, u.last_name
                 ORDER BY avg_cl DESC NULLS LAST`,
                [group_ids, ...dateParams]
            );

            comparisonData = usersData.map(user => ({
                id: user.user_id,
                name: user.user_name,
                type: 'user',
                metrics: {
                    total_sessions: parseInt(user.total_sessions || 0),
                    unique_topics: parseInt(user.unique_topics || 0),
                    avg_cl: parseFloat(user.avg_cl || 0).toFixed(2),
                    total_measurements: parseInt(user.total_measurements || 0),
                    overload_count: parseInt(user.overload_count || 0),
                    avg_quiz_score: parseFloat(user.avg_quiz_score || 0).toFixed(2),
                },
            }));
        }

        res.status(200).json({
            success: true,
            data: {
                group_type,
                group_ids,
                date_range: start_date && end_date ? { start: start_date, end: end_date } : null,
                comparison_data: comparisonData,
            },
        });
    } catch (error) {
        console.error('Get comparative analytics error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}
