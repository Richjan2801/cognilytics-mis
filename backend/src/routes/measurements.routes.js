// Measurements routes - CL measurement operations
import express from 'express';
import { body, param, query } from 'express-validator';
import * as measureController from '../controllers/measure.controller.js';
import { authenticate } from '../auth/roleGuard.js';

const router = express.Router();

/**
 * Validation rules for creating a measurement
 */
const createMeasurementValidation = [
    body('session_id')
        .notEmpty()
        .withMessage('Session ID is required')
        .isUUID()
        .withMessage('Session ID must be a valid UUID'),

    body('topic_id')
        .optional()
        .isUUID()
        .withMessage('Topic ID must be a valid UUID'),

    body('quiz_id')
        .optional()
        .isUUID()
        .withMessage('Quiz ID must be a valid UUID'),

    // Self-Report - at least one method required (PAAS or NASA-TLX)
    body('sr_paas_score')
        .optional()
        .isInt({ min: 1, max: 9 })
        .withMessage('PAAS score must be between 1 and 9'),

    body('sr_nasa_tlx_mental_demand')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('NASA-TLX Mental Demand must be between 0 and 100'),

    body('sr_nasa_tlx_effort')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('NASA-TLX Effort must be between 0 and 100'),

    body('sr_nasa_tlx_frustration')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('NASA-TLX Frustration must be between 0 and 100'),

    // Performance - accuracy is required
    body('pf_accuracy')
        .notEmpty()
        .withMessage('Performance accuracy is required')
        .isFloat({ min: 0, max: 1 })
        .withMessage('Accuracy must be between 0 and 1'),

    body('pf_response_time_ms')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Response time must be a positive integer'),

    body('pf_expected_time_ms')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Expected time must be a positive integer'),

    // Behavioral - optional with defaults
    body('bh_hint_requests')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Hint requests must be a non-negative integer'),

    body('bh_page_revisits')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Page revisits must be a non-negative integer'),

    body('bh_pause_duration_ms')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Pause duration must be a non-negative integer'),
];

/**
 * Validation rules for query parameters
 */
const measurementQueryValidation = [
    query('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),

    query('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),

    query('topic_id')
        .optional()
        .isUUID()
        .withMessage('Topic ID must be a valid UUID'),

    query('cl_category')
        .optional()
        .isIn(['low', 'optimal', 'high', 'overload'])
        .withMessage('CL category must be: low, optimal, high, or overload'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Limit must be between 1 and 1000'),

    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer'),
];

/**
 * Validation for UUID parameters
 */
const uuidParamValidation = (paramName) => [
    param(paramName)
        .isUUID()
        .withMessage(`${paramName} must be a valid UUID`),
];

// All measurement routes require authentication
router.use(authenticate);

// Create new measurement
router.post(
    '/',
    createMeasurementValidation,
    measureController.createMeasurement
);

// Get current user's measurements
router.get(
    '/my-measurements',
    measurementQueryValidation,
    measureController.getMyMeasurements
);

// Get latest measurement for current user
router.get(
    '/latest',
    measureController.getLatestMeasurement
);

// Get user statistics
router.get(
    '/statistics',
    measurementQueryValidation,
    measureController.getUserStatistics
);

// Get measurements by session
router.get(
    '/session/:sessionId',
    uuidParamValidation('sessionId'),
    measureController.getMeasurementsBySession
);

// Get topic statistics (Teacher/Admin only)
router.get(
    '/topic/:topicId/statistics',
    [...uuidParamValidation('topicId'), ...measurementQueryValidation],
    measureController.getTopicStatistics
);

// Get measurements by topic (Teacher/Admin only)
router.get(
    '/topic/:topicId',
    [...uuidParamValidation('topicId'), ...measurementQueryValidation],
    measureController.getMeasurementsByTopic
);

// Get single measurement by ID (must be last to avoid route conflicts)
router.get(
    '/:id',
    uuidParamValidation('id'),
    measureController.getMeasurement
);

export default router;
