// Test environment setup file - runs before all tests
// Set test environment variables before any modules load
console.log('GLOBAL SETUP: Setting test environment variables...');
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5433';
process.env.DB_NAME = 'cognilytics_mis_test';

console.log('GLOBAL SETUP: Environment variables set:', {
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME
});