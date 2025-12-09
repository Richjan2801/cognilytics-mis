// Topics controller - handles topic/subject management
import { validationResult } from 'express-validator';
import * as topicModel from '../models/topics.model.js';
import { handleDatabaseError } from '../config/db.js';

/**
 * Create a new topic
 * POST /api/topics
 */
export async function createTopic(req, res) {
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

        // Only teachers and admins can create topics
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only teachers and admins can create topics',
            });
        }

        const {
            name,
            description,
            subject,
            grade_level,
            difficulty_level,
            institution_id,
            estimated_duration_mins,
            learning_objectives = [],
            prerequisites = [],
            metadata = {},
        } = req.body;

        const topic = await topicModel.createTopic({
            name,
            description,
            subject,
            grade_level,
            difficulty_level,
            teacher_id: req.user.user_id,
            institution_id: institution_id || req.user.institution_id,
            estimated_duration_mins,
            learning_objectives,
            prerequisites,
            metadata,
        });

        res.status(201).json({
            success: true,
            message: 'Topic created successfully',
            data: { topic },
        });
    } catch (error) {
        console.error('Create topic error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get all topics with filters
 * GET /api/topics
 */
export async function getTopics(req, res) {
    try {
        const {
            teacher_id,
            institution_id,
            subject,
            grade_level,
            is_active,
            limit = 100,
            offset = 0,
        } = req.query;

        // Students can only see active topics
        const filters = {
            limit: parseInt(limit),
            offset: parseInt(offset),
        };

        if (req.user.role === 'student') {
            filters.is_active = true;
        } else if (is_active !== undefined) {
            filters.is_active = is_active === 'true';
        }

        if (teacher_id) filters.teacher_id = teacher_id;
        if (institution_id) filters.institution_id = institution_id;
        if (subject) filters.subject = subject;
        if (grade_level) filters.grade_level = grade_level;

        const topics = await topicModel.getTopics(filters);
        const total = await topicModel.countTopics(filters);

        res.status(200).json({
            success: true,
            data: {
                topics,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    has_more: total > parseInt(offset) + topics.length,
                },
            },
        });
    } catch (error) {
        console.error('Get topics error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get topic by ID
 * GET /api/topics/:id
 */
export async function getTopicById(req, res) {
    try {
        const { id } = req.params;

        const topic = await topicModel.getTopicById(id);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found',
            });
        }

        // Students can only see active topics
        if (req.user.role === 'student' && !topic.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found',
            });
        }

        res.status(200).json({
            success: true,
            data: { topic },
        });
    } catch (error) {
        console.error('Get topic error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get my topics (teacher's topics)
 * GET /api/topics/my-topics
 */
export async function getMyTopics(req, res) {
    try {
        // Only teachers can access this endpoint
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only teachers and admins can access their topics',
            });
        }

        const topics = await topicModel.getTopicsByTeacher(req.user.user_id);

        res.status(200).json({
            success: true,
            data: {
                count: topics.length,
                topics,
            },
        });
    } catch (error) {
        console.error('Get my topics error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Get topic statistics
 * GET /api/topics/:id/statistics
 */
export async function getTopicStatistics(req, res) {
    try {
        const { id } = req.params;

        // Verify topic exists
        const topic = await topicModel.getTopicById(id);
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found',
            });
        }

        // Only topic owner, admins, or teachers can view statistics
        if (
            req.user.role === 'student' ||
            (req.user.role === 'teacher' && topic.teacher_id !== req.user.user_id && req.user.role !== 'admin')
        ) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this topic statistics',
            });
        }

        const stats = await topicModel.getTopicStatistics(id);

        res.status(200).json({
            success: true,
            data: { statistics: stats },
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
 * Get unique subjects
 * GET /api/topics/subjects
 */
export async function getSubjects(req, res) {
    try {
        const { institution_id } = req.query;

        const subjects = await topicModel.getUniqueSubjects(institution_id);

        res.status(200).json({
            success: true,
            data: {
                count: subjects.length,
                subjects,
            },
        });
    } catch (error) {
        console.error('Get subjects error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Update topic
 * PUT /api/topics/:id
 */
export async function updateTopic(req, res) {
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

        // Verify topic exists
        const existingTopic = await topicModel.getTopicById(id);
        if (!existingTopic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found',
            });
        }

        // Only topic owner or admins can update
        if (existingTopic.teacher_id !== req.user.user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this topic',
            });
        }

        const {
            name,
            description,
            subject,
            grade_level,
            difficulty_level,
            estimated_duration_mins,
            learning_objectives,
            prerequisites,
            is_active,
            metadata,
        } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (subject !== undefined) updateData.subject = subject;
        if (grade_level !== undefined) updateData.grade_level = grade_level;
        if (difficulty_level !== undefined) updateData.difficulty_level = difficulty_level;
        if (estimated_duration_mins !== undefined) updateData.estimated_duration_mins = estimated_duration_mins;
        if (learning_objectives !== undefined) updateData.learning_objectives = learning_objectives;
        if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
        if (is_active !== undefined) updateData.is_active = is_active;
        if (metadata !== undefined) updateData.metadata = metadata;

        const topic = await topicModel.updateTopic(id, updateData);

        res.status(200).json({
            success: true,
            message: 'Topic updated successfully',
            data: { topic },
        });
    } catch (error) {
        console.error('Update topic error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Delete topic (soft delete)
 * DELETE /api/topics/:id
 */
export async function deleteTopic(req, res) {
    try {
        const { id } = req.params;

        // Verify topic exists
        const existingTopic = await topicModel.getTopicById(id);
        if (!existingTopic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found',
            });
        }

        // Only topic owner or admins can delete
        if (existingTopic.teacher_id !== req.user.user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this topic',
            });
        }

        await topicModel.deleteTopic(id);

        res.status(200).json({
            success: true,
            message: 'Topic deleted successfully',
        });
    } catch (error) {
        console.error('Delete topic error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}
