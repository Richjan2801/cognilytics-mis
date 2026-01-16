// Main server file - CogniLytics MIS Backend
import express from 'express';
import cors from 'cors';
import config from './config/env.js';
import db, { testConnection } from './config/db.js';

console.log('Server starting with USE_MOCK_DATA:', config.USE_MOCK_DATA);

// Import routes
import authRoutes from './routes/auth.routes.js';
import measurementsRoutes from './routes/measurements.routes.js';
import sessionRoutes from './routes/session.routes.js';
import topicRoutes from './routes/topic.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import adminRoutes from './routes/admin.routes.js';
import reportRoutes from './routes/report.routes.js';
import facialExpressionRoutes from './routes/facial-expression.routes.js';

// Create Express app
const app = express();

// Middleware
app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: config.CORS_CREDENTIALS,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development)
if (config.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'CogniLytics MIS API is running',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/measurements', measurementsRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/facial-expression', facialExpressionRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path,
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);

    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(config.NODE_ENV === 'development' && { stack: error.stack }),
    });
});

// Start server
async function startServer() {
    try {
        console.log('Starting CogniLytics MIS Backend...\n');

        // Test database connection
        console.log('Testing database connection...');
        await testConnection();
        console.log('✓ Database connected successfully\n');

        // Start listening
        const PORT = config.PORT;
        const HOST = config.HOST;

        app.listen(PORT, HOST, () => {
            console.log('='.repeat(50));
            console.log('✓ Server running successfully!');
            console.log('='.repeat(50));
            console.log(`URL:         http://${HOST}:${PORT}`);
            console.log(`Environment: ${config.NODE_ENV}`);
            console.log(`Health:      http://${HOST}:${PORT}/health`);
            console.log('='.repeat(50));
            console.log('\nPress Ctrl+C to stop the server\n');
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        console.error('\nPossible issues:');
        console.error('1. Database is not running (docker-compose up database -d)');
        console.error('2. Database credentials are incorrect (.env file)');
        console.error('3. Port 3000 is already in use\n');
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\nShutting down gracefully...');
    try {
        await db.$pool.end();
        console.log('✓ Database connections closed');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n\nShutting down gracefully...');
    try {
        await db.$pool.end();
        console.log('✓ Database connections closed');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Start the server
startServer();

export default app;
