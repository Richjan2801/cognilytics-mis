// Admin routes - admin dashboard and system management
import express from 'express';
import { param, query } from 'express-validator';
import * as adminController from '../controllers/admin.controller.js';
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

    query('role')
        .optional()
        .isIn(['student', 'teacher', 'admin'])
        .withMessage('Role must be student, teacher, or admin'),

    query('is_active')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('is_active must be true or false'),
];

// All admin routes require authentication
router.use(authenticate);

// Get admin dashboard overview
router.get(
    '/dashboard',
    adminController.getDashboard
);

// Get all users with filters
router.get(
    '/users',
    queryValidation,
    adminController.getUsers
);

// Activate user
router.post(
    '/users/:id/activate',
    uuidParamValidation('id'),
    adminController.activateUser
);

// Deactivate user
router.post(
    '/users/:id/deactivate',
    uuidParamValidation('id'),
    adminController.deactivateUser
);

// Get system-wide statistics
router.get(
    '/system-stats',
    queryValidation,
    adminController.getSystemStats
);

// Get cognitive load trends
router.get(
    '/cl-trends',
    queryValidation,
    adminController.getCLTrends
);

export default router;
