/**
 * Facial Expression Detection Routes
 * Handles camera-based expression detection endpoints
 */

import express from 'express';
import { body, param } from 'express-validator';
import { validationResult } from 'express-validator';
import { authenticate } from '../auth/roleGuard.js';
import db, { handleDatabaseError } from '../config/db.js';
import { fedClient, calculateAverageLoad, detectStressIndicators } from '../services/facial-expression-detection.service.js';

const router = express.Router();

/**
 * All facial expression routes require authentication
 */
router.use(authenticate);

/**
 * Check if facial expression detection service is available
 * GET /api/facial-expression/health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await fedClient.healthCheck();
        res.status(200).json({
            success: true,
            data: health
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'Facial Expression Detection service unavailable',
            error: error.message
        });
    }
});

/**
 * Detect expression from single image
 * POST /api/facial-expression/detect
 */
router.post('/detect', [
    body('image_base64')
        .notEmpty()
        .isString()
        .withMessage('image_base64 is required'),
    body('session_id')
        .optional()
        .isUUID()
        .withMessage('session_id must be a valid UUID')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { image_base64, session_id } = req.body;
        const userId = req.user.user_id;

        // Call facial expression detection service
        const result = await fedClient.detectExpression(image_base64, userId, session_id);

        // Store detection result in database
        if (session_id && result.detection_result?.cognitive_load_estimate !== undefined) {
            try {
                await db.none(
                    `INSERT INTO facial_expression_data 
                     (session_id, user_id, expression_data, cognitive_load, detected_at)
                     VALUES ($1, $2, $3, $4, NOW())`,
                    [
                        session_id,
                        userId,
                        JSON.stringify(result.detection_result),
                        result.detection_result.cognitive_load_estimate
                    ]
                );
            } catch (dbError) {
                console.warn('Failed to store detection result:', dbError.message);
                // Don't fail the request if we can't store the data
            }
        }

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Detection error:', error);
        res.status(500).json({
            success: false,
            message: 'Facial expression detection failed',
            error: error.message
        });
    }
});

/**
 * Batch detect expressions from multiple images
 * POST /api/facial-expression/batch
 */
router.post('/batch', [
    body('images')
        .isArray({ min: 1 })
        .withMessage('images must be a non-empty array'),
    body('images.*.image_base64')
        .notEmpty()
        .isString()
        .withMessage('Each image must have image_base64'),
    body('session_id')
        .notEmpty()
        .isUUID()
        .withMessage('session_id is required for batch detection')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { images, session_id } = req.body;
        const userId = req.user.user_id;

        // Call facial expression detection service
        const result = await fedClient.detectBatch(images, userId, session_id);

        // Calculate aggregate stress indicators
        const stressIndicators = detectStressIndicators(result.results);
        const averageLoad = calculateAverageLoad(result.results);

        // Store batch results in database
        try {
            await db.none(
                `INSERT INTO facial_expression_batch_data
                 (session_id, user_id, batch_data, average_cognitive_load, stress_indicators, recorded_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [
                    session_id,
                    userId,
                    JSON.stringify(result.results),
                    averageLoad,
                    JSON.stringify(stressIndicators)
                ]
            );
        } catch (dbError) {
            console.warn('Failed to store batch results:', dbError.message);
        }

        res.status(200).json({
            success: true,
            data: {
                ...result,
                stress_indicators: stressIndicators,
                average_cognitive_load: averageLoad
            }
        });
    } catch (error) {
        console.error('Batch detection error:', error);
        res.status(500).json({
            success: false,
            message: 'Batch facial expression detection failed',
            error: error.message
        });
    }
});

/**
 * Calibrate facial expression detector for user
 * POST /api/facial-expression/calibrate
 */
router.post('/calibrate', [
    body('images')
        .isArray({ min: 3, max: 10 })
        .withMessage('images must be an array of 3-10 images')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { images } = req.body;
        const userId = req.user.user_id;

        // Call calibration service
        const calibrationResult = await fedClient.calibrateUser(userId, images);

        // Store calibration data
        try {
            await db.none(
                `INSERT INTO user_calibration_data
                 (user_id, calibration_data, calibrated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (user_id) DO UPDATE SET
                 calibration_data = EXCLUDED.calibration_data,
                 calibrated_at = NOW()`,
                [
                    userId,
                    JSON.stringify(calibrationResult)
                ]
            );
        } catch (dbError) {
            console.warn('Failed to store calibration data:', dbError.message);
        }

        res.status(200).json({
            success: true,
            message: 'User calibration completed successfully',
            data: calibrationResult
        });
    } catch (error) {
        console.error('Calibration error:', error);
        res.status(500).json({
            success: false,
            message: 'Facial expression calibration failed',
            error: error.message
        });
    }
});

/**
 * Get facial expression history for a session
 * GET /api/facial-expression/session/:sessionId
 */
router.get('/session/:sessionId', [
    param('sessionId')
        .isUUID()
        .withMessage('sessionId must be a valid UUID')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { sessionId } = req.params;
        const userId = req.user.user_id;

        // Get session to verify ownership
        const session = await db.oneOrNone(
            'SELECT * FROM learning_sessions WHERE session_id = $1 AND user_id = $2',
            [sessionId, userId]
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        // Get facial expression data for session
        const expressionData = await db.any(
            `SELECT * FROM facial_expression_data
             WHERE session_id = $1
             ORDER BY detected_at ASC`,
            [sessionId]
        );

        // Get batch data if exists
        const batchData = await db.oneOrNone(
            `SELECT * FROM facial_expression_batch_data
             WHERE session_id = $1`,
            [sessionId]
        );

        res.status(200).json({
            success: true,
            data: {
                session_id: sessionId,
                expression_frames: expressionData.length,
                individual_detections: expressionData,
                batch_analysis: batchData,
                summary: expressionData.length > 0 ? {
                    average_cognitive_load: (expressionData.reduce((sum, d) => sum + (d.cognitive_load || 0), 0) / expressionData.length).toFixed(2),
                    high_load_count: expressionData.filter(d => d.cognitive_load > 0.7).length,
                    low_load_count: expressionData.filter(d => d.cognitive_load < 0.4).length
                } : {}
            }
        });
    } catch (error) {
        console.error('Get session expressions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve facial expression data',
            error: error.message
        });
    }
});

/**
 * Get user calibration status
 * GET /api/facial-expression/calibration-status
 */
router.get('/calibration-status', async (req, res) => {
    try {
        const userId = req.user.user_id;

        const calibration = await db.oneOrNone(
            `SELECT * FROM user_calibration_data
             WHERE user_id = $1`,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: {
                user_id: userId,
                is_calibrated: !!calibration,
                calibration_data: calibration || null,
                last_calibrated: calibration?.calibrated_at || null
            }
        });
    } catch (error) {
        console.error('Get calibration status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve calibration status',
            error: error.message
        });
    }
});

export default router;
