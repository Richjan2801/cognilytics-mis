import pgPromise from 'pg-promise';

const config = {
  host: 'localhost',
  port: 5433,
  database: 'cognilytics_mis',
  user: 'postgres',
  password: 'postgres'
};

const pgp = pgPromise();
const db = pgp(config);

async function setupAdminUser() {
  try {
    // Check if admin user exists
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE email = $1', ['admin@test.com']);

    if (existingUser) {
      console.log('Admin user already exists:', existingUser);
      return;
    }

    // Create admin user with hashed password for 'Password123'
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.default.hash('Password123', 10);

    const newUser = await db.one(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, ['admin@test.com', hashedPassword, 'Admin', 'User', 'admin', true]);

    console.log('Admin user created:', newUser);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pgp.end();
  }
}

setupAdminUser();