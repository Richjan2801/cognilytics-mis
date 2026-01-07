// Auth controller tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { register, login } from '../src/controllers/auth.controller.js';
import * as userModel from '../src/models/users.model.js';
import { generateTokens } from '../src/auth/jwt.js';

// Mock dependencies
vi.mock('../src/models/users.model.js', () => ({
    emailExists: vi.fn(),
    createUser: vi.fn(),
    findUserByEmail: vi.fn(),
    verifyUserPassword: vi.fn(),
}));
vi.mock('../src/auth/jwt.js', () => ({
    generateTokens: vi.fn(),
}));
vi.mock('express-validator', () => ({
    validationResult: vi.fn(),
}));

describe('Auth Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('register', () => {
        it('should register user successfully with valid input', async () => {
            // Mock validation success
            const { validationResult } = await import('express-validator');
            validationResult.mockReturnValue({
                isEmpty: vi.fn().mockReturnValue(true),
            });

            // Mock user model
            userModel.emailExists.mockResolvedValue(false);
            userModel.createUser.mockResolvedValue({
                user_id: '123',
                email: 'test@example.com',
                first_name: 'Test',
                last_name: 'User',
                role: 'student',
            });

            // Mock JWT
            generateTokens.mockReturnValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            });

            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'Password123',
                    first_name: 'Test',
                    last_name: 'User',
                },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: expect.objectContaining({
                        email: 'test@example.com',
                        first_name: 'Test',
                        last_name: 'User',
                        role: 'student',
                    }),
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token',
                },
            });
        });

        it('should return 400 for validation errors', async () => {
            // Mock validation failure
            const { validationResult } = await import('express-validator');
            validationResult.mockReturnValue({
                isEmpty: vi.fn().mockReturnValue(false),
                array: vi.fn().mockReturnValue([{ msg: 'Email is required' }]),
            });

            const req = { body: {} };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors: [{ msg: 'Email is required' }],
            });
        });

        it('should return 409 if email already exists', async () => {
            // Mock validation success
            const { validationResult } = await import('express-validator');
            validationResult.mockReturnValue({
                isEmpty: vi.fn().mockReturnValue(true),
            });

            // Mock email exists
            userModel.emailExists.mockResolvedValue(true);

            const req = {
                body: {
                    email: 'existing@example.com',
                    password: 'Password123',
                    first_name: 'Test',
                    last_name: 'User',
                },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email already registered',
            });
        });
    });

    describe('login', () => {
        it('should login user successfully', async () => {
            // Mock validation success
            const { validationResult } = await import('express-validator');
            validationResult.mockReturnValue({
                isEmpty: vi.fn().mockReturnValue(true),
            });

            // Mock user model
            userModel.findUserByEmail.mockResolvedValue({
                user_id: '123',
                email: 'test@example.com',
                password_hash: '$2a$10$hash',
                first_name: 'Test',
                last_name: 'User',
                role: 'student',
                is_active: true,
            });

            // Mock password verification
            userModel.verifyUserPassword.mockResolvedValue({
                user_id: '123',
                email: 'test@example.com',
                password_hash: '$2a$10$hash',
                first_name: 'Test',
                last_name: 'User',
                role: 'student',
                is_active: true,
            });

            // Mock JWT
            generateTokens.mockReturnValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            });

            const req = {
                body: {
                    email: 'test@example.com',
                    password: 'Password123',
                },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Login successful',
                data: {
                    user: expect.objectContaining({
                        email: 'test@example.com',
                        first_name: 'Test',
                        last_name: 'User',
                        role: 'student',
                    }),
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token',
                },
            });
        });

        it('should return 401 for invalid credentials', async () => {
            // Mock validation success
            const { validationResult } = await import('express-validator');
            validationResult.mockReturnValue({
                isEmpty: vi.fn().mockReturnValue(true),
            });

            // Mock user not found
            userModel.findUserByEmail.mockResolvedValue(null);

            // Mock password verification
            userModel.verifyUserPassword.mockResolvedValue(null);

            const req = {
                body: {
                    email: 'nonexistent@example.com',
                    password: 'Password123',
                },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid email or password',
            });
        });
    });
});