// Report routes - report generation and analytics
import express from 'express';
import { body, param, query } from 'express-validator';
import * as reportController from '../controllers/report.controller.js';
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
    query('days')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Days must be between 1 and 365'),
];

/**
 * Validation for export request
 */
const exportValidation = [
    body('report_type')
        .notEmpty()
        .withMessage('Report type is required')
        .isIn(['student', 'topic', 'class'])
        .withMessage('Report type must be student, topic, or class'),

    body('entity_id')
        .notEmpty()
        .withMessage('Entity ID is required')
        .isUUID()
        .withMessage('Entity ID must be a valid UUID'),

    body('format')
        .optional()
        .isIn(['json', 'csv', 'pdf'])
        .withMessage('Format must be json, csv, or pdf'),
];

// All report routes require authentication
router.use(authenticate);

// Get student CL report
router.get(
    '/student/:id',
    [...uuidParamValidation('id'), ...queryValidation],
    reportController.getStudentReport
);

// Get topic CL report
router.get(
    '/topic/:id',
    [...uuidParamValidation('id'), ...queryValidation],
    reportController.getTopicReport
);

// Get class CL report (teacher's class)
router.get(
    '/class/:id',
    [...uuidParamValidation('id'), ...queryValidation],
    reportController.getClassReport
);

// Export report (placeholder)
router.post(
    '/export',
    exportValidation,
    reportController.exportReport
);

export default router;
