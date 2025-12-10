// Teacher routes - teacher dashboard and analytics
import express from 'express';
import { param, query } from 'express-validator';
import * as teacherController from '../controllers/teacher.controller.js';
import { authenticate } from '../auth/roleGuard.js';

const router = express.Router();

/**
 * Validation for UUID parameters
 */
const uuidParamValidation = (paramName) => [
    param(paramName)
        .isUUID()
        .withMessage(`${paramName} must be a valid UUID`),
];

/**
 * Validation for query parameters
 */
const queryValidation = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 500 })
        .withMessage('Limit must be between 1 and 500'),

    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer'),

    query('days')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Days must be between 1 and 365'),

    query('threshold')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('Threshold must be between 0 and 1'),
];

// All teacher routes require authentication
router.use(authenticate);

// Get teacher dashboard overview
router.get(
    '/dashboard',
    teacherController.getDashboard
);

// Get list of students
router.get(
    '/students',
    queryValidation,
    teacherController.getStudents
);

// Get class-wide analytics
router.get(
    '/class-analytics',
    queryValidation,
    teacherController.getClassAnalytics
);

// Get at-risk students
router.get(
    '/at-risk-students',
    queryValidation,
    teacherController.getAtRiskStudents
);

// Get topic-specific analytics
router.get(
    '/topic/:id/analytics',
    uuidParamValidation('id'),
    teacherController.getTopicAnalytics
);

export default router;
