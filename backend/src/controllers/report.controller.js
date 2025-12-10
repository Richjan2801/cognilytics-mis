// Report controller - handles report generation and analytics
import { validationResult } from 'express-validator';
import db, { handleDatabaseError } from '../config/db.js';

/**
 * Get student CL report
 * GET /api/reports/student/:id
 */
export async function getStudentReport(req, res) {
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

        const { id } = req.params;
        const { days = 30 } = req.query;
        const dayRange = parseInt(days);

        // Check if user exists and is a student
        const student = await db.oneOrNone(
            'SELECT user_id, first_name, last_name, email, created_at FROM users WHERE user_id = $1 AND role = $2',
            [id, 'student']
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
            });
        }

        // Permission check: students can only view their own reports
        if (req.user.role === 'student' && req.user.user_id !== id) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own report',
            });
        }

        // Get overall CL statistics
        const clStats = await db.oneOrNone(
            `SELECT
                COUNT(*) as total_measurements,
                AVG(cl_index) as avg_cl,
                MIN(cl_index) as min_cl,
                MAX(cl_index) as max_cl,
                STDDEV(cl_index) as stddev_cl,
                COUNT(CASE WHEN cl_category = 'low' THEN 1 END) as low_count,
                COUNT(CASE WHEN cl_category = 'optimal' THEN 1 END) as optimal_count,
                COUNT(CASE WHEN cl_category = 'high' THEN 1 END) as high_count,
                COUNT(CASE WHEN cl_category = 'overload' THEN 1 END) as overload_count
             FROM cl_measurements
             WHERE user_id = $1
               AND measured_at >= NOW() - INTERVAL '1 day' * $2`,
            [id, dayRange]
        );

        // Get CL trends over time
        const clTrends = await db.any(
            `SELECT
                DATE(measured_at) as date,
                AVG(cl_index) as avg_cl,
                MIN(cl_index) as min_cl,
                MAX(cl_index) as max_cl,
                COUNT(*) as measurement_count
             FROM cl_measurements
             WHERE user_id = $1
               AND measured_at >= NOW() - INTERVAL '1 day' * $2
             GROUP BY DATE(measured_at)
             ORDER BY date DESC`,
            [id, dayRange]
        );

        // Get performance by topic
        const topicPerformance = await db.any(
            `SELECT
                t.topic_id,
                t.name as topic_name,
                t.subject,
                t.difficulty_level,
                COUNT(DISTINCT s.session_id) as session_count,
                AVG(m.cl_index) as avg_cl,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count,
                AVG(s.duration_seconds / 60.0) as avg_session_duration
             FROM learning_sessions s
             JOIN topics t ON s.topic_id = t.topic_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             WHERE s.user_id = $1
               AND s.started_at >= NOW() - INTERVAL '1 day' * $2
             GROUP BY t.topic_id, t.name, t.subject, t.difficulty_level
             ORDER BY avg_cl DESC NULLS LAST`,
            [id, dayRange]
        );

        // Get quiz performance
        const quizPerformance = await db.any(
            `SELECT
                q.quiz_id,
                q.title as quiz_title,
                COUNT(qa.attempt_id) as attempts,
                AVG(qa.score) as avg_score,
                MAX(qa.score) as best_score,
                COUNT(CASE WHEN (qa.score / q.max_score * 100) >= q.passing_score THEN 1 END) as passed_count
             FROM quiz_attempts qa
             JOIN quizzes q ON qa.quiz_id = q.quiz_id
             WHERE qa.user_id = $1
               AND qa.started_at >= NOW() - INTERVAL '1 day' * $2
             GROUP BY q.quiz_id, q.title
             ORDER BY MAX(qa.started_at) DESC`,
            [id, dayRange]
        );

        // Get session statistics
        const sessionStats = await db.oneOrNone(
            `SELECT
                COUNT(*) as total_sessions,
                AVG(duration_seconds / 60.0) as avg_duration,
                SUM(duration_seconds / 60.0) as total_duration,
                COUNT(DISTINCT topic_id) as unique_topics
             FROM learning_sessions
             WHERE user_id = $1
               AND started_at >= NOW() - INTERVAL '1 day' * $2`,
            [id, dayRange]
        );

        res.status(200).json({
            success: true,
            data: {
                student: {
                    user_id: student.user_id,
                    name: `${student.first_name} ${student.last_name}`,
                    email: student.email,
                    enrolled_since: student.created_at,
                },
                time_range_days: dayRange,
                cognitive_load: {
                    statistics: {
                        total_measurements: parseInt(clStats?.total_measurements || 0),
                        avg_cl: parseFloat(clStats?.avg_cl || 0).toFixed(2),
                        min_cl: parseFloat(clStats?.min_cl || 0).toFixed(2),
                        max_cl: parseFloat(clStats?.max_cl || 0).toFixed(2),
                        stddev_cl: parseFloat(clStats?.stddev_cl || 0).toFixed(2),
                        distribution: {
                            low: parseInt(clStats?.low_count || 0),
                            optimal: parseInt(clStats?.optimal_count || 0),
                            high: parseInt(clStats?.high_count || 0),
                            overload: parseInt(clStats?.overload_count || 0),
                        },
                    },
                    trends: clTrends,
                },
                topic_performance: topicPerformance,
                quiz_performance: quizPerformance,
                session_stats: {
                    total_sessions: parseInt(sessionStats?.total_sessions || 0),
                    avg_duration: parseFloat(sessionStats?.avg_duration || 0).toFixed(2),
                    total_duration: parseFloat(sessionStats?.total_duration || 0).toFixed(2),
                    unique_topics: parseInt(sessionStats?.unique_topics || 0),
                },
            },
        });
    } catch (error) {
        console.error('Get student report error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get topic CL report
 * GET /api/reports/topic/:id
 */
export async function getTopicReport(req, res) {
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

        const { id } = req.params;
        const { days = 30 } = req.query;
        const dayRange = parseInt(days);

        // Get topic details
        const topic = await db.oneOrNone(
            'SELECT * FROM topics WHERE topic_id = $1',
            [id]
        );

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found',
            });
        }

        // Permission check: teachers can only view their own topics
        if (req.user.role === 'teacher' && topic.teacher_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'You can only view reports for your own topics',
            });
        }

        // Get overall topic statistics
        const topicStats = await db.oneOrNone(
            `SELECT
                COUNT(DISTINCT s.session_id) as total_sessions,
                COUNT(DISTINCT s.user_id) as unique_students,
                AVG(s.duration_seconds / 60.0) as avg_session_duration,
                SUM(s.duration_seconds / 60.0) as total_session_duration,
                AVG(m.cl_index) as avg_cl,
                COUNT(m.measurement_id) as total_measurements,
                COUNT(CASE WHEN m.cl_category = 'low' THEN 1 END) as low_count,
                COUNT(CASE WHEN m.cl_category = 'optimal' THEN 1 END) as optimal_count,
                COUNT(CASE WHEN m.cl_category = 'high' THEN 1 END) as high_count,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count
             FROM learning_sessions s
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             WHERE s.topic_id = $1
               AND s.started_at >= NOW() - INTERVAL '1 day' * $2`,
            [id, dayRange]
        );

        // Get CL trends over time
        const clTrends = await db.any(
            `SELECT
                DATE(m.measured_at) as date,
                AVG(m.cl_index) as avg_cl,
                COUNT(*) as measurement_count,
                COUNT(DISTINCT s.user_id) as unique_students,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count
             FROM cl_measurements m
             JOIN learning_sessions s ON m.session_id = s.session_id
             WHERE s.topic_id = $1
               AND m.measured_at >= NOW() - INTERVAL '1 day' * $2
             GROUP BY DATE(m.measured_at)
             ORDER BY date DESC`,
            [id, dayRange]
        );

        // Get student performance breakdown
        const studentPerformance = await db.any(
            `SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                COUNT(DISTINCT s.session_id) as session_count,
                AVG(s.duration_seconds / 60.0) as avg_duration,
                AVG(m.cl_index) as avg_cl,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count,
                MAX(m.measured_at) as last_session
             FROM learning_sessions s
             JOIN users u ON s.user_id = u.user_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             WHERE s.topic_id = $1
               AND s.started_at >= NOW() - INTERVAL '1 day' * $2
             GROUP BY u.user_id, u.first_name, u.last_name
             ORDER BY avg_cl DESC NULLS LAST`,
            [id, dayRange]
        );

        // Get quiz statistics for this topic
        const quizStats = await db.oneOrNone(
            `SELECT
                COUNT(DISTINCT q.quiz_id) as total_quizzes,
                COUNT(qa.attempt_id) as total_attempts,
                AVG(qa.score) as avg_score,
                COUNT(CASE WHEN (qa.score / q.max_score * 100) >= q.passing_score THEN 1 END)::float /
                    NULLIF(COUNT(qa.attempt_id), 0) * 100 as pass_rate
             FROM quizzes q
             LEFT JOIN quiz_attempts qa ON q.quiz_id = qa.quiz_id
             WHERE q.topic_id = $1
               AND qa.started_at >= NOW() - INTERVAL '1 day' * $2`,
            [id, dayRange]
        );

        res.status(200).json({
            success: true,
            data: {
                topic: {
                    topic_id: topic.topic_id,
                    name: topic.name,
                    subject: topic.subject,
                    difficulty_level: topic.difficulty_level,
                    description: topic.description,
                },
                time_range_days: dayRange,
                statistics: {
                    total_sessions: parseInt(topicStats?.total_sessions || 0),
                    unique_students: parseInt(topicStats?.unique_students || 0),
                    avg_session_duration: parseFloat(topicStats?.avg_session_duration || 0).toFixed(2),
                    total_session_duration: parseFloat(topicStats?.total_session_duration || 0).toFixed(2),
                },
                cognitive_load: {
                    avg_cl: parseFloat(topicStats?.avg_cl || 0).toFixed(2),
                    total_measurements: parseInt(topicStats?.total_measurements || 0),
                    distribution: {
                        low: parseInt(topicStats?.low_count || 0),
                        optimal: parseInt(topicStats?.optimal_count || 0),
                        high: parseInt(topicStats?.high_count || 0),
                        overload: parseInt(topicStats?.overload_count || 0),
                    },
                    trends: clTrends,
                },
                student_performance: studentPerformance,
                quiz_statistics: {
                    total_quizzes: parseInt(quizStats?.total_quizzes || 0),
                    total_attempts: parseInt(quizStats?.total_attempts || 0),
                    avg_score: parseFloat(quizStats?.avg_score || 0).toFixed(2),
                    pass_rate: parseFloat(quizStats?.pass_rate || 0).toFixed(2),
                },
            },
        });
    } catch (error) {
        console.error('Get topic report error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get class CL report (for teachers)
 * GET /api/reports/class/:id
 */
export async function getClassReport(req, res) {
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

        // Only teachers and admins can access
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Teachers and admins only.',
            });
        }

        const { id } = req.params; // teacher_id
        const { days = 30 } = req.query;
        const dayRange = parseInt(days);

        // Verify teacher exists
        const teacher = await db.oneOrNone(
            'SELECT user_id, first_name, last_name, email FROM users WHERE user_id = $1 AND role = $2',
            [id, 'teacher']
        );

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found',
            });
        }

        // Permission check: teachers can only view their own class report
        if (req.user.role === 'teacher' && req.user.user_id !== id) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own class report',
            });
        }

        // Get overall class statistics
        const classStats = await db.oneOrNone(
            `SELECT
                COUNT(DISTINCT s.user_id) as total_students,
                COUNT(DISTINCT s.session_id) as total_sessions,
                AVG(s.duration_seconds / 60.0) as avg_session_duration,
                COUNT(DISTINCT t.topic_id) as total_topics,
                AVG(m.cl_index) as avg_cl,
                COUNT(m.measurement_id) as total_measurements,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END)::float /
                    NULLIF(COUNT(m.measurement_id), 0) * 100 as overload_rate
             FROM topics t
             LEFT JOIN learning_sessions s ON t.topic_id = s.topic_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             WHERE t.teacher_id = $1
               AND (s.started_at >= NOW() - INTERVAL '1 day' * $2 OR s.started_at IS NULL)`,
            [id, dayRange]
        );

        // Get student performance summary
        const studentSummary = await db.any(
            `SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                COUNT(DISTINCT s.session_id) as session_count,
                AVG(m.cl_index) as avg_cl,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count,
                COUNT(DISTINCT qa.quiz_id) as quizzes_taken,
                AVG(qa.score) as avg_quiz_score
             FROM users u
             JOIN learning_sessions s ON u.user_id = s.user_id
             JOIN topics t ON s.topic_id = t.topic_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             LEFT JOIN quiz_attempts qa ON u.user_id = qa.user_id
             WHERE t.teacher_id = $1
               AND s.started_at >= NOW() - INTERVAL '1 day' * $2
             GROUP BY u.user_id, u.first_name, u.last_name
             ORDER BY avg_cl DESC NULLS LAST`,
            [id, dayRange]
        );

        // Get topic performance breakdown
        const topicBreakdown = await db.any(
            `SELECT
                t.topic_id,
                t.name as topic_name,
                t.subject,
                COUNT(DISTINCT s.session_id) as session_count,
                COUNT(DISTINCT s.user_id) as student_count,
                AVG(m.cl_index) as avg_cl,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count
             FROM topics t
             LEFT JOIN learning_sessions s ON t.topic_id = s.topic_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             WHERE t.teacher_id = $1
               AND (s.started_at >= NOW() - INTERVAL '1 day' * $2 OR s.started_at IS NULL)
             GROUP BY t.topic_id, t.name, t.subject
             ORDER BY avg_cl DESC NULLS LAST`,
            [id, dayRange]
        );

        // Get daily CL trends
        const dailyTrends = await db.any(
            `SELECT
                DATE(m.measured_at) as date,
                AVG(m.cl_index) as avg_cl,
                COUNT(*) as measurement_count,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count
             FROM cl_measurements m
             JOIN learning_sessions s ON m.session_id = s.session_id
             JOIN topics t ON s.topic_id = t.topic_id
             WHERE t.teacher_id = $1
               AND m.measured_at >= NOW() - INTERVAL '1 day' * $2
             GROUP BY DATE(m.measured_at)
             ORDER BY date DESC`,
            [id, dayRange]
        );

        res.status(200).json({
            success: true,
            data: {
                teacher: {
                    user_id: teacher.user_id,
                    name: `${teacher.first_name} ${teacher.last_name}`,
                    email: teacher.email,
                },
                time_range_days: dayRange,
                class_statistics: {
                    total_students: parseInt(classStats?.total_students || 0),
                    total_sessions: parseInt(classStats?.total_sessions || 0),
                    avg_session_duration: parseFloat(classStats?.avg_session_duration || 0).toFixed(2),
                    total_topics: parseInt(classStats?.total_topics || 0),
                    avg_cl: parseFloat(classStats?.avg_cl || 0).toFixed(2),
                    total_measurements: parseInt(classStats?.total_measurements || 0),
                    overload_rate: parseFloat(classStats?.overload_rate || 0).toFixed(2),
                },
                student_summary: studentSummary,
                topic_breakdown: topicBreakdown,
                daily_trends: dailyTrends,
            },
        });
    } catch (error) {
        console.error('Get class report error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Export report (placeholder for future CSV/PDF export)
 * POST /api/reports/export
 */
export async function exportReport(req, res) {
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

        const { report_type, entity_id, format = 'json' } = req.body;

        // For now, return a placeholder response
        // Future implementation: generate PDF or CSV based on report_type
        res.status(200).json({
            success: true,
            message: 'Export functionality coming soon',
            data: {
                report_type,
                entity_id,
                format,
                note: 'This endpoint will support PDF and CSV export in future updates',
            },
        });
    } catch (error) {
        console.error('Export report error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}
