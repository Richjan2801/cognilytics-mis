// Simple database connection test
import { testConnection } from './src/config/db.js';

console.log('Testing database connection...\n');

testConnection()
    .then(() => {
        console.log('\n✅ Database is ready!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Database connection failed:', error.message);
        console.error('\nMake sure:');
        console.error('1. Docker is running: docker-compose up database -d');
        console.error('2. Database is ready (wait ~10 seconds after starting)');
        console.error('3. Check your .env file settings');
        process.exit(1);
    });
