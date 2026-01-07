// Base integration test helper
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import config from '../../src/config/env.js';
import { DatabaseHelper } from '../setup/database.js';
import { testDb } from '../setup/database.js';

// Debug logging after import
console.log('Config loaded:', {
    DB_HOST: config.DB_HOST,
    DB_PORT: config.DB_PORT,
    DB_NAME: config.DB_NAME
});

// Import routes and middleware
import authRoutes from '../../src/routes/auth.routes.js';
import sessionRoutes from '../../src/routes/session.routes.js';
import measureRoutes from '../../src/routes/measurements.routes.js';
import topicRoutes from '../../src/routes/topic.routes.js';
import quizRoutes from '../../src/routes/quiz.routes.js';
import adminRoutes from '../../src/routes/admin.routes.js';
import teacherRoutes from '../../src/routes/teacher.routes.js';
import studentRoutes from '../../src/routes/student.routes.js';
import reportRoutes from '../../src/routes/report.routes.js';

// Import middleware
import { authenticateToken } from '../../src/auth/jwt.js';
import { requireRole } from '../../src/auth/roleGuard.js';

// Create Express app for testing
const createTestApp = () => {
    const app = express();

    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Mock CORS for testing
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        next();
    });

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/sessions', sessionRoutes);
    app.use('/api/measurements', measureRoutes);
    app.use('/api/topics', topicRoutes);
    app.use('/api/quizzes', quizRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/teacher', teacherRoutes);
    app.use('/api/student', studentRoutes);
    app.use('/api/reports', reportRoutes);

    // Error handling middleware
    app.use((error, req, res, next) => {
        console.error('Test App Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: config.NODE_ENV === 'development' ? error.message : undefined
        });
    });

    return app;
};

export class IntegrationTestHelper {
    constructor(dbSuffix = '') {
        this.dbSuffix = dbSuffix;
        this.app = createTestApp();
        this.request = request(this.app);
        this.db = null;
        this.testDbName = `cognilytics_mis_test${dbSuffix}`;
    }

    // Authentication helpers
    async loginAsAdmin() {
        const adminUser = await this.db.one('SELECT * FROM users WHERE email = $1', ['admin@test.com']);
        return this.generateToken(adminUser);
    }

    async loginAsTeacher() {
        const teacherUser = await this.db.one('SELECT * FROM users WHERE email = $1', ['teacher@test.com']);
        return this.generateToken(teacherUser);
    }

    async loginAsStudent() {
        const studentUser = await this.db.one('SELECT * FROM users WHERE email = $1', ['student@test.com']);
        return this.generateToken(studentUser);
    }

    generateToken(user) {
        return jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
                institution_id: user.institution_id
            },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN }
        );
    }

    // Database setup/cleanup for individual tests
    async setupDatabase() {
        console.log(`🚀 Setting up test database ${this.testDbName}...`);
        await DatabaseHelper.createTestDatabase(this.testDbName);
        await DatabaseHelper.initializeSchema(this.testDbName);
        await DatabaseHelper.seedTestData(this.testDbName);
        
        // Create a database connection for this test instance
        const testConfig = {
            ...config,
            DB_NAME: this.testDbName,
            DB_HOST: 'localhost',
            DB_PORT: 5433,
        };
        
        const pgp = (await import('pg-promise')).default();
        this.db = pgp({
            host: testConfig.DB_HOST,
            port: testConfig.DB_PORT,
            database: testConfig.DB_NAME,
            user: testConfig.DB_USER,
            password: testConfig.DB_PASSWORD,
        });
        
        console.log(`✅ Test database ${this.testDbName} ready`);
    }

    async cleanupDatabase() {
        console.log(`🧹 Cleaning up test database ${this.testDbName}...`);
        if (this.db) {
            await this.db.$pool.end();
        }
        await DatabaseHelper.closeConnections(this.testDbName);
        console.log(`✅ Test database ${this.testDbName} cleaned up`);
    }

    // Database helpers
    async createTestUser(overrides = {}) {
        const defaultUser = {
            email: `test${Date.now()}@example.com`,
            password: 'Password123',
            first_name: 'Test',
            last_name: 'User',
            role: 'student',
            // institutionId is optional, so don't include it by default
            ...overrides
        };

        const requestData = {
            email: defaultUser.email,
            password: defaultUser.password,
            first_name: defaultUser.first_name,
            last_name: defaultUser.last_name,
            role: defaultUser.role,
        };

        // Only include institutionId if it's provided
        if (defaultUser.institutionId) {
            requestData.institutionId = defaultUser.institutionId;
        }

        const response = await this.makeRequest('POST', '/api/auth/register', {
            data: requestData
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create test user: ${response.body.message}`);
        }

        return response.body.data.user;
    }

    async createTestTopic(overrides = {}) {
        const defaultTopic = {
            title: 'Test Topic',
            description: 'Test description',
            subject: 'Test Subject',
            grade_level: 'Grade 10',
            created_by: 2, // teacher user ID
            ...overrides
        };

        const topic = await this.db.one(`
            INSERT INTO topics (title, description, subject, grade_level, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            defaultTopic.title,
            defaultTopic.description,
            defaultTopic.subject,
            defaultTopic.grade_level,
            defaultTopic.created_by
        ]);

        return topic;
    }

    async createTestSession(overrides = {}) {
        const defaultSession = {
            user_id: 3, // student user ID
            topic_id: 1,
            session_type: 'practice',
            start_time: new Date(),
            ...overrides
        };

        const session = await this.db.one(`
            INSERT INTO sessions (user_id, topic_id, session_type, start_time)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [
            defaultSession.user_id,
            defaultSession.topic_id,
            defaultSession.session_type,
            defaultSession.start_time
        ]);

        return session;
    }

    // HTTP request helpers
    async makeRequest(method, url, options = {}) {
        const { token, data, query } = options;
        let req = this.request[method.toLowerCase()](url);

        if (token) {
            req = req.set('Authorization', `Bearer ${token}`);
        }

        if (query) {
            req = req.query(query);
        }

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            req = req.send(data);
        }

        return req;
    }

    // Common assertions
    assertSuccessResponse(response, expectedData = null, expectedStatus = 200) {
        expect(response.status).toBe(expectedStatus);
        expect(response.body.success).toBe(true);

        if (expectedData) {
            expect(response.body.data).toEqual(expectedData);
        }
    }

    assertErrorResponse(response, statusCode, message = null) {
        expect(response.status).toBe(statusCode);
        expect(response.body.success).toBe(false);

        if (message) {
            expect(response.body.message).toBe(message);
        }
    }

    assertUnauthorizedResponse(response) {
        this.assertErrorResponse(response, 401);
    }

    assertForbiddenResponse(response) {
        this.assertErrorResponse(response, 403);
    }

    assertNotFoundResponse(response) {
        this.assertErrorResponse(response, 404);
    }
}

export default IntegrationTestHelper;