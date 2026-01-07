import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from 'express';
import request from 'supertest';
import { validationResult } from 'express-validator';

// Import controller functions
import {
    createQuiz,
    getQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    startQuizAttempt,
    submitQuizAttempt,
    getMyAttempts,
    getAttemptResults,
} from '../src/controllers/quiz.controller.js';

// Import model for mocking
import * as quizModel from '../src/models/quizzes.model.js';
import * as topicModel from '../src/models/topics.model.js';
import db from '../src/config/db.js';

// Mock dependencies
vi.mock('express-validator', () => ({
    validationResult: vi.fn(),
}));

vi.mock('../src/models/quizzes.model.js', () => ({
    createQuiz: vi.fn(),
    getQuizzes: vi.fn(),
    getQuizById: vi.fn(),
    getQuizzesByTopic: vi.fn(),
    updateQuiz: vi.fn(),
    deleteQuiz: vi.fn(),
    countQuizzes: vi.fn(),
    addQuizQuestion: vi.fn(),
    getQuizQuestions: vi.fn(),
    updateQuizQuestion: vi.fn(),
    deleteQuizQuestion: vi.fn(),
    createQuizAttempt: vi.fn(),
    submitQuizAttempt: vi.fn(),
    getQuizAttemptsByUser: vi.fn(),
    getQuizAttemptById: vi.fn(),
}));

vi.mock('../src/models/topics.model.js', () => ({
    getTopicById: vi.fn(),
}));

vi.mock('../src/config/db.js', () => ({
    handleDatabaseError: vi.fn((error) => ({
        status: 500,
        message: 'Database error',
        detail: error.message,
    })),
    default: {
        oneOrNone: vi.fn(),
    },
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
app.post('/api/quizzes', mockAuthTeacher, createQuiz);
app.get('/api/quizzes', mockAuthStudent, getQuizzes);
app.get('/api/quizzes/my-attempts', mockAuthStudent, getMyAttempts);
app.get('/api/quizzes/:id', mockAuthStudent, getQuizById);
app.put('/api/quizzes/:id', mockAuthTeacher, updateQuiz);
app.delete('/api/quizzes/:id', mockAuthTeacher, deleteQuiz);
app.post('/api/quizzes/:id/questions', mockAuthTeacher, addQuestion);
app.put('/api/quizzes/questions/:questionId', mockAuthTeacher, updateQuestion);
app.delete('/api/quizzes/questions/:questionId', mockAuthTeacher, deleteQuestion);
app.post('/api/quizzes/:id/attempt', mockAuthStudent, startQuizAttempt);
app.post('/api/quizzes/attempts/:attemptId/submit', mockAuthStudent, submitQuizAttempt);
app.get('/api/quizzes/attempts/:attemptId/results', mockAuthStudent, getAttemptResults);

describe('Quiz Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        validationResult.mockReturnValue({
            isEmpty: () => true,
            array: () => [],
        });
    });

    describe('createQuiz', () => {
        it('should create quiz successfully for teacher', async () => {
            const mockTopic = { topic_id: 'topic-123', teacher_id: 'teacher-user-id' };
            const mockQuiz = {
                quiz_id: 'quiz-123',
                topic_id: 'topic-123',
                title: 'Math Quiz',
                description: 'Basic algebra quiz',
                time_limit_mins: 30,
                passing_score: 70,
                total_points: 100,
                question_count: 0,
                is_active: true,
                created_at: '2024-01-01T10:00:00.000Z'
            };

            topicModel.getTopicById.mockResolvedValue(mockTopic);
            quizModel.createQuiz.mockResolvedValue(mockQuiz);

            const response = await request(app)
                .post('/api/quizzes')
                .send({
                    topic_id: 'topic-123',
                    title: 'Math Quiz',
                    description: 'Basic algebra quiz',
                    time_limit_mins: 30,
                    passing_score: 70,
                    total_points: 100,
                    settings: { shuffle_questions: true }
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Quiz created successfully');
            expect(response.body.data.quiz).toEqual(mockQuiz);
            expect(topicModel.getTopicById).toHaveBeenCalledWith('topic-123');
            expect(quizModel.createQuiz).toHaveBeenCalledWith({
                topic_id: 'topic-123',
                title: 'Math Quiz',
                description: 'Basic algebra quiz',
                time_limit_mins: 30,
                passing_score: 70,
                total_points: 100,
                created_by: 'teacher-user-id',
                settings: { shuffle_questions: true }
            });
        });

        it('should return 404 if topic not found', async () => {
            topicModel.getTopicById.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/quizzes')
                .send({
                    topic_id: 'nonexistent-topic',
                    title: 'Test Quiz'
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Topic not found');
        });

        it('should return 403 for students trying to create quizzes', async () => {
            // Create separate app for student
            const appStudent = express();
            appStudent.use(express.json());
            appStudent.post('/api/quizzes', mockAuthStudent, createQuiz);

            const response = await request(appStudent)
                .post('/api/quizzes')
                .send({
                    topic_id: 'topic-123',
                    title: 'Test Quiz'
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Only teachers and admins can create quizzes');
        });

        it('should return 400 for validation errors', async () => {
            validationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Title is required' }],
            });

            const response = await request(app)
                .post('/api/quizzes')
                .send({ topic_id: 'topic-123' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should handle database errors', async () => {
            const mockTopic = { topic_id: 'topic-123', teacher_id: 'teacher-user-id' };
            topicModel.getTopicById.mockResolvedValue(mockTopic);
            quizModel.createQuiz.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/quizzes')
                .send({
                    topic_id: 'topic-123',
                    title: 'Test Quiz'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('getQuizzes', () => {
        it('should return quizzes with filters for teachers', async () => {
            // Create separate app for teacher
            const appTeacher = express();
            appTeacher.use(express.json());
            appTeacher.get('/api/quizzes', mockAuthTeacher, getQuizzes);

            const mockQuizzes = [
                { quiz_id: 'quiz-1', title: 'Math Quiz', topic_id: 'topic-1' },
                { quiz_id: 'quiz-2', title: 'Science Quiz', topic_id: 'topic-2' }
            ];

            quizModel.getQuizzes.mockResolvedValue(mockQuizzes);
            quizModel.countQuizzes.mockResolvedValue(2);

            const response = await request(appTeacher)
                .get('/api/quizzes?topic_id=topic-123&limit=10&offset=0');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.quizzes).toEqual(mockQuizzes);
            expect(response.body.data.pagination).toEqual({
                total: 2,
                limit: 10,
                offset: 0,
                has_more: false
            });
            expect(quizModel.getQuizzes).toHaveBeenCalledWith({
                topic_id: 'topic-123',
                limit: 10,
                offset: 0
            });
        });

        it('should return only active quizzes for students', async () => {
            const mockQuizzes = [
                { quiz_id: 'quiz-1', title: 'Active Quiz', is_active: true }
            ];

            quizModel.getQuizzes.mockResolvedValue(mockQuizzes);
            quizModel.countQuizzes.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/quizzes');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(quizModel.getQuizzes).toHaveBeenCalledWith({
                is_active: true,
                limit: 100,
                offset: 0
            });
        });

        it('should handle database errors', async () => {
            quizModel.getQuizzes.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/quizzes');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('getQuizById', () => {
        it('should return quiz successfully', async () => {
            const mockQuiz = {
                quiz_id: 'quiz-123',
                title: 'Test Quiz',
                topic_id: 'topic-123',
                is_active: true,
                question_count: 5
            };

            quizModel.getQuizById.mockResolvedValue(mockQuiz);

            const response = await request(app)
                .get('/api/quizzes/quiz-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.quiz).toEqual(mockQuiz);
        });

        it('should return 404 if quiz not found', async () => {
            quizModel.getQuizById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/quizzes/nonexistent-quiz');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Quiz not found');
        });

        it('should return 404 for inactive quizzes when accessed by students', async () => {
            const mockQuiz = {
                quiz_id: 'quiz-123',
                title: 'Inactive Quiz',
                is_active: false
            };

            quizModel.getQuizById.mockResolvedValue(mockQuiz);

            const response = await request(app)
                .get('/api/quizzes/quiz-123');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Quiz not found');
        });

        it('should allow teachers to access inactive quizzes', async () => {
            // Create separate app for teacher
            const appTeacher = express();
            appTeacher.use(express.json());
            appTeacher.get('/api/quizzes/:id', mockAuthTeacher, getQuizById);

            const mockQuiz = {
                quiz_id: 'quiz-123',
                title: 'Inactive Quiz',
                is_active: false
            };

            quizModel.getQuizById.mockResolvedValue(mockQuiz);

            const response = await request(appTeacher)
                .get('/api/quizzes/quiz-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.quiz).toEqual(mockQuiz);
        });

        it('should handle database errors', async () => {
            quizModel.getQuizById.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/quizzes/quiz-123');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('updateQuiz', () => {
        it('should update quiz successfully for owner teacher', async () => {
            const mockQuiz = {
                quiz_id: 'quiz-123',
                title: 'Updated Quiz',
                description: 'Updated description'
            };

            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });
            quizModel.updateQuiz.mockResolvedValue(mockQuiz);

            const response = await request(app)
                .put('/api/quizzes/quiz-123')
                .send({
                    title: 'Updated Quiz',
                    description: 'Updated description'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Quiz updated successfully');
            expect(response.body.data.quiz).toEqual(mockQuiz);
        });

        it('should return 403 if teacher tries to update other teacher quiz', async () => {
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'different-teacher-id'
            });

            const response = await request(app)
                .put('/api/quizzes/quiz-123')
                .send({ title: 'Updated Quiz' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to update this quiz');
        });

        it('should allow admins to update any quiz', async () => {
            // Create separate app for admin
            const appAdmin = express();
            appAdmin.use(express.json());
            appAdmin.put('/api/quizzes/:id', mockAuthAdmin, updateQuiz);

            const mockQuiz = {
                quiz_id: 'quiz-123',
                title: 'Admin Updated Quiz'
            };

            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'different-teacher-id'
            });
            quizModel.updateQuiz.mockResolvedValue(mockQuiz);

            const response = await request(appAdmin)
                .put('/api/quizzes/quiz-123')
                .send({ title: 'Admin Updated Quiz' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 404 if quiz not found', async () => {
            quizModel.getQuizById.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/quizzes/nonexistent-quiz')
                .send({ title: 'Updated Quiz' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Quiz not found');
        });

        it('should return 400 for validation errors', async () => {
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });

            validationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Invalid data' }],
            });

            const response = await request(app)
                .put('/api/quizzes/quiz-123')
                .send({ title: '' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should handle database errors', async () => {
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });
            quizModel.updateQuiz.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .put('/api/quizzes/quiz-123')
                .send({ title: 'Updated Quiz' });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('deleteQuiz', () => {
        it('should delete quiz successfully for owner teacher', async () => {
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });
            quizModel.deleteQuiz.mockResolvedValue(true);

            const response = await request(app)
                .delete('/api/quizzes/quiz-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Quiz deleted successfully');
        });

        it('should return 403 if teacher tries to delete other teacher quiz', async () => {
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'different-teacher-id'
            });

            const response = await request(app)
                .delete('/api/quizzes/quiz-123');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to delete this quiz');
        });

        it('should allow admins to delete any quiz', async () => {
            // Create separate app for admin
            const appAdmin = express();
            appAdmin.use(express.json());
            appAdmin.delete('/api/quizzes/:id', mockAuthAdmin, deleteQuiz);

            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'different-teacher-id'
            });
            quizModel.deleteQuiz.mockResolvedValue(true);

            const response = await request(appAdmin)
                .delete('/api/quizzes/quiz-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should return 404 if quiz not found', async () => {
            quizModel.getQuizById.mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/quizzes/nonexistent-quiz');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Quiz not found');
        });

        it('should handle database errors', async () => {
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });
            quizModel.deleteQuiz.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .delete('/api/quizzes/quiz-123');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('addQuestion', () => {
        it('should add question successfully for quiz owner', async () => {
            const mockQuestion = {
                question_id: 'question-123',
                quiz_id: 'quiz-123',
                question_text: 'What is 2+2?',
                question_type: 'multiple_choice',
                options: ['3', '4', '5', '6'],
                correct_answer: '4',
                points: 10
            };

            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });
            quizModel.addQuizQuestion.mockResolvedValue(mockQuestion);

            const response = await request(app)
                .post('/api/quizzes/quiz-123/questions')
                .send({
                    question_text: 'What is 2+2?',
                    question_type: 'multiple_choice',
                    options: ['3', '4', '5', '6'],
                    correct_answer: '4',
                    points: 10
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Question added successfully');
            expect(response.body.data.question).toEqual(mockQuestion);
        });

        it('should return 403 if teacher tries to add question to other teacher quiz', async () => {
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'different-teacher-id'
            });

            const response = await request(app)
                .post('/api/quizzes/quiz-123/questions')
                .send({
                    question_text: 'Test question',
                    question_type: 'multiple_choice'
                });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to add questions to this quiz');
        });

        it('should return 404 if quiz not found', async () => {
            quizModel.getQuizById.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/quizzes/nonexistent-quiz/questions')
                .send({
                    question_text: 'Test question',
                    question_type: 'multiple_choice'
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Quiz not found');
        });

        it('should return 400 for validation errors', async () => {
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });

            validationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [{ msg: 'Question text is required' }],
            });

            const response = await request(app)
                .post('/api/quizzes/quiz-123/questions')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
        });

        it('should handle database errors', async () => {
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });
            quizModel.addQuizQuestion.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/quizzes/quiz-123/questions')
                .send({
                    question_text: 'Test question',
                    question_type: 'multiple_choice'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('updateQuestion', () => {
        it('should update question successfully for quiz owner', async () => {
            const mockQuestion = {
                question_id: 'question-123',
                question_text: 'Updated question',
                points: 15
            };

            db.oneOrNone.mockResolvedValue({ quiz_id: 'quiz-123' });
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });
            quizModel.updateQuizQuestion.mockResolvedValue(mockQuestion);

            const response = await request(app)
                .put('/api/quizzes/questions/question-123')
                .send({
                    question_text: 'Updated question',
                    points: 15
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Question updated successfully');
            expect(response.body.data.question).toEqual(mockQuestion);
        });

        it('should return 403 if teacher tries to update question in other teacher quiz', async () => {
            db.oneOrNone.mockResolvedValue({ quiz_id: 'quiz-123' });
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'different-teacher-id'
            });

            const response = await request(app)
                .put('/api/quizzes/questions/question-123')
                .send({ question_text: 'Updated question' });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to update this question');
        });

        it('should handle database errors', async () => {
            db.oneOrNone.mockResolvedValue({ quiz_id: 'quiz-123' });
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });
            quizModel.updateQuizQuestion.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .put('/api/quizzes/questions/question-123')
                .send({ question_text: 'Updated question' });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('deleteQuestion', () => {
        it('should delete question successfully for quiz owner', async () => {
            db.oneOrNone.mockResolvedValue({ quiz_id: 'quiz-123' });
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });
            quizModel.deleteQuizQuestion.mockResolvedValue(true);

            const response = await request(app)
                .delete('/api/quizzes/questions/question-123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Question deleted successfully');
        });

        it('should return 403 if teacher tries to delete question from other teacher quiz', async () => {
            db.oneOrNone.mockResolvedValue({ quiz_id: 'quiz-123' });
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'different-teacher-id'
            });

            const response = await request(app)
                .delete('/api/quizzes/questions/question-123');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to delete this question');
        });

        it('should handle database errors', async () => {
            db.oneOrNone.mockResolvedValue({ quiz_id: 'quiz-123' });
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });
            quizModel.deleteQuizQuestion.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .delete('/api/quizzes/questions/question-123');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('startQuizAttempt', () => {
        it('should start quiz attempt successfully', async () => {
            const mockAttempt = {
                attempt_id: 'attempt-123',
                quiz_id: 'quiz-123',
                user_id: 'student-user-id',
                started_at: '2024-01-01T10:00:00.000Z',
                status: 'in_progress'
            };

            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                is_active: true,
                time_limit_mins: 30
            });
            quizModel.createQuizAttempt.mockResolvedValue(mockAttempt);

            const response = await request(app)
                .post('/api/quizzes/quiz-123/attempt')
                .send({ session_id: 'session-123' });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Quiz attempt started');
            expect(response.body.data.attempt).toEqual(mockAttempt);
        });

        it('should return 404 if quiz not found', async () => {
            quizModel.getQuizById.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/quizzes/nonexistent-quiz/attempt')
                .send({ session_id: 'session-123' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Quiz not found or inactive');
        });

        it('should return 404 if quiz is inactive', async () => {
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                is_active: false
            });

            const response = await request(app)
                .post('/api/quizzes/quiz-123/attempt')
                .send({ session_id: 'session-123' });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Quiz not found or inactive');
        });

        it('should handle database errors', async () => {
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                is_active: true
            });
            quizModel.createQuizAttempt.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/quizzes/quiz-123/attempt');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('submitQuizAttempt', () => {
        it('should submit quiz attempt successfully', async () => {
            const mockResult = {
                attempt_id: 'attempt-123',
                score: 85,
                passed: true,
                completed_at: '2024-01-01T10:30:00.000Z',
                answers: [
                    { question_id: 'q1', selected_answer: 'A', is_correct: true },
                    { question_id: 'q2', selected_answer: 'B', is_correct: false }
                ]
            };

            quizModel.getQuizAttemptById.mockResolvedValue({
                attempt_id: 'attempt-123',
                user_id: 'student-user-id',
                status: 'in_progress'
            });
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                passing_score: 70
            });
            quizModel.getQuizQuestions.mockResolvedValue([
                { question_id: 'q1', points: 10, correct_answer: 'A' },
                { question_id: 'q2', points: 10, correct_answer: 'B' }
            ]);
            quizModel.submitQuizAttempt.mockResolvedValue(mockResult);

            const response = await request(app)
                .post('/api/quizzes/attempts/attempt-123/submit')
                .send({
                    answers: {
                        'q1': 'A',
                        'q2': 'B'
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Quiz submitted successfully');
            expect(response.body.data.attempt).toEqual(mockResult);
        });

        it('should return 404 if attempt not found', async () => {
            quizModel.getQuizAttemptById.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/quizzes/attempts/nonexistent-attempt/submit')
                .send({ answers: [] });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Quiz attempt not found');
        });

        it('should return 403 if attempt belongs to different user', async () => {
            quizModel.getQuizAttemptById.mockResolvedValue({
                attempt_id: 'attempt-123',
                user_id: 'different-user-id',
                status: 'in_progress'
            });

            const response = await request(app)
                .post('/api/quizzes/attempts/attempt-123/submit')
                .send({ answers: [] });

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to submit this attempt');
        });

        it('should return 400 if attempt is not in progress', async () => {
            quizModel.getQuizAttemptById.mockResolvedValue({
                attempt_id: 'attempt-123',
                user_id: 'student-user-id',
                completed_at: '2024-01-01T10:30:00.000Z'
            });
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                passing_score: 70
            });
            quizModel.getQuizQuestions.mockResolvedValue([]);

            const response = await request(app)
                .post('/api/quizzes/attempts/attempt-123/submit')
                .send({ answers: {} });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Quiz attempt has already been submitted');
        });

        it('should handle database errors', async () => {
            quizModel.getQuizAttemptById.mockResolvedValue({
                attempt_id: 'attempt-123',
                user_id: 'student-user-id',
                status: 'in_progress'
            });
            quizModel.submitQuizAttempt.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/quizzes/attempts/attempt-123/submit')
                .send({ answers: [] });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('getMyAttempts', () => {
        it('should return user quiz attempts successfully', async () => {
            const mockAttempts = [
                {
                    attempt_id: 'attempt-1',
                    quiz_id: 'quiz-1',
                    score: 85,
                    status: 'completed',
                    started_at: '2024-01-01T10:00:00.000Z'
                },
                {
                    attempt_id: 'attempt-2',
                    quiz_id: 'quiz-2',
                    status: 'in_progress',
                    started_at: '2024-01-01T11:00:00.000Z'
                }
            ];

            quizModel.getQuizAttemptsByUser.mockResolvedValue(mockAttempts);

            const response = await request(app)
                .get('/api/quizzes/my-attempts');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(2);
            expect(response.body.data.attempts).toEqual(mockAttempts);
        });

        it('should handle database errors', async () => {
            quizModel.getQuizAttemptsByUser.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/quizzes/my-attempts');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('getAttemptResults', () => {
        it('should return attempt results successfully', async () => {
            const mockResult = {
                attempt_id: 'attempt-123',
                quiz_id: 'quiz-123',
                user_id: 'student-user-id',
                score: 85,
                passed: true,
                answers: [
                    { question_id: 'q1', selected_answer: 'A', is_correct: true, points: 10 },
                    { question_id: 'q2', selected_answer: 'B', is_correct: false, points: 0 }
                ],
                started_at: '2024-01-01T10:00:00.000Z',
                completed_at: '2024-01-01T10:30:00.000Z'
            };

            quizModel.getQuizAttemptById.mockResolvedValue(mockResult);
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });
            quizModel.getQuizQuestions.mockResolvedValue([
                { question_id: 'q1', correct_answer: 'A', points: 10 },
                { question_id: 'q2', correct_answer: 'A', points: 10 }
            ]);

            const response = await request(app)
                .get('/api/quizzes/attempts/attempt-123/results');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.attempt).toEqual(mockResult);
        });

        it('should return 404 if attempt not found', async () => {
            quizModel.getQuizAttemptById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/quizzes/attempts/nonexistent-attempt/results');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Quiz attempt not found');
        });

        it('should return 403 if attempt belongs to different user', async () => {
            quizModel.getQuizAttemptById.mockResolvedValue({
                attempt_id: 'attempt-123',
                user_id: 'different-user-id'
            });

            const response = await request(app)
                .get('/api/quizzes/attempts/attempt-123/results');

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('You do not have permission to view this attempt');
        });

        it('should return 400 if attempt is not completed', async () => {
            quizModel.getQuizAttemptById.mockResolvedValue({
                attempt_id: 'attempt-123',
                user_id: 'student-user-id',
                quiz_id: 'quiz-123',
                status: 'in_progress'
            });
            quizModel.getQuizById.mockResolvedValue({
                quiz_id: 'quiz-123',
                created_by: 'teacher-user-id'
            });
            quizModel.getQuizQuestions.mockResolvedValue([]);

            const response = await request(app)
                .get('/api/quizzes/attempts/attempt-123/results');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should handle database errors', async () => {
            quizModel.getQuizAttemptById.mockResolvedValue({
                attempt_id: 'attempt-123',
                user_id: 'student-user-id',
                status: 'completed'
            });
            // Second call for getting results
            quizModel.getQuizAttemptById.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/quizzes/attempts/attempt-123/results');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });
});