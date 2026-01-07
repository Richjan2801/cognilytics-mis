// Vitest setup for integration tests
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DatabaseHelper } from '../setup/database.js';

// Global test setup
beforeAll(async () => {
    console.log('🚀 Setting up integration test environment...');

    try {
        // Create and initialize test database
        await DatabaseHelper.createTestDatabase();
        await DatabaseHelper.initializeSchema();
        await DatabaseHelper.seedTestData();

        console.log('✅ Integration test environment ready');
    } catch (error) {
        console.error('❌ Failed to setup test environment:', error);
        throw error;
    }
}, 60000); // 60 second timeout for database setup

afterAll(async () => {
    console.log('🧹 Cleaning up integration test environment...');

    try {
        await DatabaseHelper.closeConnections();
        console.log('✅ Integration test environment cleaned up');
    } catch (error) {
        console.error('❌ Failed to cleanup test environment:', error);
    }
}, 30000);

// Per-test cleanup
beforeEach(async () => {
    await DatabaseHelper.cleanup();
});

afterEach(async () => {
    // Additional cleanup if needed
});