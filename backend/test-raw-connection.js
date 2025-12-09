// Test raw PostgreSQL connection
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'cognilytics_mis',
    user: 'postgres',
    password: 'postgres',
});

console.log('Testing raw PostgreSQL connection...');
console.log('Config:', {
    host: 'localhost',
    port: 5433,
    database: 'cognilytics_mis',
    user: 'postgres',
    password: 'postgres',
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('\n❌ Connection failed:');
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        console.error('\nTroubleshooting:');
        console.error('1. Is database running? docker-compose ps');
        console.error('2. Check logs: docker-compose logs database');
        console.error('3. Try: docker-compose down -v && docker-compose up database -d');
    } else {
        console.log('\n✅ Connection successful!');
        console.log('Server time:', res.rows[0].now);
    }
    pool.end();
});
