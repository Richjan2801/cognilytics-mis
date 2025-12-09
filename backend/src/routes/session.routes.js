// Session routes - learning session management
import express from 'express';
import { body, param, query } from 'express-validator';
import * as sessionController from '../controllers/session.controller.js';
import { authenticate } from '../auth/roleGuard.js';

const router = express.Router();

/**
 * Validation rules for creating a session
 */
const createSessionValidation = [
    body('session_type')
        .notEmpty()
        .withMessage('Session type is required')
        .isIn(['quiz', 'study', 'practice', 'review'])
        .withMessage('Session type must be: quiz, study, practice, or review'),

    body('topic_id')
        .optional()
        .isUUID()
        .withMessage('Topic ID must be a valid UUID'),

    body('quiz_id')
        .optional()
        .isUUID()
        .withMessage('Quiz ID must be a valid UUID'),

    body('device_type')
        .optional()
        .isIn(['desktop', 'mobile', 'tablet'])
        .withMessage('Device type must be: desktop, mobile, or tablet'),

    body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
];

/**
 * Validation rules for updating metadata
 */
const updateMetadataValidation = [
    body('metadata')
        .notEmpty()
        .withMessage('Metadata is required')
        .isObject()
        .withMessage('Metadata must be an object'),
];

/**
 * Validation for query parameters
 */
const sessionQueryValidation = [
    query('session_type')
        .optional()
        .isIn(['quiz', 'study', 'practice', 'review'])
        .withMessage('Session type must be: quiz, study, practice, or review'),

    query('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),

    query('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),

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

// All session routes require authentication
router.use(authenticate);

// Create new session
router.post(
    '/',
    createSessionValidation,
    sessionController.createSession
);

// Get active sessions for current user
router.get(
    '/active',
    sessionController.getActiveSessions
);

// Get session statistics for current user
router.get(
    '/statistics',
    sessionQueryValidation,
    sessionController.getSessionStatistics
);

// Get current user's sessions
router.get(
    '/my-sessions',
    sessionQueryValidation,
    sessionController.getMySessions
);

// Get sessions by topic (Teacher/Admin only)
router.get(
    '/topic/:topicId',
    [...uuidParamValidation('topicId'), ...sessionQueryValidation],
    sessionController.getSessionsByTopic
);

// Get sessions by quiz (Teacher/Admin only)
router.get(
    '/quiz/:quizId',
    uuidParamValidation('quizId'),
    sessionController.getSessionsByQuiz
);

// End a session
router.put(
    '/:sessionId/end',
    uuidParamValidation('sessionId'),
    sessionController.endSession
);

// Update session metadata
router.patch(
    '/:sessionId/metadata',
    [...uuidParamValidation('sessionId'), ...updateMetadataValidation],
    sessionController.updateMetadata
);

// Get session by ID (must be last to avoid route conflicts)
router.get(
    '/:sessionId',
    uuidParamValidation('sessionId'),
    sessionController.getSession
);

export default router;
