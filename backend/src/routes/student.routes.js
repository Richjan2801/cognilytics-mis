// Student routes - basic student endpoints for testing
import express from 'express';
import { authenticate } from '../auth/roleGuard.js';

const router = express.Router();

// All student routes require authentication
router.use(authenticate);

// Basic student profile endpoint for testing
router.get('/profile', (req, res) => {
    res.json({
        success: true,
        message: 'Student profile accessed',
        data: {
            user_id: req.user.user_id,
            email: req.user.email,
            role: req.user.role
        }
    });
});

export default router;
