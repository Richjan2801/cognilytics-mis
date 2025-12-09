// Measurements controller - handles CL measurement operations
import { validationResult } from 'express-validator';
import * as measureModel from '../models/measurements.model.js';
import * as sessionModel from '../models/sessions.model.js';
import { calculateCognitiveLoad, validateMeasurementData } from '../services/cl-calculation.service.js';
import { handleDatabaseError } from '../config/db.js';

/**
 * Create a new CL measurement
 * POST /api/measurements
 */
export async function createMeasurement(req, res) {
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
            session_id,
            topic_id = null,
            quiz_id = null,
            // Self-Report
            sr_paas_score = null,
            sr_nasa_tlx_mental_demand = null,
            sr_nasa_tlx_effort = null,
            sr_nasa_tlx_frustration = null,
            // Performance
            pf_accuracy,
            pf_response_time_ms = null,
            pf_expected_time_ms = null,
            // Behavioral
            bh_hint_requests = 0,
            bh_page_revisits = 0,
            bh_pause_duration_ms = 0,
            // Physiological (optional)
            ph_eye_tracking_data = null,
            ph_facial_analysis = null,
            ph_heart_rate_data = null,
        } = req.body;

        // Verify session exists and belongs to user
        const session = await sessionModel.getSessionById(session_id);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        if (session.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to create measurements for this session',
            });
        }

        // Validate measurement data
        const validation = validateMeasurementData({
            sr_paas_score,
            sr_nasa_tlx_mental_demand,
            sr_nasa_tlx_effort,
            sr_nasa_tlx_frustration,
            pf_accuracy,
            pf_response_time_ms,
            pf_expected_time_ms,
        });

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid measurement data',
                errors: validation.errors,
            });
        }

        // Calculate cognitive load
        const clResult = calculateCognitiveLoad({
            sr_paas_score,
            sr_nasa_tlx_mental_demand,
            sr_nasa_tlx_effort,
            sr_nasa_tlx_frustration,
            pf_accuracy,
            pf_response_time_ms,
            pf_expected_time_ms,
            bh_hint_requests,
            bh_page_revisits,
            bh_pause_duration_ms,
            ph_eye_tracking_data,
            ph_facial_analysis,
            ph_heart_rate_data,
        });

        // Store measurement with calculated CL
        const measurement = await measureModel.createMeasurement({
            session_id,
            user_id: req.user.user_id,
            topic_id,
            quiz_id,
            // Raw data
            sr_paas_score,
            sr_nasa_tlx_mental_demand,
            sr_nasa_tlx_effort,
            sr_nasa_tlx_frustration,
            pf_accuracy,
            pf_response_time_ms,
            pf_expected_time_ms,
            bh_hint_requests,
            bh_page_revisits,
            bh_pause_duration_ms,
            // Calculated CL data
            ...clResult,
        });

        res.status(201).json({
            success: true,
            message: 'CL measurement created successfully',
            data: {
                measurement_id: measurement.measurement_id,
                session_id: measurement.session_id,
                user_id: measurement.user_id,
                topic_id: measurement.topic_id,
                quiz_id: measurement.quiz_id,
                measured_at: measurement.measured_at,
                cl_index: measurement.cl_index,
                cl_category: measurement.cl_category,
                components: {
                    sr_normalized: measurement.sr_normalized,
                    pf_normalized: measurement.pf_normalized,
                    bh_normalized: measurement.bh_normalized,
                    ph_normalized: measurement.ph_normalized,
                },
            },
        });
    } catch (error) {
        console.error('Create measurement error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get measurement by ID
 * GET /api/measurements/:id
 */
export async function getMeasurement(req, res) {
    try {
        const { id } = req.params;

        const measurement = await measureModel.getMeasurementById(id);

        if (!measurement) {
            return res.status(404).json({
                success: false,
                message: 'Measurement not found',
            });
        }

        // Check if user has permission to view this measurement
        if (measurement.user_id !== req.user.user_id && req.user.role === 'student') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this measurement',
            });
        }

        res.status(200).json({
            success: true,
            data: { measurement },
        });
    } catch (error) {
        console.error('Get measurement error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get measurements by session
 * GET /api/measurements/session/:sessionId
 */
export async function getMeasurementsBySession(req, res) {
    try {
        const { sessionId } = req.params;

        // Verify session exists and user has permission
        const session = await sessionModel.getSessionById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        if (session.user_id !== req.user.user_id && req.user.role === 'student') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view measurements for this session',
            });
        }

        const measurements = await measureModel.getMeasurementsBySession(sessionId);

        res.status(200).json({
            success: true,
            data: {
                session_id: sessionId,
                count: measurements.length,
                measurements,
            },
        });
    } catch (error) {
        console.error('Get session measurements error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get measurements for current user
 * GET /api/measurements/my-measurements
 */
export async function getMyMeasurements(req, res) {
    try {
        const {
            start_date = null,
            end_date = null,
            topic_id = null,
            cl_category = null,
            limit = 100,
            offset = 0,
        } = req.query;

        const measurements = await measureModel.getMeasurementsByUser(req.user.user_id, {
            start_date,
            end_date,
            topic_id,
            cl_category,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        const total = await measureModel.countMeasurements(req.user.user_id, {
            start_date,
            end_date,
            cl_category,
        });

        res.status(200).json({
            success: true,
            data: {
                measurements,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    has_more: total > parseInt(offset) + measurements.length,
                },
            },
        });
    } catch (error) {
        console.error('Get my measurements error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get latest CL measurement for current user
 * GET /api/measurements/latest
 */
export async function getLatestMeasurement(req, res) {
    try {
        const measurement = await measureModel.getLatestMeasurement(req.user.user_id);

        if (!measurement) {
            return res.status(404).json({
                success: false,
                message: 'No measurements found',
            });
        }

        res.status(200).json({
            success: true,
            data: { measurement },
        });
    } catch (error) {
        console.error('Get latest measurement error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get user CL statistics
 * GET /api/measurements/statistics
 */
export async function getUserStatistics(req, res) {
    try {
        const { start_date, end_date } = req.query;

        // Default to last 30 days if not specified
        const endDate = end_date ? new Date(end_date) : new Date();
        const startDate = start_date
            ? new Date(start_date)
            : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        const stats = await measureModel.getUserCLStatistics(
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
        console.error('Get user statistics error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get topic CL statistics (Teacher/Admin only)
 * GET /api/measurements/topic/:topicId/statistics
 */
export async function getTopicStatistics(req, res) {
    try {
        // Check authorization
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only teachers and admins can view topic statistics',
            });
        }

        const { topicId } = req.params;
        const { start_date, end_date } = req.query;

        // Default to last 30 days if not specified
        const endDate = end_date ? new Date(end_date) : new Date();
        const startDate = start_date
            ? new Date(start_date)
            : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        const stats = await measureModel.getTopicCLStatistics(topicId, startDate, endDate);

        res.status(200).json({
            success: true,
            data: {
                topic_id: topicId,
                period: {
                    start_date: startDate,
                    end_date: endDate,
                },
                statistics: stats,
            },
        });
    } catch (error) {
        console.error('Get topic statistics error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get measurements by topic (Teacher/Admin only)
 * GET /api/measurements/topic/:topicId
 */
export async function getMeasurementsByTopic(req, res) {
    try {
        // Check authorization
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only teachers and admins can view topic measurements',
            });
        }

        const { topicId } = req.params;
        const {
            start_date = null,
            end_date = null,
            limit = 100,
            offset = 0,
        } = req.query;

        const measurements = await measureModel.getMeasurementsByTopic(topicId, {
            start_date,
            end_date,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.status(200).json({
            success: true,
            data: {
                topic_id: topicId,
                count: measurements.length,
                measurements,
            },
        });
    } catch (error) {
        console.error('Get topic measurements error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}
