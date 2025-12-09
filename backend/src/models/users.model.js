// User model - handles user-related database operations
import bcrypt from 'bcrypt';
import db from '../config/db.js';
import config from '../config/env.js';

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user object
 */
export async function createUser(userData) {
    const {
        email,
        password,
        first_name,
        last_name,
        role = 'student',
        institution_id = null,
    } = userData;

    // Hash password
    const password_hash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    const user = await db.one(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, institution_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING user_id, email, first_name, last_name, role, institution_id, is_active, created_at`,
        [email, password_hash, first_name, last_name, role, institution_id]
    );

    return user;
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
export async function findUserByEmail(email) {
    return await db.oneOrNone(
        `SELECT user_id, email, password_hash, first_name, last_name, role,
                institution_id, is_active, created_at, last_login
         FROM users
         WHERE email = $1`,
        [email]
    );
}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
export async function findUserById(userId) {
    return await db.oneOrNone(
        `SELECT user_id, email, first_name, last_name, role,
                institution_id, is_active, created_at, last_login
         FROM users
         WHERE user_id = $1`,
        [userId]
    );
}

/**
 * Find users by role
 * @param {string} role - User role (student, teacher, admin)
 * @param {string} institutionId - Optional institution filter
 * @returns {Promise<Array>} Array of user objects
 */
export async function findUsersByRole(role, institutionId = null) {
    if (institutionId) {
        return await db.any(
            `SELECT user_id, email, first_name, last_name, role,
                    institution_id, is_active, created_at, last_login
             FROM users
             WHERE role = $1 AND institution_id = $2 AND is_active = true
             ORDER BY last_name, first_name`,
            [role, institutionId]
        );
    }

    return await db.any(
        `SELECT user_id, email, first_name, last_name, role,
                institution_id, is_active, created_at, last_login
         FROM users
         WHERE role = $1 AND is_active = true
         ORDER BY last_name, first_name`,
        [role]
    );
}

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user object
 */
export async function updateUser(userId, updateData) {
    const allowedFields = ['first_name', 'last_name', 'email', 'institution_id'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
            updates.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
    }

    if (updates.length === 0) {
        throw new Error('No valid fields to update');
    }

    values.push(userId);

    const user = await db.one(
        `UPDATE users
         SET ${updates.join(', ')}
         WHERE user_id = $${paramIndex}
         RETURNING user_id, email, first_name, last_name, role,
                   institution_id, is_active, created_at, last_login`,
        values
    );

    return user;
}

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} newPassword - New password (plain text)
 * @returns {Promise<boolean>} Success status
 */
export async function updatePassword(userId, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

    await db.none(
        `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
        [password_hash, userId]
    );

    return true;
}

/**
 * Verify user password
 * @param {string} email - User email
 * @param {string} password - Password to verify
 * @returns {Promise<Object|null>} User object if password matches, null otherwise
 */
export async function verifyUserPassword(email, password) {
    const user = await findUserByEmail(email);

    if (!user) {
        return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
        return null;
    }

    // Remove password_hash from returned object
    delete user.password_hash;

    return user;
}

/**
 * Deactivate user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function deactivateUser(userId) {
    await db.none(
        `UPDATE users SET is_active = false WHERE user_id = $1`,
        [userId]
    );

    return true;
}

/**
 * Activate user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function activateUser(userId) {
    await db.none(
        `UPDATE users SET is_active = true WHERE user_id = $1`,
        [userId]
    );

    return true;
}

/**
 * Delete user permanently
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteUser(userId) {
    await db.none(
        `DELETE FROM users WHERE user_id = $1`,
        [userId]
    );

    return true;
}

/**
 * Get all students in an institution
 * @param {string} institutionId - Institution ID
 * @returns {Promise<Array>} Array of student objects
 */
export async function getStudentsByInstitution(institutionId) {
    return await findUsersByRole('student', institutionId);
}

/**
 * Get all teachers in an institution
 * @param {string} institutionId - Institution ID
 * @returns {Promise<Array>} Array of teacher objects
 */
export async function getTeachersByInstitution(institutionId) {
    return await findUsersByRole('teacher', institutionId);
}

/**
 * Count users by role
 * @param {string} role - User role
 * @param {string} institutionId - Optional institution filter
 * @returns {Promise<number>} Count of users
 */
export async function countUsersByRole(role, institutionId = null) {
    if (institutionId) {
        const result = await db.one(
            `SELECT COUNT(*) as count FROM users
             WHERE role = $1 AND institution_id = $2 AND is_active = true`,
            [role, institutionId]
        );
        return parseInt(result.count);
    }

    const result = await db.one(
        `SELECT COUNT(*) as count FROM users
         WHERE role = $1 AND is_active = true`,
        [role]
    );
    return parseInt(result.count);
}

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email exists
 */
export async function emailExists(email) {
    const result = await db.oneOrNone(
        `SELECT user_id FROM users WHERE email = $1`,
        [email]
    );
    return result !== null;
}
