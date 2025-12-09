// Role-based access control middleware
import { verifyAccessToken, extractTokenFromHeader } from './jwt.js';
import db from '../config/db.js';

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export async function authenticate(req, res, next) {
    try {
        // Extract token from Authorization header
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. No token provided.',
            });
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Check if user still exists and is active
        const user = await db.oneOrNone(
            'SELECT user_id, email, role, first_name, last_name, is_active FROM users WHERE user_id = $1',
            [decoded.user_id]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Token is invalid.',
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account has been deactivated.',
            });
        }

        // Update last login
        await db.none(
            'UPDATE users SET last_login = NOW() WHERE user_id = $1',
            [user.user_id]
        );

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.message.includes('expired')) {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.',
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token.',
            error: error.message,
        });
    }
}

/**
 * Role-based authorization middleware
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
export function authorize(...allowedRoles) {
    return (req, res, next) => {
        // Check if user is attached (should be from authenticate middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
            });
        }

        next();
    };
}

/**
 * Middleware to allow only students
 */
export const studentOnly = authorize('student');

/**
 * Middleware to allow only teachers
 */
export const teacherOnly = authorize('teacher');

/**
 * Middleware to allow only admins
 */
export const adminOnly = authorize('admin');

/**
 * Middleware to allow both teachers and admins
 */
export const teacherOrAdmin = authorize('teacher', 'admin');

/**
 * Optional authentication - attaches user if token is valid, but doesn't require it
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export async function optionalAuth(req, res, next) {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (token) {
            const decoded = verifyAccessToken(token);
            const user = await db.oneOrNone(
                'SELECT user_id, email, role, first_name, last_name, is_active FROM users WHERE user_id = $1 AND is_active = true',
                [decoded.user_id]
            );

            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
}
