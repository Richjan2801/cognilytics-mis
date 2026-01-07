// Reports routes - CL analytics and insights endpoints
import express from 'express';
import { body, param, query } from 'express-validator';
import {
    getTeacherDashboard,
    getAdminDashboard,
    getCLTrends,
    getStudentPerformanceInsights,
    getTopicDifficultyAnalysis,
    getCLDistributionReport,
    getComparativeAnalytics
} from '../controllers/report.controller.js';
import { authenticate } from '../auth/roleGuard.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Teacher dashboard overview
router.get('/teacher/dashboard',
    query('start_date').optional().isISO8601().withMessage('Invalid start_date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end_date format'),
    getTeacherDashboard
);

// Admin dashboard overview (admin only)
router.get('/admin/dashboard',
    query('start_date').optional().isISO8601().withMessage('Invalid start_date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end_date format'),
    getAdminDashboard
);

// CL trends over time
router.get('/trends/:entityType',
    param('entityType').isIn(['user', 'topic', 'system']).withMessage('Invalid entity type'),
    query('period').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid period'),
    query('start_date').optional().isISO8601().withMessage('Invalid start_date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end_date format'),
    getCLTrends
);

router.get('/trends/:entityType/:entityId',
    param('entityType').isIn(['user', 'topic', 'system']).withMessage('Invalid entity type'),
    param('entityId').isUUID().withMessage('Invalid entity ID'),
    query('period').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid period'),
    query('start_date').optional().isISO8601().withMessage('Invalid start_date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end_date format'),
    getCLTrends
);

// Student performance insights
router.get('/students/performance',
    query('start_date').optional().isISO8601().withMessage('Invalid start_date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end_date format'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    getStudentPerformanceInsights
);

// Topic difficulty analysis
router.get('/topics/difficulty',
    query('start_date').optional().isISO8601().withMessage('Invalid start_date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end_date format'),
    query('subject').optional().isString().withMessage('Invalid subject'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    getTopicDifficultyAnalysis
);

// CL distribution report
router.get('/distribution/:entityType',
    param('entityType').isIn(['user', 'topic', 'system']).withMessage('Invalid entity type'),
    query('start_date').optional().isISO8601().withMessage('Invalid start_date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end_date format'),
    getCLDistributionReport
);

router.get('/distribution/:entityType/:entityId',
    param('entityType').isIn(['user', 'topic', 'system']).withMessage('Invalid entity type'),
    param('entityId').isUUID().withMessage('Invalid entity ID'),
    query('start_date').optional().isISO8601().withMessage('Invalid start_date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end_date format'),
    getCLDistributionReport
);

// Comparative analytics
router.post('/compare',
    body('group_ids').isArray({ min: 1, max: 10 }).withMessage('group_ids must be array with 1-10 items'),
    body('group_ids.*').isUUID().withMessage('Each group_id must be a valid UUID'),
    body('group_type').isIn(['topic', 'user']).withMessage('group_type must be topic or user'),
    body('start_date').optional().isISO8601().withMessage('Invalid start_date format'),
    body('end_date').optional().isISO8601().withMessage('Invalid end_date format'),
    getComparativeAnalytics
);

export default router;
