// Session controller - handles learning session operations
import { validationResult } from 'express-validator';
import * as sessionModel from '../models/sessions.model.js';
import { handleDatabaseError } from '../config/db.js';

/**
 * Create a new learning session
 * POST /api/sessions
 */
export async function createSession(req, res) {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const {
            topic_id = null,
            quiz_id = null,
            session_type,
            device_type = null,
            metadata = {},
        } = req.body;

        // Get IP address and user agent from request
        const ip_address = req.ip || req.connection.remoteAddress;
        const user_agent = req.get('user-agent') || null;

        const session = await sessionModel.createSession({
            user_id: req.user.user_id,
            topic_id,
            quiz_id,
            session_type,
            device_type,
            ip_address,
            user_agent,
            metadata,
        });

        res.status(201).json({
            success: true,
            message: 'Session created successfully',
            data: { session },
        });
    } catch (error) {
        console.error('Create session error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * End a learning session
 * PUT /api/sessions/:sessionId/end
 */
export async function endSession(req, res) {
    try {
        const { sessionId } = req.params;

        // Verify session exists and belongs to user
        const existingSession = await sessionModel.getSessionById(sessionId);
        if (!existingSession) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        if (existingSession.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to end this session',
            });
        }

        if (existingSession.ended_at) {
            return res.status(400).json({
                success: false,
                message: 'Session has already ended',
            });
        }

        const session = await sessionModel.endSession(sessionId);

        res.status(200).json({
            success: true,
            message: 'Session ended successfully',
            data: { session },
        });
    } catch (error) {
        console.error('End session error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get session by ID
 * GET /api/sessions/:sessionId
 */
export async function getSession(req, res) {
    try {
        const { sessionId } = req.params;

        const session = await sessionModel.getSessionById(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        // Check if user has permission to view this session
        if (session.user_id !== req.user.user_id && req.user.role === 'student') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this session',
            });
        }

        res.status(200).json({
            success: true,
            data: { session },
        });
    } catch (error) {
        console.error('Get session error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get active sessions for current user
 * GET /api/sessions/active
 */
export async function getActiveSessions(req, res) {
    try {
        const sessions = await sessionModel.getActiveSessions(req.user.user_id);

        res.status(200).json({
            success: true,
            data: {
                count: sessions.length,
                sessions,
            },
        });
    } catch (error) {
        console.error('Get active sessions error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get sessions for current user
 * GET /api/sessions/my-sessions
 */
export async function getMySessions(req, res) {
    try {
        const {
            session_type = null,
            start_date = null,
            end_date = null,
            limit = 50,
            offset = 0,
        } = req.query;

        const sessions = await sessionModel.getSessionsByUser(req.user.user_id, {
            session_type,
            start_date,
            end_date,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        const total = await sessionModel.countSessionsByUser(req.user.user_id, {
            session_type,
            start_date,
            end_date,
        });

        res.status(200).json({
            success: true,
            data: {
                sessions,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    has_more: total > parseInt(offset) + sessions.length,
                },
            },
        });
    } catch (error) {
        console.error('Get my sessions error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get session statistics for current user
 * GET /api/sessions/statistics
 */
export async function getSessionStatistics(req, res) {
    try {
        const { start_date, end_date } = req.query;

        // Default to last 30 days if not specified
        const endDate = end_date ? new Date(end_date) : new Date();
        const startDate = start_date
            ? new Date(start_date)
            : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        const stats = await sessionModel.getSessionStatistics(
            req.user.user_id,
            startDate,
            endDate
        );

        res.status(200).json({
            success: true,
            data: {
                period: {
                    start_date: startDate,
                    end_date: endDate,
                },
                statistics: stats,
            },
        });
    } catch (error) {
        console.error('Get session statistics error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get sessions by topic (Teacher/Admin only)
 * GET /api/sessions/topic/:topicId
 */
export async function getSessionsByTopic(req, res) {
    try {
        // Check authorization
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only teachers and admins can view topic sessions',
            });
        }

        const { topicId } = req.params;
        const { limit = 100, offset = 0 } = req.query;

        const sessions = await sessionModel.getSessionsByTopic(topicId, {
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.status(200).json({
            success: true,
            data: {
                topic_id: topicId,
                count: sessions.length,
                sessions,
            },
        });
    } catch (error) {
        console.error('Get topic sessions error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get sessions by quiz (Teacher/Admin only)
 * GET /api/sessions/quiz/:quizId
 */
export async function getSessionsByQuiz(req, res) {
    try {
        // Check authorization
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only teachers and admins can view quiz sessions',
            });
        }

        const { quizId } = req.params;

        const sessions = await sessionModel.getSessionsByQuiz(quizId);

        res.status(200).json({
            success: true,
            data: {
                quiz_id: quizId,
                count: sessions.length,
                sessions,
            },
        });
    } catch (error) {
        console.error('Get quiz sessions error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Update session metadata
 * PATCH /api/sessions/:sessionId/metadata
 */
export async function updateMetadata(req, res) {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { sessionId } = req.params;
        const { metadata } = req.body;

        // Verify session exists and belongs to user
        const existingSession = await sessionModel.getSessionById(sessionId);
        if (!existingSession) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        if (existingSession.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this session',
            });
        }

        const session = await sessionModel.updateSessionMetadata(sessionId, metadata);

        res.status(200).json({
            success: true,
            message: 'Session metadata updated successfully',
            data: { session },
        });
    } catch (error) {
        console.error('Update session metadata error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}
