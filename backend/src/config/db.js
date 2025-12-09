// Database configuration - PostgreSQL with pg-promise
import pgPromise from 'pg-promise';
import config from './env.js';

// Initialize pg-promise
const pgp = pgPromise({
    // Initialization options
    capSQL: true, // Capitalize SQL keywords
    error(error, e) {
        // Log database errors (only in development for debugging)
        if (config.NODE_ENV === 'development' && config.LOG_LEVEL === 'debug') {
            if (e.cn) {
                console.error('Database connection error:', error.message || error);
            } else if (e.query) {
                console.error('Query error:', {
                    query: e.query,
                    error: error.message || error
                });
            }
        }
        // In production, errors are handled by try-catch blocks
    },
    receive(data, result, e) {
        // Called when data is received from the database
        if (config.LOG_LEVEL === 'debug') {
            console.log(`Received ${data.length} row(s) from query`);
        }
    },
});

// Database connection configuration
const dbConfig = {
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    max: config.DB_MAX_CONNECTIONS,
    idleTimeoutMillis: config.DB_IDLE_TIMEOUT,
    connectionTimeoutMillis: 5000, // 5 seconds
};

// Add SSL configuration if enabled
if (config.DB_SSL) {
    dbConfig.ssl = {
        rejectUnauthorized: false, // For development; set to true in production with proper certificates
    };
}

// Create database instance
const db = pgp(dbConfig);

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
    try {
        const result = await db.one('SELECT NOW() as current_time, version() as pg_version');
        console.log('✓ Database connected successfully');
        console.log(`  PostgreSQL version: ${result.pg_version.split(',')[0]}`);
        console.log(`  Server time: ${result.current_time}`);

        // Check if TimescaleDB extension is available
        try {
            const tsVersion = await db.oneOrNone(
                "SELECT extversion FROM pg_extension WHERE extname = 'timescaledb'"
            );
            if (tsVersion) {
                console.log(`  TimescaleDB version: ${tsVersion.extversion}`);
            } else {
                console.warn('  Warning: TimescaleDB extension not found');
            }
        } catch (err) {
            console.warn('  Warning: Could not check TimescaleDB version');
        }

        return true;
    } catch (error) {
        console.error('✗ Database connection failed:', error.message);
        return false;
    }
}

/**
 * Initialize database - run migrations and setup
 * @returns {Promise<void>}
 */
export async function initializeDatabase() {
    try {
        console.log('Initializing database...');

        // Check if database is already initialized
        const tableExists = await db.oneOrNone(
            `SELECT to_regclass('public.users') as exists`
        );

        if (tableExists && tableExists.exists) {
            console.log('✓ Database already initialized');
            return;
        }

        console.log('Database not initialized. Please run migrations first.');
        console.log('Run: psql -U postgres -d cognilytics_mis -f database/schema.sql');

    } catch (error) {
        console.error('Error initializing database:', error.message);
        throw error;
    }
}

/**
 * Close database connection
 * @returns {Promise<void>}
 */
export async function closeConnection() {
    try {
        pgp.end(); // Close all connections
        console.log('Database connections closed');
    } catch (error) {
        console.error('Error closing database connections:', error.message);
    }
}

/**
 * Execute a transaction
 * @param {Function} callback - Function to execute within transaction
 * @returns {Promise<any>}
 */
export async function executeTransaction(callback) {
    return db.tx(async (t) => {
        return await callback(t);
    });
}

/**
 * Helper function to handle database errors
 * @param {Error} error - Error object
 * @returns {Object} Formatted error response
 */
export function handleDatabaseError(error) {
    if (error.code === '23505') {
        // Unique violation
        return {
            status: 409,
            message: 'A record with this value already exists',
            detail: error.detail,
        };
    } else if (error.code === '23503') {
        // Foreign key violation
        return {
            status: 400,
            message: 'Referenced record does not exist',
            detail: error.detail,
        };
    } else if (error.code === '23502') {
        // Not null violation
        return {
            status: 400,
            message: 'Required field is missing',
            detail: error.detail,
        };
    } else if (error.code === '22P02') {
        // Invalid text representation
        return {
            status: 400,
            message: 'Invalid data format',
            detail: error.message,
        };
    } else if (error.code === '42P01') {
        // Undefined table
        return {
            status: 500,
            message: 'Database table not found. Database may not be initialized.',
            detail: error.message,
        };
    } else {
        // Generic error
        return {
            status: 500,
            message: 'Database error occurred',
            detail: config.NODE_ENV === 'development' ? error.message : 'Internal server error',
        };
    }
}

// Export database instance and helpers
export { db, pgp };
export default db;
