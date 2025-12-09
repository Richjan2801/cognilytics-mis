// Quiz routes - quiz and assessment management
import express from 'express';
import { body, param, query } from 'express-validator';
import * as quizController from '../controllers/quiz.controller.js';
import { authenticate } from '../auth/roleGuard.js';

const router = express.Router();

/**
 * Validation rules for creating a quiz
 */
const createQuizValidation = [
    body('topic_id')
        .notEmpty()
        .withMessage('Topic ID is required')
        .isUUID()
        .withMessage('Topic ID must be a valid UUID'),

    body('title')
        .trim()
        .notEmpty()
        .withMessage('Quiz title is required')
        .isLength({ min: 2, max: 255 })
        .withMessage('Quiz title must be between 2 and 255 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),

    body('time_limit_mins')
        .optional()
        .isInt({ min: 1, max: 480 })
        .withMessage('Time limit must be between 1 and 480 minutes'),

    body('passing_score')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Passing score must be between 0 and 100'),

    body('total_points')
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage('Total points must be between 1 and 10000'),

    body('settings')
        .optional()
        .isObject()
        .withMessage('Settings must be an object'),
];

/**
 * Validation rules for updating a quiz
 */
const updateQuizValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('Quiz title must be between 2 and 255 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),

    body('time_limit_mins')
        .optional()
        .isInt({ min: 1, max: 480 })
        .withMessage('Time limit must be between 1 and 480 minutes'),

    body('passing_score')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Passing score must be between 0 and 100'),

    body('total_points')
        .optional()
        .isInt({ min: 1, max: 10000 })
        .withMessage('Total points must be between 1 and 10000'),

    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean'),

    body('settings')
        .optional()
        .isObject()
        .withMessage('Settings must be an object'),
];

/**
 * Validation rules for adding a question
 */
const addQuestionValidation = [
    body('question_text')
        .trim()
        .notEmpty()
        .withMessage('Question text is required')
        .isLength({ min: 5, max: 2000 })
        .withMessage('Question text must be between 5 and 2000 characters'),

    body('question_type')
        .notEmpty()
        .withMessage('Question type is required')
        .isIn(['multiple_choice', 'true_false', 'short_answer', 'essay'])
        .withMessage('Question type must be: multiple_choice, true_false, short_answer, or essay'),

    body('options')
        .optional()
        .isArray()
        .withMessage('Options must be an array'),

    body('correct_answer')
        .notEmpty()
        .withMessage('Correct answer is required')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Correct answer must be between 1 and 500 characters'),

    body('points')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Points must be between 1 and 1000'),

    body('order_index')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order index must be a non-negative integer'),

    body('explanation')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Explanation must not exceed 1000 characters'),
];

/**
 * Validation rules for updating a question
 */
const updateQuestionValidation = [
    body('question_text')
        .optional()
        .trim()
        .isLength({ min: 5, max: 2000 })
        .withMessage('Question text must be between 5 and 2000 characters'),

    body('question_type')
        .optional()
        .isIn(['multiple_choice', 'true_false', 'short_answer', 'essay'])
        .withMessage('Question type must be: multiple_choice, true_false, short_answer, or essay'),

    body('options')
        .optional()
        .isArray()
        .withMessage('Options must be an array'),

    body('correct_answer')
        .optional()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Correct answer must be between 1 and 500 characters'),

    body('points')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Points must be between 1 and 1000'),

    body('order_index')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order index must be a non-negative integer'),

    body('explanation')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Explanation must not exceed 1000 characters'),
];

/**
 * Validation rules for starting quiz attempt
 */
const startAttemptValidation = [
    body('session_id')
        .optional()
        .isUUID()
        .withMessage('Session ID must be a valid UUID'),
];

/**
 * Validation rules for submitting quiz attempt
 */
const submitAttemptValidation = [
    body('answers')
        .notEmpty()
        .withMessage('Answers are required')
        .isObject()
        .withMessage('Answers must be an object'),
];

/**
 * Validation for query parameters
 */
const quizQueryValidation = [
    query('topic_id')
        .optional()
        .isUUID()
        .withMessage('Topic ID must be a valid UUID'),

    query('created_by')
        .optional()
        .isUUID()
        .withMessage('Created by must be a valid UUID'),

    query('is_active')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('is_active must be true or false'),

    query('quiz_id')
        .optional()
        .isUUID()
        .withMessage('Quiz ID must be a valid UUID'),

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

// All quiz routes require authentication
router.use(authenticate);

// Create new quiz (Teacher/Admin only)
router.post(
    '/',
    createQuizValidation,
    quizController.createQuiz
);

// Get my quiz attempts
router.get(
    '/my-attempts',
    quizQueryValidation,
    quizController.getMyAttempts
);

// Get all quizzes with filters
router.get(
    '/',
    quizQueryValidation,
    quizController.getQuizzes
);

// Start quiz attempt
router.post(
    '/:id/start',
    [...uuidParamValidation('id'), ...startAttemptValidation],
    quizController.startQuizAttempt
);

// Add question to quiz (Teacher/Admin only)
router.post(
    '/:id/questions',
    [...uuidParamValidation('id'), ...addQuestionValidation],
    quizController.addQuestion
);

// Update quiz question (Teacher/Admin only)
router.put(
    '/questions/:questionId',
    [...uuidParamValidation('questionId'), ...updateQuestionValidation],
    quizController.updateQuestion
);

// Delete quiz question (Teacher/Admin only)
router.delete(
    '/questions/:questionId',
    uuidParamValidation('questionId'),
    quizController.deleteQuestion
);

// Submit quiz attempt
router.post(
    '/attempts/:attemptId/submit',
    [...uuidParamValidation('attemptId'), ...submitAttemptValidation],
    quizController.submitQuizAttempt
);

// Get quiz attempt results
router.get(
    '/attempts/:attemptId',
    uuidParamValidation('attemptId'),
    quizController.getAttemptResults
);

// Get quiz by ID (must be before /:id to avoid route conflicts)
router.get(
    '/:id',
    uuidParamValidation('id'),
    quizController.getQuizById
);

// Update quiz (Teacher/Admin only)
router.put(
    '/:id',
    [...uuidParamValidation('id'), ...updateQuizValidation],
    quizController.updateQuiz
);

// Delete quiz (Teacher/Admin only)
router.delete(
    '/:id',
    uuidParamValidation('id'),
    quizController.deleteQuiz
);

export default router;
