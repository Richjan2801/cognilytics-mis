import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import request from 'supertest';
import { validationResult } from 'express-validator';

// Import controller functions
import {
    createTopic,
    getTopics,
    getTopicById,
    getMyTopics,
    getTopicStatistics,
    getSubjects,
    updateTopic,
    deleteTopic,
} from '../src/controllers/topic.controller.js';

// Import model for mocking
import * as topicModel from '../src/models/topics.model.js';

// Mock dependencies
vi.mock('express-validator', () => ({
    validationResult: vi.fn(),
}));

vi.mock('../src/models/topics.model.js', () => ({
    createTopic: vi.fn(),
    getTopics: vi.fn(),
    getTopicById: vi.fn(),
    getTopicsByTeacher: vi.fn(),
    getTopicStatistics: vi.fn(),
    getUniqueSubjects: vi.fn(),
    updateTopic: vi.fn(),
    deleteTopic: vi.fn(),
    countTopics: vi.fn(),
}));

vi.mock('../src/config/db.js', () => ({
    handleDatabaseError: vi.fn((error) => ({
        status: 500,
        message: 'Database error',
        detail: error.message,
    })),
}));

// Mock auth middleware
const mockAuthStudent = vi.fn((req, res, next) => {
    req.user = {
        user_id: 'student-user-id',
        role: 'student',
        institution_id: 'inst-123'
    };
    next();
});

const mockAuthTeacher = vi.fn((req, res, next) => {
    req.user = {
        user_id: 'teacher-user-id',
        role: 'teacher',
        institution_id: 'inst-123'
    };
    next();
});

const mockAuthAdmin = vi.fn((req, res, next) => {
    req.user = {
        user_id: 'admin-user-id',
        role: 'admin',
        institution_id: 'inst-123'
    };
    next();
});

// Setup Express app for HTTP tests
const app = express();
app.use(express.json());

// Routes for HTTP-based tests
app.post('/api/topics', mockAuthTeacher, createTopic);
app.get('/api/topics', mockAuthStudent, getTopics);
app.get('/api/topics/:id', mockAuthStudent, getTopicById);
app.get('/api/topics/my-topics', mockAuthTeacher, getMyTopics);
app.get('/api/topics/:id/statistics', mockAuthTeacher, getTopicStatistics);
app.get('/api/subjects', mockAuthStudent, getSubjects);
app.put('/api/topics/:id', mockAuthTeacher, updateTopic);
app.delete('/api/topics/:id', mockAuthTeacher, deleteTopic);

describe('Topic Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        validationResult.mockReturnValue({
            isEmpty: () => true,
            array: () => [],
        });
    });

    describe('createTopic', () => {
        it('should create topic successfully for teacher', async () => {
            const mockTopic = {
                topic_id: 'topic-123',
                name: 'Algebra Basics',
                description: 'Introduction to algebra',
                subject: 'Mathematics',
                grade_level: '9',
                difficulty_level: 'beginner',
                teacher_id: 'teacher-user-id',
                institution_id: 'inst-123',
                estimated_duration_mins: 60,
                is_active: true,
                created_at: '2024-01-01T10:00:00.000Z'
            };

            topicModel.createTopic.mockResolvedValue(mockTopic);

            const response = await request(app)
                .post('/api/topics')
                .send({
                    name: 'Algebra Basics',
                    description: 'Introduction to algebra',
                    subject: 'Mathematics',
                    grade_level: '9',
                    difficulty_level: 'beginner',
                    estimated_duration_mins: 60,
                    learning_objectives: ['Learn variables', 'Solve equations'],
                    prerequisites: [],
                    metadata: { subject: 'math' }
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Topic created successfully');
            expect(response.body.data.topic).toEqual(mockTopic);
            expect(topicModel.createTopic).toHaveBeenCalledWith({
                name: 'Algebra Basics',
                description: 'Introduction to algebra',
                subject: 'Mathematics',
                grade_level: '9',
                difficulty_level: 'beginner',
                teacher_id: 'teacher-user-id',
                institution_id: 'inst-123',
                estimated_duration_mins: 60,
                learning_objectives: ['Learn variables', 'Solve equations'],
                prerequisites: [],
                metadata: { subject: 'math' }
            });
        });

        it('should create topic successfully for admin', async () => {
            // Create separate app for admin
            const appAdmin = express();
            appAdmin.use(express.json());
            appAdmin.post('/api/topics', mockAuthAdmin, createTopic);

            const mockTopic = {
                topic_id: 'topic-124',
                name: 'Physics Advanced',
                subject: 'Physics',
                teacher_id: 'admin-user-id',
                institution_id: 'inst-123'
            };

            topicModel.createTopic.mockResolvedValue(mockTopic);

            const response = await request(appAdmin)
                .post('/api/topics')
                .send({
                    name: 'Physics Advanced',
                    subject: 'Physics',
                    institution_id: 'inst-456'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(topicModel.createTopic).toHaveBeenCalledWith({
                name: 'Physics Advanced',
                description: undefined,
                subject: 'Physics',
                grade_level: undefined,
                difficulty_level: undefined,
                teacher_id: 'admin-user-id',
                institution_id: 'inst-456',
                estimated_duration_mins: undefined,
                learning_objectives: [],
                prerequisites: [],
                metadata: {}
            });
        });

        it('should return 403 for students trying to create topics', async () => {
            // Create separate app for student
            const appStudent = express();
            appStudent.use(express.json());
            appStudent.post('/api/topics', mockAuthStudent, createTopic);

            const response = await request(appStudent)
                .post('/api/topics')
                .send({
                    name: 'Test Topic',
                    subject: 'Test'
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Only teachers and admins can create topics');
        });

        it('should return 400 for validation errors', async () => {
            validationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Name is required' }],
            });

            const response = await request(app)
                .post('/api/topics')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should handle database errors', async () => {
            topicModel.createTopic.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/topics')
                .send({
                    name: 'Test Topic',
                    subject: 'Test'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Database error');
        });
    });

    describe('getTopics', () => {
        it('should return topics with filters for teachers', async () => {
            // Create separate app for teacher
            const appTeacher = express();
            appTeacher.use(express.json());
            appTeacher.get('/api/topics', mockAuthTeacher, getTopics);

            const mockTopics = [
                { topic_id: 'topic-1', name: 'Math Topic', subject: 'Mathematics' },
                { topic_id: 'topic-2', name: 'Science Topic', subject: 'Science' }
            ];

            topicModel.getTopics.mockResolvedValue(mockTopics);
            topicModel.countTopics.mockResolvedValue(2);

            const response = await request(appTeacher)
                .get('/api/topics?subject=Mathematics&limit=10&offset=0');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.topics).toEqual(mockTopics);
            expect(response.body.data.pagination).toEqual({
                total: 2,
                limit: 10,
                offset: 0,
                has_more: false
            });
            expect(topicModel.getTopics).toHaveBeenCalledWith({
                subject: 'Mathematics',
                limit: 10,
                offset: 0
            });
        });

        it('should return only active topics for students', async () => {
            const mockTopics = [
                { topic_id: 'topic-1', name: 'Active Topic', is_active: true }
            ];

            topicModel.getTopics.mockResolvedValue(mockTopics);
            topicModel.countTopics.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/topics');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(topicModel.getTopics).toHaveBeenCalledWith({
                is_active: true,
                limit: 100,
                offset: 0
            });
        });

        it('should handle database errors', async () => {
            topicModel.getTopics.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/topics');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('getTopicById', () => {
        it('should return topic successfully', async () => {
            const mockTopic = {
                topic_id: 'topic-123',
                name: 'Test Topic',
                subject: 'Mathematics',
                teacher_id: 'teacher-user-id',
                is_active: true
            };

            topicModel.getTopicById.mockResolvedValue(mockTopic);

            const response = await request(app)
                .get('/api/topics/topic-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.topic).toEqual(mockTopic);
        });

        it('should return 404 if topic not found', async () => {
            topicModel.getTopicById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/topics/nonexistent-topic');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Topic not found');
        });

        it('should return 404 for inactive topics when accessed by students', async () => {
            const mockTopic = {
                topic_id: 'topic-123',
                name: 'Inactive Topic',
                is_active: false
            };

            topicModel.getTopicById.mockResolvedValue(mockTopic);

            const response = await request(app)
                .get('/api/topics/topic-123');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Topic not found');
        });

        it('should allow teachers to access inactive topics', async () => {
            // Create separate app for teacher
            const appTeacher = express();
            appTeacher.use(express.json());
            appTeacher.get('/api/topics/:topicId', mockAuthTeacher, getTopicById);

            const mockTopic = {
                topic_id: 'topic-123',
                name: 'Inactive Topic',
                is_active: false
            };

            topicModel.getTopicById.mockResolvedValue(mockTopic);

            const response = await request(appTeacher)
                .get('/api/topics/topic-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.topic).toEqual(mockTopic);
        });

        it('should handle database errors', async () => {
            topicModel.getTopicById.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/topics/topic-123');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('getMyTopics', () => {
        it('should return teacher topics successfully', async () => {
            const mockTopics = [
                { topic_id: 'topic-1', name: 'My Topic 1' },
                { topic_id: 'topic-2', name: 'My Topic 2' }
            ];

            topicModel.getTopicsByTeacher.mockResolvedValue(mockTopics);

            // Create mock request/response
            const mockReq = {
                user: { user_id: 'teacher-user-id', role: 'teacher' }
            };
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };

            await getMyTopics(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    count: 2,
                    topics: mockTopics
                }
            });
            expect(topicModel.getTopicsByTeacher).toHaveBeenCalledWith('teacher-user-id');
        });

        it('should handle database errors', async () => {
            topicModel.getTopicsByTeacher.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/topics/my');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('getTopicStatistics', () => {
        it('should return topic statistics successfully', async () => {
            const mockStats = {
                total_sessions: 25,
                completed_sessions: 20,
                avg_session_duration: 45,
                total_quizzes: 3,
                avg_quiz_score: 85.5
            };

            topicModel.getTopicById.mockResolvedValue({
                topic_id: 'topic-123',
                teacher_id: 'teacher-user-id'
            });
            topicModel.getTopicStatistics.mockResolvedValue(mockStats);

            // Create mock request/response
            const mockReq = {
                params: { id: 'topic-123' },
                user: { user_id: 'teacher-user-id', role: 'teacher' }
            };
            const mockRes = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };

            await getTopicStatistics(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: { statistics: mockStats }
            });
        });

        it('should handle database errors', async () => {
            topicModel.getTopicStatistics.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/topics/topic-123/statistics');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('getSubjects', () => {
        it('should return unique subjects successfully', async () => {
            const mockSubjects = ['Mathematics', 'Science', 'English'];

            topicModel.getUniqueSubjects.mockResolvedValue(mockSubjects);

            const response = await request(app)
                .get('/api/subjects');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.subjects).toEqual(mockSubjects);
        });

        it('should handle database errors', async () => {
            topicModel.getUniqueSubjects.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/subjects');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('updateTopic', () => {
        it('should update topic successfully for owner teacher', async () => {
            const mockTopic = {
                topic_id: 'topic-123',
                name: 'Updated Topic',
                description: 'Updated description',
                subject: 'Mathematics'
            };

            topicModel.getTopicById.mockResolvedValue({
                topic_id: 'topic-123',
                teacher_id: 'teacher-user-id'
            });
            topicModel.updateTopic.mockResolvedValue(mockTopic);

            const response = await request(app)
                .put('/api/topics/topic-123')
                .send({
                    name: 'Updated Topic',
                    description: 'Updated description'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Topic updated successfully');
            expect(response.body.data.topic).toEqual(mockTopic);
        });

        it('should return 403 if teacher tries to update other teacher topic', async () => {
            topicModel.getTopicById.mockResolvedValue({
                topic_id: 'topic-123',
                teacher_id: 'different-teacher-id'
            });

            const response = await request(app)
                .put('/api/topics/topic-123')
                .send({ name: 'Updated Topic' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to update this topic');
        });

        it('should allow admins to update any topic', async () => {
            // Create separate app for admin
            const appAdmin = express();
            appAdmin.use(express.json());
            appAdmin.put('/api/topics/:topicId', mockAuthAdmin, updateTopic);

            const mockTopic = {
                topic_id: 'topic-123',
                name: 'Admin Updated Topic'
            };

            topicModel.getTopicById.mockResolvedValue({
                topic_id: 'topic-123',
                teacher_id: 'different-teacher-id'
            });
            topicModel.updateTopic.mockResolvedValue(mockTopic);

            const response = await request(appAdmin)
                .put('/api/topics/topic-123')
                .send({ name: 'Admin Updated Topic' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 404 if topic not found', async () => {
            topicModel.getTopicById.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/topics/nonexistent-topic')
                .send({ name: 'Updated Topic' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Topic not found');
        });

        it('should return 400 for validation errors', async () => {
            topicModel.getTopicById.mockResolvedValue({
                topic_id: 'topic-123',
                teacher_id: 'teacher-user-id'
            });

            validationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Invalid data' }],
            });

            const response = await request(app)
                .put('/api/topics/topic-123')
                .send({ name: '' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should handle database errors', async () => {
            topicModel.getTopicById.mockResolvedValue({
                topic_id: 'topic-123',
                teacher_id: 'teacher-user-id'
            });
            topicModel.updateTopic.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .put('/api/topics/topic-123')
                .send({ name: 'Updated Topic' });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('deleteTopic', () => {
        it('should delete topic successfully for owner teacher', async () => {
            topicModel.getTopicById.mockResolvedValue({
                topic_id: 'topic-123',
                teacher_id: 'teacher-user-id'
            });
            topicModel.deleteTopic.mockResolvedValue(true);

            const response = await request(app)
                .delete('/api/topics/topic-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Topic deleted successfully');
        });

        it('should return 403 if teacher tries to delete other teacher topic', async () => {
            topicModel.getTopicById.mockResolvedValue({
                topic_id: 'topic-123',
                teacher_id: 'different-teacher-id'
            });

            const response = await request(app)
                .delete('/api/topics/topic-123');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to delete this topic');
        });

        it('should allow admins to delete any topic', async () => {
            // Create separate app for admin
            const appAdmin = express();
            appAdmin.use(express.json());
            appAdmin.delete('/api/topics/:topicId', mockAuthAdmin, deleteTopic);

            topicModel.getTopicById.mockResolvedValue({
                topic_id: 'topic-123',
                teacher_id: 'different-teacher-id'
            });
            topicModel.deleteTopic.mockResolvedValue(true);

            const response = await request(appAdmin)
                .delete('/api/topics/topic-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 404 if topic not found', async () => {
            topicModel.getTopicById.mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/topics/nonexistent-topic');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Topic not found');
        });

        it('should handle database errors', async () => {
            topicModel.getTopicById.mockResolvedValue({
                topic_id: 'topic-123',
                teacher_id: 'teacher-user-id'
            });
            topicModel.deleteTopic.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .delete('/api/topics/topic-123');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });
});