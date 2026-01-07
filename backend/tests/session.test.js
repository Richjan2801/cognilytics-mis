import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
    createSession,
    endSession,
    getSession,
    getActiveSessions,
    getMySessions,
    getSessionStatistics,
    getSessionsByTopic,
    getSessionsByQuiz,
    updateMetadata
} from '../src/controllers/session.controller.js';

// Mock dependencies
vi.mock('express-validator', () => ({
    validationResult: vi.fn()
}));

vi.mock('../src/models/sessions.model.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        createSession: vi.fn(),
        endSession: vi.fn(),
        getSessionById: vi.fn(),
        getActiveSessions: vi.fn(),
        getSessionsByUser: vi.fn(),
        countSessionsByUser: vi.fn(),
        getSessionStatistics: vi.fn(),
        getSessionsByTopic: vi.fn(),
        getSessionsByQuiz: vi.fn(),
        updateSessionMetadata: vi.fn()
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
import * as sessionModel from '../src/models/sessions.model.js';
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

app.post('/api/sessions', mockAuthStudent, createSession);
app.put('/api/sessions/:sessionId/end', mockAuthStudent, endSession);
app.get('/api/sessions/:sessionId', mockAuthStudent, getSession);
app.get('/api/sessions/active', mockAuthStudent, getActiveSessions);
app.get('/api/sessions/my-sessions', mockAuthStudent, getMySessions);
app.get('/api/sessions/statistics', mockAuthStudent, getSessionStatistics);
app.get('/api/sessions/topic/:topicId', mockAuthStudent, getSessionsByTopic);
app.get('/api/sessions/quiz/:quizId', mockAuthStudent, getSessionsByQuiz);
app.patch('/api/sessions/:sessionId/metadata', mockAuthStudent, updateMetadata);

describe('Session Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createSession', () => {
        it('should create session successfully', async () => {
            // Mock validation success
            validationResult.mockReturnValue({
                isEmpty: () => true
            });

            // Mock session creation
            const mockSession = {
                session_id: 'session-123',
                user_id: 'test-user-id',
                topic_id: 'topic-123',
                quiz_id: null,
                session_type: 'study',
                started_at: '2026-01-05T10:06:58.693Z', // String format from DB
                device_type: 'desktop'
            };

            sessionModel.createSession.mockResolvedValue(mockSession);

            const response = await request(app)
                .post('/api/sessions')
                .send({
                    topic_id: 'topic-123',
                    session_type: 'study',
                    device_type: 'desktop',
                    metadata: { subject: 'math' }
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Session created successfully');
            expect(response.body.data.session).toEqual(mockSession);
            expect(sessionModel.createSession).toHaveBeenCalledWith({
                user_id: 'test-user-id',
                topic_id: 'topic-123',
                quiz_id: null,
                session_type: 'study',
                device_type: 'desktop',
                ip_address: '::ffff:127.0.0.1',
                user_agent: null,
                metadata: { subject: 'math' }
            });
        });

        it('should return 400 for validation errors', async () => {
            validationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Session type is required' }]
            });

            const response = await request(app)
                .post('/api/sessions')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toEqual([{ msg: 'Session type is required' }]);
        });

        it('should handle database errors', async () => {
            validationResult.mockReturnValue({
                isEmpty: () => true
            });

            sessionModel.createSession.mockRejectedValue(new Error('Database error'));

            handleDatabaseError.mockReturnValue({
                status: 500,
                message: 'Internal server error',
                detail: 'Database connection failed'
            });

            const response = await request(app)
                .post('/api/sessions')
                .send({
                    session_type: 'study'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Internal server error');
        });
    });

    describe('endSession', () => {
        it('should end session successfully', async () => {
            // Mock session exists and belongs to user
            sessionModel.getSessionById.mockResolvedValue({
                session_id: 'session-123',
                user_id: 'test-user-id',
                ended_at: null
            });

            // Mock session ending
            const mockEndedSession = {
                session_id: 'session-123',
                user_id: 'test-user-id',
                started_at: '2026-01-05T10:06:58.801Z', // String format from DB
                ended_at: '2026-01-05T10:06:58.801Z', // String format from DB
                duration_seconds: 3600
            };

            sessionModel.endSession.mockResolvedValue(mockEndedSession);

            const response = await request(app)
                .put('/api/sessions/session-123/end');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Session ended successfully');
            expect(response.body.data.session).toEqual(mockEndedSession);
        });

        it('should return 404 if session not found', async () => {
            sessionModel.getSessionById.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/sessions/nonexistent-session/end');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Session not found');
        });

        it('should return 403 if session belongs to different user', async () => {
            sessionModel.getSessionById.mockResolvedValue({
                session_id: 'session-123',
                user_id: 'different-user-id'
            });

            const response = await request(app)
                .put('/api/sessions/session-123/end');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to end this session');
        });

        it('should return 400 if session already ended', async () => {
            sessionModel.getSessionById.mockResolvedValue({
                session_id: 'session-123',
                user_id: 'test-user-id',
                ended_at: new Date()
            });

            const response = await request(app)
                .put('/api/sessions/session-123/end');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Session has already ended');
        });
    });

    describe('getSession', () => {
        it('should return session successfully', async () => {
            const mockSession = {
                session_id: 'session-123',
                user_id: 'test-user-id',
                session_type: 'study',
                started_at: '2026-01-05T10:06:58.846Z' // String format from DB
            };

            sessionModel.getSessionById.mockResolvedValue(mockSession);

            const response = await request(app)
                .get('/api/sessions/session-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.session).toEqual(mockSession);
        });

        it('should return 404 if session not found', async () => {
            sessionModel.getSessionById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/sessions/nonexistent-session');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Session not found');
        });

        it('should return 403 if student tries to access other user session', async () => {
            const mockSession = {
                session_id: 'session-123',
                user_id: 'different-user-id'
            };

            sessionModel.getSessionById.mockResolvedValue(mockSession);

            const response = await request(app)
                .get('/api/sessions/session-123');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to view this session');
        });

        it('should allow teachers to access any session', async () => {
            // Create separate app for teacher
            const appTeacher = express();
            appTeacher.use(express.json());
            appTeacher.get('/api/sessions/:sessionId', mockAuthTeacher, getSession);

            const mockSession = {
                session_id: 'session-123',
                user_id: 'student-id'
            };

            sessionModel.getSessionById.mockResolvedValue(mockSession);

            const response = await request(appTeacher)
                .get('/api/sessions/session-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('getActiveSessions', () => {
        it('should return active sessions successfully', async () => {
            const mockSessions = [
                { session_id: 'session-1', session_type: 'study' },
                { session_id: 'session-2', session_type: 'quiz' }
            ];

            sessionModel.getActiveSessions.mockResolvedValue(mockSessions);

            // Create mock request/response
            const mockReq = {
                user: { user_id: 'test-user-id' }
            };
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };

            await getActiveSessions(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    count: 2,
                    sessions: mockSessions
                }
            });
        });
    });

    describe('getMySessions', () => {
        it('should return user sessions successfully', async () => {
            const mockSessions = [
                { session_id: 'session-1', session_type: 'study' },
                { session_id: 'session-2', session_type: 'quiz' }
            ];

            sessionModel.getSessionsByUser.mockResolvedValue(mockSessions);
            sessionModel.countSessionsByUser.mockResolvedValue(2);

            // Create mock request/response
            const mockReq = {
                user: { user_id: 'test-user-id' },
                query: {}
            };
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };

            await getMySessions(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    sessions: mockSessions,
                    pagination: {
                        total: 2,
                        limit: 50,
                        offset: 0,
                        has_more: false
                    }
                }
            });
        });
    });

    describe('getSessionStatistics', () => {
        it('should return session statistics successfully', async () => {
            const mockStats = {
                total_sessions: 10,
                quiz_sessions: 5,
                study_sessions: 3,
                practice_sessions: 2,
                completed_sessions: 8,
                avg_duration_seconds: 1800,
                total_duration_seconds: 14400
            };

            sessionModel.getSessionStatistics.mockResolvedValue(mockStats);

            // Create mock request/response
            const mockReq = {
                user: { user_id: 'test-user-id' },
                query: {}
            };
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };

            await getSessionStatistics(mockReq, mockRes);

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

    describe('getSessionsByTopic', () => {
        it('should return sessions by topic for teachers', async () => {
            // Create separate app for teacher
            const appTeacher = express();
            appTeacher.use(express.json());
            appTeacher.get('/api/sessions/topic/:topicId', mockAuthTeacher, getSessionsByTopic);

            const mockSessions = [
                { session_id: 'session-1', user_id: 'student-1' },
                { session_id: 'session-2', user_id: 'student-2' }
            ];

            sessionModel.getSessionsByTopic.mockResolvedValue(mockSessions);

            const response = await request(appTeacher)
                .get('/api/sessions/topic/topic-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.topic_id).toBe('topic-123');
            expect(response.body.data.sessions).toEqual(mockSessions);
        });

        it('should return 403 for students trying to access topic sessions', async () => {
            const response = await request(app)
                .get('/api/sessions/topic/topic-123');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Only teachers and admins can view topic sessions');
        });
    });

    describe('getSessionsByQuiz', () => {
        it('should return sessions by quiz for teachers', async () => {
            // Create separate app for teacher
            const appTeacher = express();
            appTeacher.use(express.json());
            appTeacher.get('/api/sessions/quiz/:quizId', mockAuthTeacher, getSessionsByQuiz);

            const mockSessions = [
                { session_id: 'session-1', user_id: 'student-1' },
                { session_id: 'session-2', user_id: 'student-2' }
            ];

            sessionModel.getSessionsByQuiz.mockResolvedValue(mockSessions);

            const response = await request(appTeacher)
                .get('/api/sessions/quiz/quiz-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.quiz_id).toBe('quiz-123');
            expect(response.body.data.sessions).toEqual(mockSessions);
        });

        it('should return 403 for students trying to access quiz sessions', async () => {
            const response = await request(app)
                .get('/api/sessions/quiz/quiz-123');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Only teachers and admins can view quiz sessions');
        });
    });

    describe('updateMetadata', () => {
        it('should update session metadata successfully', async () => {
            // Mock validation success
            validationResult.mockReturnValue({
                isEmpty: () => true
            });

            // Mock session exists and belongs to user
            sessionModel.getSessionById.mockResolvedValue({
                session_id: 'session-123',
                user_id: 'test-user-id'
            });

            // Mock metadata update
            const mockUpdatedSession = {
                session_id: 'session-123',
                metadata: { subject: 'math', difficulty: 'hard' }
            };

            sessionModel.updateSessionMetadata.mockResolvedValue(mockUpdatedSession);

            const response = await request(app)
                .patch('/api/sessions/session-123/metadata')
                .send({
                    metadata: { difficulty: 'hard' }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Session metadata updated successfully');
            expect(response.body.data.session).toEqual(mockUpdatedSession);
        });

        it('should return 400 for validation errors', async () => {
            validationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Invalid metadata' }]
            });

            const response = await request(app)
                .patch('/api/sessions/session-123/metadata')
                .send({ metadata: {} });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toEqual([{ msg: 'Invalid metadata' }]);
        });

        it('should return 404 if session not found', async () => {
            validationResult.mockReturnValue({
                isEmpty: () => true
            });

            sessionModel.getSessionById.mockResolvedValue(null);

            const response = await request(app)
                .patch('/api/sessions/nonexistent-session/metadata')
                .send({ metadata: { key: 'value' } });

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
                .patch('/api/sessions/session-123/metadata')
                .send({ metadata: { key: 'value' } });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to update this session');
        });
    });
});
