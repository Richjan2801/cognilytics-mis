// Authentication Integration Tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import IntegrationTestHelper from './helper.js';

const helper = new IntegrationTestHelper('_auth');

describe('Authentication Integration', () => {
    beforeAll(async () => {
        // Set test-specific database name for this test file
        process.env.TEST_DB_NAME = 'cognilytics_mis_test_auth';
        helper.testDbName = 'cognilytics_mis_test_auth';
        await helper.setupDatabase();
    }, 60000);

    afterAll(async () => {
        await helper.cleanupDatabase();
    });
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'newuser@test.com',
                password: 'Password123',
                first_name: 'New',
                last_name: 'User',
                role: 'student'
                // institutionId is optional
            };

            const response = await helper.makeRequest('POST', '/api/auth/register', {
                data: userData
            });

            helper.assertSuccessResponse(response, null, 201);
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.role).toBe(userData.role);
            expect(response.body.data.accessToken).toBeDefined();
        });

        it('should return 400 for duplicate email', async () => {
            // First create a user
            await helper.createTestUser({ email: 'duplicate@test.com' });

            // Try to register with same email
            const userData = {
                email: 'duplicate@test.com',
                password: 'Password123',
                first_name: 'Duplicate',
                last_name: 'User',
                role: 'student',
                institutionId: 1
            };

            const response = await helper.makeRequest('POST', '/api/auth/register', {
                data: userData
            });

            helper.assertErrorResponse(response, 409);
            expect(response.body.message).toContain('already registered');
        });

        it('should return 400 for invalid data', async () => {
            const invalidData = {
                email: 'invalid-email',
                password: '123', // too short
                firstName: '',
                lastName: 'User',
                role: 'invalid-role'
            };

            const response = await helper.makeRequest('POST', '/api/auth/register', {
                data: invalidData
            });

            helper.assertErrorResponse(response, 400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            // Create a test user with known password
            const testUser = await helper.createTestUser({
                email: 'login@test.com'
                // Use default password 'Password123'
            });

            const loginData = {
                email: 'login@test.com',
                password: 'Password123' // Use the default password
            };

            const response = await helper.makeRequest('POST', '/api/auth/login', {
                data: loginData
            });

            helper.assertSuccessResponse(response);
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.accessToken).toBeDefined();
        });

        it('should return 401 for wrong password', async () => {
            await helper.createTestUser({ email: 'wrongpass@test.com' });

            const loginData = {
                email: 'wrongpass@test.com',
                password: 'WrongPassword123'
            };

            const response = await helper.makeRequest('POST', '/api/auth/login', {
                data: loginData
            });

            helper.assertErrorResponse(response, 401);
        });

        it('should return 401 for non-existent user', async () => {
            const loginData = {
                email: 'nonexistent@test.com',
                password: 'password'
            };

            const response = await helper.makeRequest('POST', '/api/auth/login', {
                data: loginData
            });

            helper.assertErrorResponse(response, 401);
        });
    });

    describe('Authentication Middleware', () => {
        it('should allow access with valid token', async () => {
            const token = await helper.loginAsStudent();

            const response = await helper.makeRequest('GET', '/api/student/profile', {
                token: token
            });

            // Should not return 401/403 (actual response depends on route implementation)
            expect([200, 404]).toContain(response.status);
        });

        it('should deny access without token', async () => {
            const response = await helper.makeRequest('GET', '/api/student/profile');

            helper.assertUnauthorizedResponse(response);
        });

        it('should deny access with invalid token', async () => {
            const response = await helper.makeRequest('GET', '/api/student/profile', {
                token: 'invalid.jwt.token'
            });

            helper.assertUnauthorizedResponse(response);
        });
    });

    describe('Role-based Access Control', () => {
        it('should allow admin to access admin routes', async () => {
            const token = await helper.loginAsAdmin();

            const response = await helper.makeRequest('GET', '/api/admin/users', {
                token: token
            });

            // Should not return 403 (actual response depends on route implementation)
            expect(response.status).not.toBe(403);
        });

        it('should deny student access to admin routes', async () => {
            const token = await helper.loginAsStudent();

            const response = await helper.makeRequest('GET', '/api/admin/users', {
                token: token
            });

            helper.assertForbiddenResponse(response);
        });

        it('should allow teacher to access teacher routes', async () => {
            const token = await helper.loginAsTeacher();

            const response = await helper.makeRequest('GET', '/api/teacher/dashboard', {
                token: token
            });

            // Should not return 403 (actual response depends on route implementation)
            expect(response.status).not.toBe(403);
        });

        it('should deny student access to teacher routes', async () => {
            const token = await helper.loginAsStudent();

            const response = await helper.makeRequest('GET', '/api/teacher/dashboard', {
                token: token
            });

            helper.assertForbiddenResponse(response);
        });
    });
});