// Authentication controller - handles login, registration, token refresh, and OAuth
import { validationResult } from 'express-validator';
import * as userModel from '../models/users.model.js';
import { generateTokens, verifyRefreshToken } from '../auth/jwt.js';
import { handleDatabaseError } from '../config/db.js';
import config from '../config/env.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(req, res) {
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

        const { email, password, first_name, last_name, role, institution_id } = req.body;

        // Check if email already exists
        const emailInUse = await userModel.emailExists(email);
        if (emailInUse) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered',
            });
        }

        // Create user
        const user = await userModel.createUser({
            email,
            password,
            first_name,
            last_name,
            role: role || 'student',
            institution_id,
        });

        // Generate tokens
        const tokens = generateTokens(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    institution_id: user.institution_id,
                },
                ...tokens,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function login(req, res) {
    try {
        console.log('[AUTH] Login request received:', req.body?.email);
        
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('[AUTH] Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
        }

        const { email, password } = req.body;

        // Verify credentials against database
        const user = await userModel.verifyUserPassword(email, password);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account has been deactivated',
            });
        }

        // Generate tokens
        const tokens = generateTokens(user);

        // Remove password_hash from response
        const { password_hash, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                ...tokens,
            },
        });
    } catch (error) {
        console.error('[AUTH] Login error:', error);
        console.error('[AUTH] Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message,
            ...(config.NODE_ENV === 'development' && { stack: error.stack }),
        });
    }
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refreshToken(req, res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required',
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Check if user still exists and is active
        const user = await userModel.findUserById(decoded.user_id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account has been deactivated',
            });
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: tokens,
        });
    } catch (error) {
        console.error('Token refresh error:', error);

        if (error.message.includes('expired')) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token has expired. Please login again.',
            });
        }

        res.status(401).json({
            success: false,
            message: 'Invalid refresh token',
            error: error.message,
        });
    }
}

/**
 * Get current user profile
 * GET /api/auth/me
 */
export async function getCurrentUser(req, res) {
    try {
        // User is already attached by authenticate middleware
        const user = await userModel.findUserById(req.user.user_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    institution_id: user.institution_id,
                    is_active: user.is_active,
                    created_at: user.created_at,
                    last_login: user.last_login,
                },
            },
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user information',
            error: error.message,
        });
    }
}

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export async function updateProfile(req, res) {
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

        const { first_name, last_name, email } = req.body;

        // Check if email is being changed and if it's already in use
        if (email && email !== req.user.email) {
            const emailInUse = await userModel.emailExists(email);
            if (emailInUse) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already in use',
                });
            }
        }

        // Update user
        const updatedUser = await userModel.updateUser(req.user.user_id, {
            first_name,
            last_name,
            email,
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    user_id: updatedUser.user_id,
                    email: updatedUser.email,
                    first_name: updatedUser.first_name,
                    last_name: updatedUser.last_name,
                    role: updatedUser.role,
                    institution_id: updatedUser.institution_id,
                },
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        const dbError = handleDatabaseError(error);
        res.status(dbError.status).json({
            success: false,
            message: dbError.message,
            detail: dbError.detail,
        });
    }
}

/**
 * Change password
 * POST /api/auth/change-password
 */
export async function changePassword(req, res) {
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

        const { current_password, new_password } = req.body;

        // Verify current password
        const user = await userModel.verifyUserPassword(req.user.email, current_password);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        // Update password
        await userModel.updatePassword(req.user.user_id, new_password);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message,
        });
    }
}

/**
 * Logout (client-side should clear tokens)
 * POST /api/auth/logout
 */
export async function logout(req, res) {
    // In a stateless JWT system, logout is handled client-side by removing tokens
    // This endpoint is provided for consistency and future token blacklisting if needed
    res.status(200).json({
        success: true,
        message: 'Logout successful. Please clear your tokens.',
    });
}
/**
 * Google OAuth Callback Handler
 * GET /api/auth/google/callback
 * Called by Passport after Google authentication
 */
export async function googleCallback(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Google authentication failed',
            });
        }

        const user = req.user;
        const tokens = generateTokens(user);

        // Remove sensitive fields
        const { password_hash, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: 'Google authentication successful',
            data: {
                user: userWithoutPassword,
                ...tokens,
            },
        });
    } catch (error) {
        console.error('Google callback error:', error);
        res.status(500).json({
            success: false,
            message: 'Google authentication failed',
            error: error.message,
        });
    }
}

/**
 * Verify Google Token (for direct token verification)
 * POST /api/auth/google/verify
 */
export async function verifyGoogleToken(req, res) {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'ID token is required',
            });
        }

        // Verify token with Google
        const { OAuth2Client } = await import('google-auth-library').catch(() => null);
        
        if (!OAuth2Client) {
            return res.status(500).json({
                success: false,
                message: 'Google authentication library not installed',
            });
        }

        const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        // Find or create user
        let user = await userModel.findUserByEmail(payload.email);

        if (!user) {
            // Create new user from Google profile
            user = await userModel.createUser({
                email: payload.email,
                first_name: payload.given_name || '',
                last_name: payload.family_name || '',
                password: null, // OAuth users don't have passwords
                role: 'student',
                is_active: true,
            });
        }

        const tokens = generateTokens(user);
        const { password_hash, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: 'Google authentication successful',
            data: {
                user: userWithoutPassword,
                ...tokens,
            },
        });
    } catch (error) {
        console.error('Google token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid Google token',
            error: error.message,
        });
    }
}