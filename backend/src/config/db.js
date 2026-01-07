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

// Create database instance function for dynamic configuration
const createDatabaseConnection = () => {
    // Re-evaluate config for current environment (important for tests)
    const currentConfig = {
        NODE_ENV: process.env.NODE_ENV || 'development',
        DB_HOST: process.env.DB_HOST || (process.env.NODE_ENV === 'test' ? 'localhost' : 'postgres'),
        DB_PORT: parseInt(process.env.DB_PORT || (process.env.NODE_ENV === 'test' ? '5433' : '5432'), 10),
        DB_NAME: process.env.DB_NAME || (process.env.NODE_ENV === 'test' ? (process.env.TEST_DB_NAME || 'cognilytics_mis_test') : 'cognilytics_mis'),
        DB_USER: process.env.DB_USER || 'postgres',
        DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
        DB_MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
        DB_IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
        DB_SSL: process.env.DB_SSL === 'true',
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    };

    const dbConfig = {
        host: currentConfig.DB_HOST,
        port: currentConfig.DB_PORT,
        database: currentConfig.DB_NAME,
        user: currentConfig.DB_USER,
        password: currentConfig.DB_PASSWORD,
        max: currentConfig.DB_MAX_CONNECTIONS,
        idleTimeoutMillis: currentConfig.DB_IDLE_TIMEOUT,
        connectionTimeoutMillis: 5000, // 5 seconds
    };

    // Add SSL configuration if enabled
    if (currentConfig.DB_SSL) {
        dbConfig.ssl = {
            rejectUnauthorized: false, // For development; set to true in production with proper certificates
        };
    }

    return pgp(dbConfig);
};

// Create database instance
let db = createDatabaseConnection();
let lastTestDbName = process.env.TEST_DB_NAME;

// Function to get current database connection (recreates if needed for tests)
export function getDatabaseConnection() {
    // Check if TEST_DB_NAME has changed (for testing)
    if (process.env.NODE_ENV === 'test' && process.env.TEST_DB_NAME !== lastTestDbName) {
        console.log(`🔄 Recreating database connection for test database: ${process.env.TEST_DB_NAME}`);
        // Don't close the old connection immediately to avoid destroying pools in use
        // Just create a new one and update the reference
        db = createDatabaseConnection();
        lastTestDbName = process.env.TEST_DB_NAME;
    }
    return db;
}

// For backward compatibility, export default as a getter that returns current connection
export default new Proxy({}, {
    get(target, prop) {
        const currentDb = getDatabaseConnection();
        return currentDb[prop];
    }
});

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
export { pgp };
