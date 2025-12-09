// Environment variables configuration
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
    // Server Configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    HOST: process.env.HOST || 'localhost',

    // Database Configuration
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_NAME: process.env.DB_NAME || 'cognilytics_mis',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
    DB_SSL: process.env.DB_SSL === 'true',
    DB_MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    DB_IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),

    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // Bcrypt Configuration
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),

    // CORS Configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true' || true,

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    // CL Calculation Configuration
    CL_WEIGHTS: {
        SR: parseFloat(process.env.CL_WEIGHT_SR || '0.35'),
        PF: parseFloat(process.env.CL_WEIGHT_PF || '0.30'),
        BH: parseFloat(process.env.CL_WEIGHT_BH || '0.20'),
        PH: parseFloat(process.env.CL_WEIGHT_PH || '0.15'),
    },

    // CL Thresholds
    CL_THRESHOLDS: {
        LOW: parseFloat(process.env.CL_THRESHOLD_LOW || '0.29'),
        OPTIMAL: parseFloat(process.env.CL_THRESHOLD_OPTIMAL || '0.59'),
        HIGH: parseFloat(process.env.CL_THRESHOLD_HIGH || '0.79'),
        OVERLOAD: parseFloat(process.env.CL_THRESHOLD_OVERLOAD || '1.0'),
    },

    // Behavioral Normalization Caps
    BEHAVIORAL_CAPS: {
        MAX_HINTS: parseInt(process.env.MAX_HINTS || '5', 10),
        MAX_REVISITS: parseInt(process.env.MAX_REVISITS || '10', 10),
        MAX_PAUSE_MINS: parseInt(process.env.MAX_PAUSE_MINS || '3', 10),
    },

    // Decision Rules Thresholds
    DECISION_RULES: {
        STUDENT_OVERLOAD_THRESHOLD: parseFloat(process.env.STUDENT_OVERLOAD_THRESHOLD || '0.80'),
        STUDENT_SUPPORT_THRESHOLD: parseFloat(process.env.STUDENT_SUPPORT_THRESHOLD || '0.60'),
        STUDENT_LOW_CHALLENGE_THRESHOLD: parseFloat(process.env.STUDENT_LOW_CHALLENGE_THRESHOLD || '0.30'),
        TEACHER_TOPIC_OVERLOAD: parseFloat(process.env.TEACHER_TOPIC_OVERLOAD || '0.70'),
        TEACHER_OVERLOAD_PERCENTAGE: parseFloat(process.env.TEACHER_OVERLOAD_PERCENTAGE || '0.30'),
        TEACHER_LOW_CHALLENGE_THRESHOLD: parseFloat(process.env.TEACHER_LOW_CHALLENGE_THRESHOLD || '0.30'),
        TEACHER_HIGH_ACCURACY_THRESHOLD: parseFloat(process.env.TEACHER_HIGH_ACCURACY_THRESHOLD || '0.85'),
    },

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: process.env.LOG_FILE || 'logs/app.log',

    // Session Configuration
    SESSION_SECRET: process.env.SESSION_SECRET || 'session-secret-change-in-production',
    SESSION_TIMEOUT_MINS: parseInt(process.env.SESSION_TIMEOUT_MINS || '60', 10),

    // File Upload (for future material upload)
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),

    // Background Jobs
    ENABLE_CRON_JOBS: process.env.ENABLE_CRON_JOBS !== 'false',
    AGGREGATION_CRON: process.env.AGGREGATION_CRON || '0 * * * *', // Every hour
    ALERT_GENERATION_CRON: process.env.ALERT_GENERATION_CRON || '*/15 * * * *', // Every 15 minutes
};

// Validation function
function validateConfig() {
    const requiredVars = [];

    if (config.NODE_ENV === 'production') {
        if (config.JWT_SECRET === 'your-secret-key-change-in-production') {
            requiredVars.push('JWT_SECRET');
        }
        if (config.JWT_REFRESH_SECRET === 'your-refresh-secret-change-in-production') {
            requiredVars.push('JWT_REFRESH_SECRET');
        }
        if (config.SESSION_SECRET === 'session-secret-change-in-production') {
            requiredVars.push('SESSION_SECRET');
        }
    }

    if (requiredVars.length > 0) {
        throw new Error(
            `Missing required environment variables for production: ${requiredVars.join(', ')}`
        );
    }

    // Validate CL weights sum to 1.0
    const weightSum = config.CL_WEIGHTS.SR + config.CL_WEIGHTS.PF +
                      config.CL_WEIGHTS.BH + config.CL_WEIGHTS.PH;
    if (Math.abs(weightSum - 1.0) > 0.01) {
        console.warn(
            `Warning: CL weights sum to ${weightSum.toFixed(2)}, expected 1.0. ` +
            `Weights will be normalized during calculation.`
        );
    }
}

// Run validation
validateConfig();

// Export configuration
export default config;
