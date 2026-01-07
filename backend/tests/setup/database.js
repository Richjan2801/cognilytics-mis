// Integration test database setup
import pgPromise from 'pg-promise';
import config from '../../src/config/env.js';

// Test database configuration
const getTestConfig = (dbName = 'cognilytics_mis_test') => ({
    ...config,
    DB_NAME: dbName,
    DB_HOST: 'localhost', // Force localhost for tests (not 'postgres' from Docker .env)
    DB_PORT: 5433, // Use external port for tests
});

// Initialize pg-promise for tests
const pgp = pgPromise({
    capSQL: true,
    error(error, e) {
        console.error('Test Database Error:', error.message || error);
    },
});

// Create test database connection
export const testDb = pgp({
    host: getTestConfig().DB_HOST,
    port: getTestConfig().DB_PORT,
    database: getTestConfig().DB_NAME,
    user: getTestConfig().DB_USER,
    password: getTestConfig().DB_PASSWORD,
});

// Admin connection for database management
export const adminDb = pgp({
    host: getTestConfig().DB_HOST,
    port: getTestConfig().DB_PORT,
    database: 'postgres', // Connect to default postgres database
    user: getTestConfig().DB_USER,
    password: getTestConfig().DB_PASSWORD,
});

// Database setup utilities
export class DatabaseHelper {
    static async createTestDatabase(dbName = 'cognilytics_mis_test') {
        const testConfig = getTestConfig(dbName);
        try {
            // First, try to drop the database if it exists - be more aggressive
            try {
                // Terminate all connections to the database
                await adminDb.none(`
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = $1 AND pid <> pg_backend_pid()
                `, [testConfig.DB_NAME]);

                // Wait a moment for connections to terminate
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Try to drop the database
                await adminDb.none(`DROP DATABASE IF EXISTS "${testConfig.DB_NAME}"`);
                console.log(`✅ Dropped existing test database '${testConfig.DB_NAME}'`);
            } catch (dropError) {
                console.log(`ℹ️ Test database '${testConfig.DB_NAME}' did not exist or could not be dropped: ${dropError.message}`);
            }

            // Create fresh test database
            try {
                await adminDb.none(`CREATE DATABASE "${testConfig.DB_NAME}"`);
                console.log(`✅ Test database '${testConfig.DB_NAME}' created`);
            } catch (createError) {
                if (createError.message.includes('already exists')) {
                    console.log(`ℹ️ Test database '${testConfig.DB_NAME}' already exists, using existing database`);
                } else {
                    throw createError;
                }
            }
        } catch (error) {
            console.error('❌ Failed to create test database:', error.message);
            throw error;
        }
    }

    static async initializeSchema(dbName = 'cognilytics_mis_test') {
        const testConfig = getTestConfig(dbName);
        try {
            // Read and execute schema.sql as a single query
            const fs = await import('fs');
            const path = await import('path');
            const { fileURLToPath } = await import('url');

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            // Go up to project root, then to database folder
            const projectRoot = path.resolve(__dirname, '../../..');
            const schemaPath = path.join(projectRoot, 'database/schema.sql');

            console.log('Schema path:', schemaPath);

            const schema = fs.readFileSync(schemaPath, 'utf8');

            console.log('Executing schema as single query...');

            // Create a temporary connection to the specific test database
            const tempDb = pgp({
                host: testConfig.DB_HOST,
                port: testConfig.DB_PORT,
                database: testConfig.DB_NAME,
                user: testConfig.DB_USER,
                password: testConfig.DB_PASSWORD,
            });

            // Drop all existing tables to ensure clean state
            try {
                await tempDb.none(`
                    DO $$ DECLARE
                        r RECORD;
                    BEGIN
                        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                        END LOOP;
                    END $$;
                `);
                console.log('✅ Dropped existing tables');
            } catch (dropError) {
                console.log('ℹ️ Could not drop existing tables:', dropError.message);
            }

            // Execute the entire schema as one query
            await tempDb.none(schema);

            await tempDb.$pool.end();

            console.log('✅ Database schema initialized');
        } catch (error) {
            console.error('❌ Failed to initialize schema:', error.message);
            throw error;
        }
    }

    static async seedTestData(dbName = 'cognilytics_mis_test') {
        const testConfig = getTestConfig(dbName);
        try {
            // Create a temporary connection to the specific test database
            const tempDb = pgp({
                host: testConfig.DB_HOST,
                port: testConfig.DB_PORT,
                database: testConfig.DB_NAME,
                user: testConfig.DB_USER,
                password: testConfig.DB_PASSWORD,
            });

            // Insert test institutions
            await tempDb.none(`
                INSERT INTO institutions (name, type) VALUES
                ('Test University', 'university'),
                ('Test School', 'school')
            `);

            // Insert test users
            await tempDb.none(`
                INSERT INTO users (email, password_hash, role, first_name, last_name, institution_id, is_active) VALUES
                ('admin@test.com', '$2b$10$8K3VzJcXcQzKjJcXcQzKjJcXcQzKjJcXcQzKjJcXcQzKjJcXcQzKj', 'admin', 'Admin', 'User', (SELECT institution_id FROM institutions WHERE name = 'Test University'), true),
                ('teacher@test.com', '$2b$10$8K3VzJcXcQzKjJcXcQzKjJcXcQzKjJcXcQzKjJcXcQzKjJcXcQzKj', 'teacher', 'Teacher', 'User', (SELECT institution_id FROM institutions WHERE name = 'Test School'), true),
                ('student@test.com', '$2b$10$8K3VzJcXcQzKjJcXcQzKjJcXcQzKjJcXcQzKjJcXcQzKjJcXcQzKj', 'student', 'Student', 'User', (SELECT institution_id FROM institutions WHERE name = 'Test School'), true)
            `);

            await tempDb.$pool.end();

            console.log('✅ Test data seeded');
        } catch (error) {
            console.error('❌ Failed to seed test data:', error.message);
            throw error;
        }
    }

    static async closeConnections(dbName = 'cognilytics_mis_test') {
        const testConfig = getTestConfig(dbName);
        try {
            // Clean up test data - with error handling for missing tables
            const tempDb = pgp({
                host: testConfig.DB_HOST,
                port: testConfig.DB_PORT,
                database: testConfig.DB_NAME,
                user: testConfig.DB_USER,
                password: testConfig.DB_PASSWORD,
            });

            // Try to clean up tables, but don't fail if they don't exist
            const cleanupQueries = [
                'DELETE FROM quiz_attempts',
                'DELETE FROM quizzes',
                'DELETE FROM cl_measurements',
                'DELETE FROM learning_sessions',
                'DELETE FROM topics',
                'DELETE FROM users',
                'DELETE FROM institutions'
            ];

            for (const query of cleanupQueries) {
                try {
                    await tempDb.none(query);
                } catch (tableError) {
                    // Ignore errors if table doesn't exist
                    console.log(`ℹ️ Could not clean up table for query "${query}": ${tableError.message}`);
                }
            }

            await tempDb.$pool.end();

            console.log('✅ Test data cleaned up');

            // Drop the test database - be more aggressive
            try {
                const tempAdminDb = pgp({
                    host: testConfig.DB_HOST,
                    port: testConfig.DB_PORT,
                    database: 'postgres',
                    user: testConfig.DB_USER,
                    password: testConfig.DB_PASSWORD,
                });

                // Terminate all connections to the database
                await tempAdminDb.none(`
                    SELECT pg_terminate_backend(pid)
                    FROM pg_stat_activity
                    WHERE datname = $1 AND pid <> pg_backend_pid()
                `, [testConfig.DB_NAME]);

                // Wait a moment for connections to terminate
                await new Promise(resolve => setTimeout(resolve, 1000));

                await tempAdminDb.none(`DROP DATABASE IF EXISTS "${testConfig.DB_NAME}"`);
                await tempAdminDb.$pool.end();

                console.log(`✅ Test database '${testConfig.DB_NAME}' dropped`);
            } catch (dropError) {
                console.error('❌ Failed to drop test database:', dropError.message);
            }

            console.log('✅ Database connections closed');
        } catch (error) {
            console.error('❌ Failed to close connections:', error.message);
        }
    }
}

export default testDb;