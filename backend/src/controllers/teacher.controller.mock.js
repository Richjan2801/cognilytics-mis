/**
 * Teacher Controller with Mock Data Support
 * 
 * Controller yang support mock mode untuk development tanpa database
 */

import { validationResult } from 'express-validator';
import db, { handleDatabaseError } from '../config/db.js';
import config from '../config/env.js';
import {
  getTeacherDashboardData,
  mockTeacherDashboard,
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
    // Get total students
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

    // Get average cognitive load
    const avgCL = await db.oneOrNone(
      `SELECT AVG(cl_index) as avg_cl_index
       FROM cl_measurements m
       JOIN topics t ON m.topic_id = t.topic_id
       WHERE t.teacher_id = $1
         AND m.measured_at >= NOW() - INTERVAL '7 days'`,
      [teacherId]
    );

    // Get high-load students count (CL > 60)
    const highLoadStudents = await db.oneOrNone(
      `SELECT COUNT(DISTINCT m.user_id) as high_load_students
       FROM cl_measurements m
       JOIN topics t ON m.topic_id = t.topic_id
       WHERE t.teacher_id = $1
         AND m.cl_index >= 60
         AND m.measured_at >= NOW() - INTERVAL '7 days'`,
      [teacherId]
    );

    // Get CL trend for last 7 days
    const clTrend = await db.any(
      `SELECT 
         DATE(m.measured_at) as date,
         AVG(m.cl_index) as avg_cl
       FROM cl_measurements m
       JOIN topics t ON m.topic_id = t.topic_id
       WHERE t.teacher_id = $1
         AND m.measured_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(m.measured_at)
       ORDER BY date`,
      [teacherId]
    );

    // Get recent submissions
    const recentSubmissions = await db.any(
      `SELECT 
         m.measurement_id,
         m.user_id as student_id,
         u.first_name || ' ' || u.last_name as student_name,
         m.topic_id,
         t.topic_name,
         m.cl_index as cl_value,
         m.cl_category,
         m.measured_at
       FROM cl_measurements m
       JOIN users u ON m.user_id = u.user_id
       JOIN topics t ON m.topic_id = t.topic_id
       WHERE t.teacher_id = $1
       ORDER BY m.measured_at DESC
       LIMIT 10`,
      [teacherId]
    );

    // Get topic breakdown
    const topicBreakdown = await db.any(
      `SELECT 
         t.topic_id,
         t.topic_name,
         AVG(m.cl_index) as avg_cl,
         COUNT(DISTINCT m.user_id) as student_count,
         COUNT(m.measurement_id) as measurement_count,
         COUNT(CASE WHEN m.cl_index >= 60 THEN 1 END) as high_load_count
       FROM topics t
       LEFT JOIN cl_measurements m ON t.topic_id = m.topic_id
       WHERE t.teacher_id = $1
       GROUP BY t.topic_id, t.topic_name
       ORDER BY avg_cl DESC`,
      [teacherId]
    );

    return res.json({
      success: true,
      data: {
        overview: {
          avg_cl_index: parseFloat(avgCL?.avg_cl_index || 0).toFixed(1),
          high_load_students: parseInt(highLoadStudents?.high_load_students || 0),
          active_students: parseInt(studentStats?.total_students || 0),
          total_students: parseInt(studentStats?.total_students || 0),
          active_topics: parseInt(topicStats?.active_topics || 0),
          recent_sessions: parseInt(recentSessions?.recent_sessions || 0),
        },
        cl_trend: clTrend,
        recent_submissions: recentSubmissions,
        topic_breakdown: topicBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    return handleDatabaseError(error, res);
  }
}

/**
 * Get teacher's topics
 * GET /api/teacher/topics
 */
export async function getTopics(req, res) {
  try {
    const teacherId = req.user.user_id;

    // MOCK MODE
    if (config.USE_MOCK_DATA) {
      console.log('[MOCK MODE] Returning mock topics');
      const topics = getTopicsByTeacher(teacherId);
      return res.json({
        success: true,
        data: topics,
      });
    }

    // REAL DATABASE MODE
    const topics = await db.any(
      `SELECT 
         topic_id,
         topic_name,
         description,
         subject_area,
         difficulty_level,
         is_active,
         created_at
       FROM topics
       WHERE teacher_id = $1
       ORDER BY created_at DESC`,
      [teacherId]
    );

    return res.json({
      success: true,
      data: topics,
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return handleDatabaseError(error, res);
  }
}

/**
 * Get measurements for a specific topic
 * GET /api/teacher/topics/:topicId/measurements
 */
export async function getTopicMeasurements(req, res) {
  try {
    const { topicId } = req.params;
    const teacherId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 50;

    // MOCK MODE
    if (config.USE_MOCK_DATA) {
      console.log('[MOCK MODE] Returning mock measurements for topic', topicId);
      const measurements = getMeasurementsByTopic(topicId, limit);
      return res.json({
        success: true,
        data: measurements,
      });
    }

    // Verify topic belongs to teacher
    const topic = await db.oneOrNone(
      'SELECT topic_id FROM topics WHERE topic_id = $1 AND teacher_id = $2',
      [topicId, teacherId]
    );

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found or access denied',
      });
    }

    // Get measurements
    const measurements = await db.any(
      `SELECT 
         m.*,
         u.first_name || ' ' || u.last_name as student_name
       FROM cl_measurements m
       JOIN users u ON m.user_id = u.user_id
       WHERE m.topic_id = $1
       ORDER BY m.measured_at DESC
       LIMIT $2`,
      [topicId, limit]
    );

    return res.json({
      success: true,
      data: measurements,
    });
  } catch (error) {
    console.error('Error fetching topic measurements:', error);
    return handleDatabaseError(error, res);
  }
}

export default {
  getDashboard,
  getTopics,
  getTopicMeasurements,
};
