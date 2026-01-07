// Teacher controller - handles teacher dashboard and analytics
import { validationResult } from 'express-validator';
import db, { handleDatabaseError } from '../config/db.js';
import config from '../config/env.js';
import {
  getTeacherDashboardData,
  getTopicsByTeacher,
  getMeasurementsByTopic,
} from '../data/mockData.js';

/**
 * Get teacher dashboard overview
 * GET /api/teacher/dashboard
 */
export async function getDashboard(req, res) {
    try {
        // Only teachers and admins can access
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Teachers only.',
            });
        }

        const teacherId = req.user.user_id;

        // MOCK MODE: Return mock data if enabled
        if (config.USE_MOCK_DATA) {
            console.log('[MOCK MODE] Returning mock teacher dashboard data');
            const mockData = getTeacherDashboardData(teacherId);
            return res.json({
                success: true,
                data: {
                    overview: mockData.overview,
                    cl_trend: mockData.cl_trend_7days,
                    recent_submissions: mockData.recent_submissions,
                    topic_breakdown: mockData.topic_breakdown,
                },
            });
        }

        // REAL DATABASE MODE: Original implementation
        // Get total students (unique users who have taken quizzes/sessions on teacher's topics)
        const studentStats = await db.oneOrNone(
            `SELECT COUNT(DISTINCT s.user_id) as total_students
             FROM learning_sessions s
             JOIN topics t ON s.topic_id = t.topic_id
             WHERE t.teacher_id = $1`,
            [teacherId]
        );

        // Get active topics count
        const topicStats = await db.oneOrNone(
            `SELECT COUNT(*) as total_topics,
                    COUNT(CASE WHEN is_active = true THEN 1 END) as active_topics
             FROM topics
             WHERE teacher_id = $1`,
            [teacherId]
        );

        // Get recent sessions count (last 7 days)
        const recentSessions = await db.oneOrNone(
            `SELECT COUNT(*) as recent_sessions
             FROM learning_sessions s
             JOIN topics t ON s.topic_id = t.topic_id
             WHERE t.teacher_id = $1
               AND s.started_at >= NOW() - INTERVAL '7 days'`,
            [teacherId]
        );

        // Get average cognitive load for teacher's students
        const avgCL = await db.oneOrNone(
            `SELECT
                AVG(m.cl_index) as avg_cl_index,
                COUNT(*) as total_measurements,
                COUNT(CASE WHEN m.cl_category = 'low' THEN 1 END) as low_count,
                COUNT(CASE WHEN m.cl_category = 'optimal' THEN 1 END) as optimal_count,
                COUNT(CASE WHEN m.cl_category = 'high' THEN 1 END) as high_count,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count
             FROM cl_measurements m
             JOIN learning_sessions s ON m.session_id = s.session_id
             JOIN topics t ON s.topic_id = t.topic_id
             WHERE t.teacher_id = $1
               AND m.measured_at >= NOW() - INTERVAL '30 days'`,
            [teacherId]
        );

        // Get quiz statistics
        const quizStats = await db.oneOrNone(
            `SELECT
                COUNT(DISTINCT q.quiz_id) as total_quizzes,
                COUNT(qa.attempt_id) as total_attempts,
                AVG(qa.score) as avg_score,
                COUNT(CASE WHEN (qa.score / qa.max_score * 100) >= q.passing_score THEN 1 END)::float /
                    NULLIF(COUNT(qa.attempt_id), 0) * 100 as pass_rate
             FROM quizzes q
             LEFT JOIN quiz_attempts qa ON q.quiz_id = qa.quiz_id
             WHERE q.created_by = $1
               AND qa.submitted_at >= NOW() - INTERVAL '30 days'`,
            [teacherId]
        );

        res.status(200).json({
            success: true,
            data: {
                students: {
                    total: parseInt(studentStats?.total_students || 0),
                },
                topics: {
                    total: parseInt(topicStats?.total_topics || 0),
                    active: parseInt(topicStats?.active_topics || 0),
                },
                sessions: {
                    recent_7_days: parseInt(recentSessions?.recent_sessions || 0),
                },
                cognitive_load: {
                    avg_cl_index: parseFloat(avgCL?.avg_cl_index || 0).toFixed(2),
                    total_measurements: parseInt(avgCL?.total_measurements || 0),
                    distribution: {
                        low: parseInt(avgCL?.low_count || 0),
                        optimal: parseInt(avgCL?.optimal_count || 0),
                        high: parseInt(avgCL?.high_count || 0),
                        overload: parseInt(avgCL?.overload_count || 0),
                    },
                },
                quizzes: {
                    total: parseInt(quizStats?.total_quizzes || 0),
                    attempts_30_days: parseInt(quizStats?.total_attempts || 0),
                    avg_score: parseFloat(quizStats?.avg_score || 0).toFixed(2),
                    pass_rate: parseFloat(quizStats?.pass_rate || 0).toFixed(2),
                },
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
 * Get list of students
 * GET /api/teacher/students
 */
export async function getStudents(req, res) {
    try {
        // Only teachers and admins can access
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Teachers only.',
            });
        }

        const teacherId = req.user.user_id;
        const { limit = 50, offset = 0 } = req.query;

        // Get unique students who have interacted with teacher's content
        const students = await db.any(
            `SELECT DISTINCT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.created_at as enrolled_at,
                (SELECT COUNT(*) FROM learning_sessions s
                 JOIN topics t ON s.topic_id = t.topic_id
                 WHERE s.user_id = u.user_id AND t.teacher_id = $1) as session_count,
                (SELECT COUNT(*) FROM quiz_attempts qa
                 JOIN quizzes q ON qa.quiz_id = q.quiz_id
                 WHERE qa.user_id = u.user_id AND q.created_by = $1) as quiz_attempts,
                (SELECT AVG(m.cl_index) FROM cl_measurements m
                 JOIN learning_sessions s ON m.session_id = s.session_id
                 JOIN topics t ON s.topic_id = t.topic_id
                 WHERE m.user_id = u.user_id AND t.teacher_id = $1
                   AND m.measured_at >= NOW() - INTERVAL '30 days') as avg_cl_30days,
                (SELECT m.cl_category FROM cl_measurements m
                 JOIN learning_sessions s ON m.session_id = s.session_id
                 JOIN topics t ON s.topic_id = t.topic_id
                 WHERE m.user_id = u.user_id AND t.teacher_id = $1
                 ORDER BY m.measured_at DESC LIMIT 1) as latest_cl_category
             FROM users u
             WHERE u.role = 'student'
               AND EXISTS (
                   SELECT 1 FROM learning_sessions s
                   JOIN topics t ON s.topic_id = t.topic_id
                   WHERE s.user_id = u.user_id AND t.teacher_id = $1
               )
             ORDER BY u.last_name, u.first_name
             LIMIT $2 OFFSET $3`,
            [teacherId, parseInt(limit), parseInt(offset)]
        );

        // Get total count
        const totalResult = await db.oneOrNone(
            `SELECT COUNT(DISTINCT u.user_id) as total
             FROM users u
             WHERE u.role = 'student'
               AND EXISTS (
                   SELECT 1 FROM learning_sessions s
                   JOIN topics t ON s.topic_id = t.topic_id
                   WHERE s.user_id = u.user_id AND t.teacher_id = $1
               )`,
            [teacherId]
        );

        const total = parseInt(totalResult?.total || 0);

        res.status(200).json({
            success: true,
            data: {
                students,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    has_more: total > parseInt(offset) + students.length,
                },
            },
        });
    } catch (error) {
        console.error('Get students error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get class-wide analytics
 * GET /api/teacher/class-analytics
 */
export async function getClassAnalytics(req, res) {
    try {
        // Only teachers and admins can access
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Teachers only.',
            });
        }

        const teacherId = req.user.user_id;
        const { days = 30 } = req.query;
        const dayRange = parseInt(days);

        // Get CL trends over time
        const clTrends = await db.any(
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
            [teacherId, dayRange]
        );

        // Get topic performance comparison
        const topicPerformance = await db.any(
            `SELECT
                t.topic_id,
                t.name as topic_name,
                t.subject,
                COUNT(DISTINCT s.session_id) as session_count,
                COUNT(DISTINCT s.user_id) as student_count,
                AVG(m.cl_index) as avg_cl,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END)::float /
                    NULLIF(COUNT(m.measurement_id), 0) * 100 as overload_rate
             FROM topics t
             LEFT JOIN learning_sessions s ON t.topic_id = s.topic_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             WHERE t.teacher_id = $1
               AND (m.measured_at >= NOW() - INTERVAL '1 day' * $2 OR m.measured_at IS NULL)
             GROUP BY t.topic_id, t.name, t.subject
             ORDER BY avg_cl DESC NULLS LAST`,
            [teacherId, dayRange]
        );

        // Get overall statistics
        const overallStats = await db.oneOrNone(
            `SELECT
                AVG(m.cl_index) as avg_cl,
                STDDEV(m.cl_index) as stddev_cl,
                MIN(m.cl_index) as min_cl,
                MAX(m.cl_index) as max_cl,
                COUNT(DISTINCT m.user_id) as active_students,
                COUNT(m.measurement_id) as total_measurements
             FROM cl_measurements m
             JOIN learning_sessions s ON m.session_id = s.session_id
             JOIN topics t ON s.topic_id = t.topic_id
             WHERE t.teacher_id = $1
               AND m.measured_at >= NOW() - INTERVAL '1 day' * $2`,
            [teacherId, dayRange]
        );

        res.status(200).json({
            success: true,
            data: {
                time_range_days: dayRange,
                overall_stats: {
                    avg_cl: parseFloat(overallStats?.avg_cl || 0).toFixed(2),
                    stddev_cl: parseFloat(overallStats?.stddev_cl || 0).toFixed(2),
                    min_cl: parseFloat(overallStats?.min_cl || 0).toFixed(2),
                    max_cl: parseFloat(overallStats?.max_cl || 0).toFixed(2),
                    active_students: parseInt(overallStats?.active_students || 0),
                    total_measurements: parseInt(overallStats?.total_measurements || 0),
                },
                cl_trends: clTrends,
                topic_performance: topicPerformance,
            },
        });
    } catch (error) {
        console.error('Get class analytics error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get topic-specific analytics
 * GET /api/teacher/topic/:id/analytics
 */
export async function getTopicAnalytics(req, res) {
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
                message: 'Access denied. Teachers only.',
            });
        }

        const { id } = req.params;
        const teacherId = req.user.user_id;

        // Verify topic exists and belongs to teacher
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

        if (topic.teacher_id !== teacherId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this topic',
            });
        }

        // Get topic statistics
        const stats = await db.oneOrNone(
            `SELECT
                COUNT(DISTINCT s.session_id) as total_sessions,
                COUNT(DISTINCT s.user_id) as unique_students,
                AVG(s.duration_seconds / 60.0) as avg_session_duration,
                COUNT(DISTINCT q.quiz_id) as quiz_count,
                AVG(m.cl_index) as avg_cl,
                COUNT(CASE WHEN m.cl_category = 'low' THEN 1 END) as low_cl_count,
                COUNT(CASE WHEN m.cl_category = 'optimal' THEN 1 END) as optimal_cl_count,
                COUNT(CASE WHEN m.cl_category = 'high' THEN 1 END) as high_cl_count,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_cl_count
             FROM topics t
             LEFT JOIN learning_sessions s ON t.topic_id = s.topic_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             LEFT JOIN quizzes q ON t.topic_id = q.topic_id
             WHERE t.topic_id = $1`,
            [id]
        );

        // Get student performance breakdown
        const studentPerformance = await db.any(
            `SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                COUNT(DISTINCT s.session_id) as session_count,
                AVG(m.cl_index) as avg_cl,
                MAX(m.measured_at) as last_activity,
                COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count
             FROM users u
             JOIN learning_sessions s ON u.user_id = s.user_id
             LEFT JOIN cl_measurements m ON s.session_id = m.session_id
             WHERE s.topic_id = $1
             GROUP BY u.user_id, u.first_name, u.last_name
             ORDER BY avg_cl DESC NULLS LAST`,
            [id]
        );

        // Get CL trends over time for this topic
        const clTrends = await db.any(
            `SELECT
                DATE(m.measured_at) as date,
                AVG(m.cl_index) as avg_cl,
                COUNT(*) as measurement_count
             FROM cl_measurements m
             JOIN learning_sessions s ON m.session_id = s.session_id
             WHERE s.topic_id = $1
               AND m.measured_at >= NOW() - INTERVAL '30 days'
             GROUP BY DATE(m.measured_at)
             ORDER BY date DESC`,
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                topic: {
                    topic_id: topic.topic_id,
                    name: topic.name,
                    subject: topic.subject,
                    difficulty_level: topic.difficulty_level,
                },
                statistics: {
                    total_sessions: parseInt(stats?.total_sessions || 0),
                    unique_students: parseInt(stats?.unique_students || 0),
                    avg_session_duration: parseFloat(stats?.avg_session_duration || 0).toFixed(2),
                    quiz_count: parseInt(stats?.quiz_count || 0),
                    avg_cl: parseFloat(stats?.avg_cl || 0).toFixed(2),
                    cl_distribution: {
                        low: parseInt(stats?.low_cl_count || 0),
                        optimal: parseInt(stats?.optimal_cl_count || 0),
                        high: parseInt(stats?.high_cl_count || 0),
                        overload: parseInt(stats?.overload_cl_count || 0),
                    },
                },
                student_performance: studentPerformance,
                cl_trends: clTrends,
            },
        });
    } catch (error) {
        console.error('Get topic analytics error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get at-risk students (high CL or overload)
 * GET /api/teacher/at-risk-students
 */
export async function getAtRiskStudents(req, res) {
    try {
        // Only teachers and admins can access
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Teachers only.',
            });
        }

        const teacherId = req.user.user_id;
        const { threshold = 0.7, days = 7 } = req.query;
        const clThreshold = parseFloat(threshold);
        const dayRange = parseInt(days);

        // Get students with consistently high CL or recent overload
        const atRiskStudents = await db.any(
            `WITH student_cl_stats AS (
                SELECT
                    m.user_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    AVG(m.cl_index) as avg_cl,
                    MAX(m.cl_index) as max_cl,
                    COUNT(*) as measurement_count,
                    COUNT(CASE WHEN m.cl_category = 'overload' THEN 1 END) as overload_count,
                    COUNT(CASE WHEN m.cl_category = 'high' OR m.cl_category = 'overload' THEN 1 END) as high_cl_count,
                    MAX(m.measured_at) as last_measurement,
                    ARRAY_AGG(DISTINCT t.name ORDER BY t.name) as struggling_topics
                FROM cl_measurements m
                JOIN users u ON m.user_id = u.user_id
                JOIN learning_sessions s ON m.session_id = s.session_id
                JOIN topics t ON s.topic_id = t.topic_id
                WHERE t.teacher_id = $1
                  AND m.measured_at >= NOW() - INTERVAL '1 day' * $2
                GROUP BY m.user_id, u.first_name, u.last_name, u.email
            )
            SELECT
                user_id,
                first_name,
                last_name,
                email,
                avg_cl,
                max_cl,
                measurement_count,
                overload_count,
                high_cl_count,
                last_measurement,
                struggling_topics,
                CASE
                    WHEN avg_cl >= 0.8 THEN 'critical'
                    WHEN avg_cl >= $3 THEN 'high'
                    WHEN overload_count >= 3 THEN 'warning'
                    ELSE 'monitor'
                END as risk_level
            FROM student_cl_stats
            WHERE avg_cl >= $3 OR overload_count >= 2
            ORDER BY avg_cl DESC, overload_count DESC`,
            [teacherId, dayRange, clThreshold]
        );

        // Get summary statistics
        const summary = {
            total_at_risk: atRiskStudents.length,
            critical: atRiskStudents.filter(s => s.risk_level === 'critical').length,
            high: atRiskStudents.filter(s => s.risk_level === 'high').length,
            warning: atRiskStudents.filter(s => s.risk_level === 'warning').length,
            monitor: atRiskStudents.filter(s => s.risk_level === 'monitor').length,
        };

        res.status(200).json({
            success: true,
            data: {
                threshold: clThreshold,
                time_range_days: dayRange,
                summary,
                at_risk_students: atRiskStudents,
            },
        });
    } catch (error) {
        console.error('Get at-risk students error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}
