// Topics routes - subject/topic management
import express from 'express';
import { body, param, query } from 'express-validator';
import * as topicController from '../controllers/topic.controller.js';
import { authenticate } from '../auth/roleGuard.js';

const router = express.Router();

/**
 * Validation rules for creating a topic
 */
const createTopicValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Topic name is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Topic name must be between 2 and 200 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),

    body('subject')
        .trim()
        .notEmpty()
        .withMessage('Subject is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Subject must be between 2 and 100 characters'),

    body('grade_level')
        .optional()
        .isString()
        .isLength({ max: 50 })
        .withMessage('Grade level must not exceed 50 characters'),

    body('difficulty_level')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
        .withMessage('Difficulty level must be: beginner, intermediate, advanced, or expert'),

    body('institution_id')
        .optional()
        .isUUID()
        .withMessage('Institution ID must be a valid UUID'),

    body('estimated_duration_mins')
        .optional()
        .isInt({ min: 1, max: 1440 })
        .withMessage('Estimated duration must be between 1 and 1440 minutes'),

    body('learning_objectives')
        .optional()
        .isArray()
        .withMessage('Learning objectives must be an array'),

    body('prerequisites')
        .optional()
        .isArray()
        .withMessage('Prerequisites must be an array'),

    body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
];

/**
 * Validation rules for updating a topic
 */
const updateTopicValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Topic name must be between 2 and 200 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),

    body('subject')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Subject must be between 2 and 100 characters'),

    body('grade_level')
        .optional()
        .isString()
        .isLength({ max: 50 })
        .withMessage('Grade level must not exceed 50 characters'),

    body('difficulty_level')
        .optional()
        .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
        .withMessage('Difficulty level must be: beginner, intermediate, advanced, or expert'),

    body('estimated_duration_mins')
        .optional()
        .isInt({ min: 1, max: 1440 })
        .withMessage('Estimated duration must be between 1 and 1440 minutes'),

    body('learning_objectives')
        .optional()
        .isArray()
        .withMessage('Learning objectives must be an array'),

    body('prerequisites')
        .optional()
        .isArray()
        .withMessage('Prerequisites must be an array'),

    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean'),

    body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
];

/**
 * Validation for query parameters
 */
const topicQueryValidation = [
    query('teacher_id')
        .optional()
        .isUUID()
        .withMessage('Teacher ID must be a valid UUID'),

    query('institution_id')
        .optional()
        .isUUID()
        .withMessage('Institution ID must be a valid UUID'),

    query('subject')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Subject must be between 1 and 100 characters'),

    query('grade_level')
        .optional()
        .isString()
        .isLength({ max: 50 })
        .withMessage('Grade level must not exceed 50 characters'),

    query('is_active')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('is_active must be true or false'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 500 })
        .withMessage('Limit must be between 1 and 500'),

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

// All topic routes require authentication
router.use(authenticate);

// Create new topic (Teacher/Admin only)
router.post(
    '/',
    createTopicValidation,
    topicController.createTopic
);

// Get list of unique subjects
router.get(
    '/subjects',
    topicController.getSubjects
);

// Get my topics (Teacher/Admin only)
router.get(
    '/my-topics',
    topicController.getMyTopics
);

// Get all topics with filters
router.get(
    '/',
    topicQueryValidation,
    topicController.getTopics
);

// Get topic statistics (Teacher/Admin only)
router.get(
    '/:id/statistics',
    uuidParamValidation('id'),
    topicController.getTopicStatistics
);

// Get topic by ID
router.get(
    '/:id',
    uuidParamValidation('id'),
    topicController.getTopicById
);

// Update topic (Teacher/Admin only - checked in controller)
router.put(
    '/:id',
    [...uuidParamValidation('id'), ...updateTopicValidation],
    topicController.updateTopic
);

// Delete topic (Teacher/Admin only - checked in controller)
router.delete(
    '/:id',
    uuidParamValidation('id'),
    topicController.deleteTopic
);

export default router;
