/**
 * Google OAuth Service
 * Handles Google OAuth authentication and user management
 */

import config from '../config/env.js';
import * as userModel from '../models/users.model.js';

/**
 * Initialize Google OAuth (requires passport-google-oauth20)
 * This should be called during app initialization
 */
export function initializeGoogleOAuth(passport) {
    try {
        const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

        passport.use(new GoogleStrategy({
            clientID: config.GOOGLE_CLIENT_ID,
            clientSecret: config.GOOGLE_CLIENT_SECRET,
            callbackURL: config.GOOGLE_CALLBACK_URL,
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                // Find or create user
                let user = await userModel.findUserByEmail(profile.emails[0].value);

                if (!user) {
                    // Create new user from Google profile
                    user = await userModel.createUser({
                        email: profile.emails[0].value,
                        first_name: profile.name.givenName || '',
                        last_name: profile.name.familyName || '',
                        password: null, // OAuth users don't have passwords
                        role: 'student',
                        is_active: true,
                        google_id: profile.id,
                    });
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }));

        passport.serializeUser((user, done) => {
            done(null, user.user_id);
        });

        passport.deserializeUser(async (id, done) => {
            try {
                const user = await userModel.findUserById(id);
                done(null, user);
            } catch (error) {
                done(error);
            }
        });
    } catch (error) {
        console.warn('Google OAuth initialization skipped - passport-google-oauth20 not installed');
        console.warn('Install with: npm install passport-google-oauth20');
    }
}

/**
 * Verify and decode Google ID Token
 */
export async function verifyGoogleIdToken(idToken) {
    try {
        const { OAuth2Client } = await import('google-auth-library');

        const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config.GOOGLE_CLIENT_ID,
        });

        return ticket.getPayload();
    } catch (error) {
        console.error('Google token verification error:', error);
        throw new Error('Invalid Google token');
    }
}

/**
 * Find or create user from Google profile
 */
export async function findOrCreateGoogleUser(googleProfile) {
    try {
        // Find existing user
        let user = await userModel.findUserByEmail(googleProfile.email);

        if (!user) {
            // Create new user
            user = await userModel.createUser({
                email: googleProfile.email,
                first_name: googleProfile.given_name || '',
                last_name: googleProfile.family_name || '',
                password: null,
                role: 'student',
                is_active: true,
                google_id: googleProfile.sub,
            });
        }

        return user;
    } catch (error) {
        console.error('Find or create Google user error:', error);
        throw error;
    }
}
