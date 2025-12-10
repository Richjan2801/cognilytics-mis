// Quiz controller - handles quiz and question management
import { validationResult } from 'express-validator';
import * as quizModel from '../models/quizzes.model.js';
import * as topicModel from '../models/topics.model.js';
import { handleDatabaseError } from '../config/db.js';

/**
 * Create a new quiz
 * POST /api/quizzes
 */
export async function createQuiz(req, res) {
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

        // Only teachers and admins can create quizzes
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only teachers and admins can create quizzes',
            });
        }

        const {
            topic_id,
            title,
            description,
            time_limit_mins,
            passing_score,
            total_points,
            settings,
        } = req.body;

        // Verify topic exists
        const topic = await topicModel.getTopicById(topic_id);
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found',
            });
        }

        const quiz = await quizModel.createQuiz({
            topic_id,
            title,
            description,
            time_limit_mins,
            passing_score,
            total_points,
            created_by: req.user.user_id,
            settings,
        });

        res.status(201).json({
            success: true,
            message: 'Quiz created successfully',
            data: { quiz },
        });
    } catch (error) {
        console.error('Create quiz error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get all quizzes with filters
 * GET /api/quizzes
 */
export async function getQuizzes(req, res) {
    try {
        const {
            topic_id,
            created_by,
            is_active,
            limit = 100,
            offset = 0,
        } = req.query;

        const filters = {
            limit: parseInt(limit),
            offset: parseInt(offset),
        };

        // Students can only see active quizzes
        if (req.user.role === 'student') {
            filters.is_active = true;
        } else if (is_active !== undefined) {
            filters.is_active = is_active === 'true';
        }

        if (topic_id) filters.topic_id = topic_id;
        if (created_by) filters.created_by = created_by;

        const quizzes = await quizModel.getQuizzes(filters);
        const total = await quizModel.countQuizzes(filters);

        res.status(200).json({
            success: true,
            data: {
                quizzes,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    has_more: total > parseInt(offset) + quizzes.length,
                },
            },
        });
    } catch (error) {
        console.error('Get quizzes error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get quiz by ID with questions
 * GET /api/quizzes/:id
 */
export async function getQuizById(req, res) {
    try {
        const { id } = req.params;

        const quiz = await quizModel.getQuizById(id);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found',
            });
        }

        // Students can only see active quizzes
        if (req.user.role === 'student' && !quiz.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found',
            });
        }

        // Get questions (include answers only for teacher/admin)
        const includeAnswers = req.user.role === 'teacher' || req.user.role === 'admin';
        const questions = await quizModel.getQuizQuestions(id, includeAnswers);

        res.status(200).json({
            success: true,
            data: {
                quiz,
                questions,
            },
        });
    } catch (error) {
        console.error('Get quiz error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Update quiz
 * PUT /api/quizzes/:id
 */
export async function updateQuiz(req, res) {
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

        const { id } = req.params;

        // Verify quiz exists
        const existingQuiz = await quizModel.getQuizById(id);
        if (!existingQuiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found',
            });
        }

        // Only quiz creator or admins can update
        if (existingQuiz.created_by !== req.user.user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this quiz',
            });
        }

        const {
            title,
            description,
            time_limit_mins,
            passing_score,
            total_points,
            is_active,
            settings,
        } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (time_limit_mins !== undefined) updateData.time_limit_mins = time_limit_mins;
        if (passing_score !== undefined) updateData.passing_score = passing_score;
        if (total_points !== undefined) updateData.total_points = total_points;
        if (is_active !== undefined) updateData.is_active = is_active;
        if (settings !== undefined) updateData.settings = settings;

        const quiz = await quizModel.updateQuiz(id, updateData);

        res.status(200).json({
            success: true,
            message: 'Quiz updated successfully',
            data: { quiz },
        });
    } catch (error) {
        console.error('Update quiz error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Delete quiz (soft delete)
 * DELETE /api/quizzes/:id
 */
export async function deleteQuiz(req, res) {
    try {
        const { id } = req.params;

        // Verify quiz exists
        const existingQuiz = await quizModel.getQuizById(id);
        if (!existingQuiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found',
            });
        }

        // Only quiz creator or admins can delete
        if (existingQuiz.created_by !== req.user.user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this quiz',
            });
        }

        await quizModel.deleteQuiz(id);

        res.status(200).json({
            success: true,
            message: 'Quiz deleted successfully',
        });
    } catch (error) {
        console.error('Delete quiz error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

// ===== Quiz Questions =====

/**
 * Add question to quiz
 * POST /api/quizzes/:id/questions
 */
export async function addQuestion(req, res) {
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

        const { id } = req.params;

        // Verify quiz exists
        const quiz = await quizModel.getQuizById(id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found',
            });
        }

        // Only quiz creator or admins can add questions
        if (quiz.created_by !== req.user.user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to add questions to this quiz',
            });
        }

        const {
            question_text,
            question_type,
            options,
            correct_answer,
            points,
            order_index,
            explanation,
        } = req.body;

        const question = await quizModel.addQuizQuestion({
            quiz_id: id,
            question_text,
            question_type,
            options,
            correct_answer,
            points,
            order_index,
            explanation,
        });

        res.status(201).json({
            success: true,
            message: 'Question added successfully',
            data: { question },
        });
    } catch (error) {
        console.error('Add question error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Update quiz question
 * PUT /api/quizzes/questions/:questionId
 */
export async function updateQuestion(req, res) {
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

        const { questionId } = req.params;

        // Get the question to find its quiz_id
        const existingQuestion = await db.oneOrNone(
            'SELECT quiz_id FROM quiz_questions WHERE question_id = $1',
            [questionId]
        );

        if (!existingQuestion) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        // Verify quiz ownership
        const quiz = await quizModel.getQuizById(existingQuestion.quiz_id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found',
            });
        }

        // Only quiz creator or admins can update questions
        if (quiz.created_by !== req.user.user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this question',
            });
        }

        const {
            question_text,
            question_type,
            options,
            correct_answer,
            points,
            order_index,
            explanation,
        } = req.body;

        const updateData = {};
        if (question_text !== undefined) updateData.question_text = question_text;
        if (question_type !== undefined) updateData.question_type = question_type;
        if (options !== undefined) updateData.options = options;
        if (correct_answer !== undefined) updateData.correct_answer = correct_answer;
        if (points !== undefined) updateData.points = points;
        if (order_index !== undefined) updateData.order_index = order_index;
        if (explanation !== undefined) updateData.explanation = explanation;

        const question = await quizModel.updateQuizQuestion(questionId, updateData);

        res.status(200).json({
            success: true,
            message: 'Question updated successfully',
            data: { question },
        });
    } catch (error) {
        console.error('Update question error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Delete quiz question
 * DELETE /api/quizzes/questions/:questionId
 */
export async function deleteQuestion(req, res) {
    try {
        const { questionId } = req.params;

        // Get the question to find its quiz_id
        const existingQuestion = await db.oneOrNone(
            'SELECT quiz_id FROM quiz_questions WHERE question_id = $1',
            [questionId]
        );

        if (!existingQuestion) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        // Verify quiz ownership
        const quiz = await quizModel.getQuizById(existingQuestion.quiz_id);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found',
            });
        }

        // Only quiz creator or admins can delete questions
        if (quiz.created_by !== req.user.user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this question',
            });
        }

        await quizModel.deleteQuizQuestion(questionId);

        res.status(200).json({
            success: true,
            message: 'Question deleted successfully',
        });
    } catch (error) {
        console.error('Delete question error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

// ===== Quiz Attempts =====

/**
 * Start quiz attempt
 * POST /api/quizzes/:id/start
 */
export async function startQuizAttempt(req, res) {
    try {
        const { id } = req.params;
        const { session_id } = req.body;

        // Verify quiz exists and is active
        const quiz = await quizModel.getQuizById(id);
        if (!quiz || !quiz.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found or inactive',
            });
        }

        const attempt = await quizModel.createQuizAttempt({
            quiz_id: id,
            user_id: req.user.user_id,
            session_id,
        });

        // Get questions (without answers for students)
        const questions = await quizModel.getQuizQuestions(id, false);

        res.status(201).json({
            success: true,
            message: 'Quiz attempt started',
            data: {
                attempt,
                quiz,
                questions,
            },
        });
    } catch (error) {
        console.error('Start quiz attempt error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Submit quiz attempt
 * POST /api/quizzes/attempts/:attemptId/submit
 */
export async function submitQuizAttempt(req, res) {
    try {
        const { attemptId } = req.params;
        const { answers } = req.body;

        // Verify attempt exists and belongs to user
        const attempt = await quizModel.getQuizAttemptById(attemptId);
        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'Quiz attempt not found',
            });
        }

        if (attempt.user_id !== req.user.user_id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to submit this attempt',
            });
        }

        if (attempt.submitted_at) {
            return res.status(400).json({
                success: false,
                message: 'Quiz attempt has already been submitted',
            });
        }

        // Get quiz and questions
        const quiz = await quizModel.getQuizById(attempt.quiz_id);
        const questions = await quizModel.getQuizQuestions(attempt.quiz_id, true);

        // Calculate score
        let score = 0;
        let maxScore = 0;

        questions.forEach(question => {
            maxScore += question.points;
            const userAnswer = answers[question.question_id];

            if (userAnswer && userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()) {
                score += question.points;
            }
        });

        const passed = maxScore > 0 ? (score / maxScore) * 100 >= quiz.passing_score : false;

        // Submit attempt
        const submittedAttempt = await quizModel.submitQuizAttempt(attemptId, {
            answers,
            score,
            max_score: maxScore,
            passed,
        });

        res.status(200).json({
            success: true,
            message: 'Quiz submitted successfully',
            data: {
                attempt: submittedAttempt,
                score,
                max_score: maxScore,
                percentage: (score / maxScore) * 100,
                passed,
            },
        });
    } catch (error) {
        console.error('Submit quiz attempt error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get my quiz attempts
 * GET /api/quizzes/my-attempts
 */
export async function getMyAttempts(req, res) {
    try {
        const { quiz_id } = req.query;

        const attempts = await quizModel.getQuizAttemptsByUser(req.user.user_id, quiz_id);

        res.status(200).json({
            success: true,
            data: {
                count: attempts.length,
                attempts,
            },
        });
    } catch (error) {
        console.error('Get my attempts error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get quiz attempt results
 * GET /api/quizzes/attempts/:attemptId
 */
export async function getAttemptResults(req, res) {
    try {
        const { attemptId } = req.params;

        const attempt = await quizModel.getQuizAttemptById(attemptId);

        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: 'Quiz attempt not found',
            });
        }

        // Only the attempt owner, quiz creator, or admin can view results
        const quiz = await quizModel.getQuizById(attempt.quiz_id);
        if (
            attempt.user_id !== req.user.user_id &&
            quiz.created_by !== req.user.user_id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this attempt',
            });
        }

        // Get questions with answers (for review)
        const questions = await quizModel.getQuizQuestions(attempt.quiz_id, true);

        res.status(200).json({
            success: true,
            data: {
                attempt,
                quiz,
                questions,
            },
        });
    } catch (error) {
        console.error('Get attempt results error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}
