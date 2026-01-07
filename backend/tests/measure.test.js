import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
    createMeasurement,
    getMeasurement,
    getMeasurementsBySession,
    getMyMeasurements,
    getLatestMeasurement,
    getUserStatistics,
    getTopicStatistics,
    getMeasurementsByTopic
} from '../src/controllers/measure.controller.js';

// Mock dependencies
vi.mock('express-validator', () => ({
    validationResult: vi.fn()
}));

vi.mock('../src/models/measurements.model.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        createMeasurement: vi.fn(),
        getMeasurementById: vi.fn(),
        getMeasurementsBySession: vi.fn(),
        getMeasurementsByUser: vi.fn(),
        getLatestMeasurement: vi.fn(),
        getUserCLStatistics: vi.fn(),
        getTopicCLStatistics: vi.fn(),
        getMeasurementsByTopic: vi.fn(),
        countMeasurements: vi.fn()
    };
});

vi.mock('../src/models/sessions.model.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getSessionById: vi.fn()
    };
});

vi.mock('../src/services/cl-calculation.service.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        calculateCognitiveLoad: vi.fn(),
        validateMeasurementData: vi.fn()
    };
});

vi.mock('../src/config/db.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        handleDatabaseError: vi.fn()
    };
});

import { validationResult } from 'express-validator';
import * as measureModel from '../src/models/measurements.model.js';
import * as sessionModel from '../src/models/sessions.model.js';
import { calculateCognitiveLoad, validateMeasurementData } from '../src/services/cl-calculation.service.js';
import { handleDatabaseError } from '../src/config/db.js';

// Create express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware - simulate what authenticate middleware does
const mockAuthStudent = (req, res, next) => {
    req.user = { user_id: 'test-user-id', role: 'student' };
    next();
};

const mockAuthTeacher = (req, res, next) => {
    req.user = { user_id: 'teacher-id', role: 'teacher' };
    next();
};

// Mock authenticate middleware to avoid JWT verification
vi.mock('../src/auth/roleGuard.js', () => ({
    authenticate: vi.fn((req, res, next) => {
        // This will be overridden in individual tests
        next();
    })
}));

app.post('/api/measurements', mockAuthStudent, createMeasurement);
app.get('/api/measurements/:id', mockAuthStudent, getMeasurement);
app.get('/api/measurements/session/:sessionId', mockAuthStudent, getMeasurementsBySession);
app.get('/api/measurements/my-measurements', mockAuthStudent, getMyMeasurements);
app.get('/api/measurements/latest', mockAuthStudent, getLatestMeasurement);
app.get('/api/measurements/statistics', mockAuthStudent, getUserStatistics);
app.get('/api/measurements/topic/:topicId/statistics', mockAuthStudent, getTopicStatistics);
app.get('/api/measurements/topic/:topicId', mockAuthStudent, getMeasurementsByTopic);

describe('Measurement Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createMeasurement', () => {
        it('should create measurement successfully', async () => {
            // Mock validation success
            validationResult.mockReturnValue({
                isEmpty: () => true
            });

            // Mock session exists and belongs to user
            sessionModel.getSessionById.mockResolvedValue({
                session_id: 'session-123',
                user_id: 'test-user-id'
            });

            // Mock validation data success
            validateMeasurementData.mockReturnValue({
                valid: true,
                errors: []
            });

            // Mock CL calculation
            calculateCognitiveLoad.mockReturnValue({
                sr_normalized: 0.5,
                pf_normalized: 0.3,
                bh_normalized: 0.2,
                ph_normalized: null,
                cl_index: 0.35,
                cl_category: 'optimal',
                weight_sr: 0.4,
                weight_pf: 0.3,
                weight_bh: 0.2,
                weight_ph: 0.1
            });

            // Mock measurement creation
            measureModel.createMeasurement.mockResolvedValue({
                measurement_id: 'meas-123',
                session_id: 'session-123',
                user_id: 'test-user-id',
                topic_id: null,
                quiz_id: null,
                measured_at: new Date(),
                cl_index: 0.35,
                cl_category: 'optimal',
                sr_normalized: 0.5,
                pf_normalized: 0.3,
                bh_normalized: 0.2,
                ph_normalized: null
            });

            const response = await request(app)
                .post('/api/measurements')
                .send({
                    session_id: 'session-123',
                    pf_accuracy: 0.85,
                    sr_paas_score: 5
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('CL measurement created successfully');
            expect(response.body.data.measurement_id).toBe('meas-123');
        });

        it('should return 400 for validation errors', async () => {
            validationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Invalid input' }]
            });

            const response = await request(app)
                .post('/api/measurements')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toEqual([{ msg: 'Invalid input' }]);
        });

        it('should return 404 if session not found', async () => {
            validationResult.mockReturnValue({
                isEmpty: () => true
            });

            sessionModel.getSessionById.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/measurements')
                .send({
                    session_id: 'nonexistent-session',
                    pf_accuracy: 0.85
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Session not found');
        });

        it('should return 403 if session belongs to different user', async () => {
            validationResult.mockReturnValue({
                isEmpty: () => true
            });

            sessionModel.getSessionById.mockResolvedValue({
                session_id: 'session-123',
                user_id: 'different-user-id'
            });

            const response = await request(app)
                .post('/api/measurements')
                .send({
                    session_id: 'session-123',
                    pf_accuracy: 0.85
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to create measurements for this session');
        });

        it('should return 400 for invalid measurement data', async () => {
            validationResult.mockReturnValue({
                isEmpty: () => true
            });

            sessionModel.getSessionById.mockResolvedValue({
                session_id: 'session-123',
                user_id: 'test-user-id'
            });

            validateMeasurementData.mockReturnValue({
                valid: false,
                errors: ['Invalid accuracy value']
            });

            const response = await request(app)
                .post('/api/measurements')
                .send({
                    session_id: 'session-123',
                    pf_accuracy: 1.5 // Invalid accuracy
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toEqual(['Invalid accuracy value']);
        });

        it('should handle database errors', async () => {
            validationResult.mockReturnValue({
                isEmpty: () => true
            });

            sessionModel.getSessionById.mockRejectedValue(new Error('Database error'));

            handleDatabaseError.mockReturnValue({
                status: 500,
                message: 'Internal server error',
                detail: 'Database connection failed'
            });

            const response = await request(app)
                .post('/api/measurements')
                .send({
                    session_id: 'session-123',
                    pf_accuracy: 0.85
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Internal server error');
        });
    });

    describe('getMeasurement', () => {
        it('should return measurement successfully', async () => {
            const mockMeasurement = {
                measurement_id: 'meas-123',
                user_id: 'test-user-id',
                session_id: 'session-123',
                cl_index: 0.35,
                cl_category: 'optimal'
            };

            measureModel.getMeasurementById.mockResolvedValue(mockMeasurement);

            const response = await request(app)
                .get('/api/measurements/meas-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.measurement).toEqual(mockMeasurement);
        });

        it('should return 404 if measurement not found', async () => {
            measureModel.getMeasurementById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/measurements/nonexistent-meas');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Measurement not found');
        });

        it('should return 403 if student tries to access other user measurement', async () => {
            const mockMeasurement = {
                measurement_id: 'meas-123',
                user_id: 'different-user-id',
                session_id: 'session-123'
            };

            measureModel.getMeasurementById.mockResolvedValue(mockMeasurement);

            const response = await request(app)
                .get('/api/measurements/meas-123');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to view this measurement');
        });

        it('should allow teachers to access any measurement', async () => {
            // Create separate app for teacher
            const appTeacher = express();
            appTeacher.use(express.json());
            appTeacher.get('/api/measurements/:id', mockAuthTeacher, getMeasurement);

            const mockMeasurement = {
                measurement_id: 'meas-123',
                user_id: 'student-id',
                session_id: 'session-123'
            };

            measureModel.getMeasurementById.mockResolvedValue(mockMeasurement);

            const response = await request(appTeacher)
                .get('/api/measurements/meas-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('getMeasurementsBySession', () => {
        it('should return measurements by session successfully', async () => {
            sessionModel.getSessionById.mockResolvedValue({
                session_id: 'session-123',
                user_id: 'test-user-id'
            });

            const mockMeasurements = [
                { measurement_id: 'meas-1', cl_index: 0.3 },
                { measurement_id: 'meas-2', cl_index: 0.4 }
            ];

            measureModel.getMeasurementsBySession.mockResolvedValue(mockMeasurements);

            const response = await request(app)
                .get('/api/measurements/session/session-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.session_id).toBe('session-123');
            expect(response.body.data.measurements).toEqual(mockMeasurements);
        });

        it('should return 404 if session not found', async () => {
            sessionModel.getSessionById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/measurements/session/nonexistent-session');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Session not found');
        });
    });

    describe('getMyMeasurements', () => {
        it('should return user measurements successfully', async () => {
            const mockMeasurements = [
                { measurement_id: 'meas-1', cl_index: 0.3 },
                { measurement_id: 'meas-2', cl_index: 0.4 }
            ];

            measureModel.getMeasurementsByUser.mockResolvedValue(mockMeasurements);
            measureModel.countMeasurements.mockResolvedValue(2);

            // Create mock request/response
            const mockReq = {
                user: { user_id: 'test-user-id' },
                query: {}
            };
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };

            await getMyMeasurements(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    measurements: mockMeasurements,
                    pagination: {
                        total: 2,
                        limit: 100,
                        offset: 0,
                        has_more: false
                    }
                }
            });
        });
    });

    describe('getLatestMeasurement', () => {
        it('should return latest measurement successfully', async () => {
            const mockMeasurement = {
                measurement_id: 'meas-latest',
                cl_index: 0.35,
                cl_category: 'optimal'
            };

            measureModel.getLatestMeasurement.mockResolvedValue(mockMeasurement);

            // Create mock request/response
            const mockReq = {
                user: { user_id: 'test-user-id' }
            };
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };

            await getLatestMeasurement(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: { measurement: mockMeasurement }
            });
        });

        it('should return 404 if no measurements found', async () => {
            measureModel.getLatestMeasurement.mockResolvedValue(null);

            // Create mock request/response
            const mockReq = {
                user: { user_id: 'test-user-id' }
            };
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };

            await getLatestMeasurement(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'No measurements found'
            });
        });
    });

    describe('getUserStatistics', () => {
        it('should return user statistics successfully', async () => {
            const mockStats = {
                total_measurements: 10,
                avg_cl_index: 0.4,
                low_count: 2,
                optimal_count: 5,
                high_count: 2,
                overload_count: 1
            };

            measureModel.getUserCLStatistics.mockResolvedValue(mockStats);

            // Create mock request/response
            const mockReq = {
                user: { user_id: 'test-user-id' },
                query: {}
            };
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };

            await getUserStatistics(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    period: expect.any(Object),
                    statistics: mockStats
                }
            });
        });
    });

    describe('getTopicStatistics', () => {
        it('should return topic statistics for teachers', async () => {
            // Create separate app for teacher
            const appTeacher = express();
            appTeacher.use(express.json());
            appTeacher.get('/api/measurements/topic/:topicId/statistics', mockAuthTeacher, getTopicStatistics);

            const mockStats = {
                total_measurements: 25,
                unique_students: 10,
                avg_cl_index: 0.45,
                overload_percentage: 0.2
            };

            measureModel.getTopicCLStatistics.mockResolvedValue(mockStats);

            const response = await request(appTeacher)
                .get('/api/measurements/topic/topic-123/statistics');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.topic_id).toBe('topic-123');
            expect(response.body.data.statistics).toEqual(mockStats);
        });

        it('should return 403 for students trying to access topic statistics', async () => {
            const response = await request(app)
                .get('/api/measurements/topic/topic-123/statistics');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Only teachers and admins can view topic statistics');
        });
    });

    describe('getMeasurementsByTopic', () => {
        it('should return measurements by topic for teachers', async () => {
            // Create separate app for teacher
            const appTeacher = express();
            appTeacher.use(express.json());
            appTeacher.get('/api/measurements/topic/:topicId', mockAuthTeacher, getMeasurementsByTopic);

            const mockMeasurements = [
                { measurement_id: 'meas-1', user_id: 'student-1', cl_index: 0.3 },
                { measurement_id: 'meas-2', user_id: 'student-2', cl_index: 0.4 }
            ];

            measureModel.getMeasurementsByTopic.mockResolvedValue(mockMeasurements);

            const response = await request(appTeacher)
                .get('/api/measurements/topic/topic-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.topic_id).toBe('topic-123');
            expect(response.body.data.measurements).toEqual(mockMeasurements);
        });

        it('should return 403 for students trying to access topic measurements', async () => {
            const response = await request(app)
                .get('/api/measurements/topic/topic-123');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Only teachers and admins can view topic measurements');
        });
    });
});
