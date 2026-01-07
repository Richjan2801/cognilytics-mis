// Session-Topic Integration Tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import IntegrationTestHelper from './helper.js';

const helper = new IntegrationTestHelper('_session_topic');

describe('Session-Topic Integration', () => {
    beforeAll(async () => {
        // Set test-specific database name for this test file
        process.env.TEST_DB_NAME = 'cognilytics_mis_test_session_topic';
        helper.testDbName = 'cognilytics_mis_test_session_topic';
        await helper.setupDatabase();
    }, 60000);

    afterAll(async () => {
        await helper.cleanupDatabase();
    }, 60000);

    describe('Complete Session Workflow', () => {
        it('should create topic, start session, add measurements, and end session', async () => {
            // Step 1: Create a topic (as teacher)
            const teacherToken = await helper.loginAsTeacher();
            const topicData = {
                name: 'Integration Test Topic',
                description: 'Testing complete workflow',
                subject: 'Integration Testing',
                grade_level: 'Grade 12'
            };

            const topicResponse = await helper.makeRequest('POST', '/api/topics', {
                token: teacherToken,
                data: topicData
            });

            helper.assertSuccessResponse(topicResponse, null, 201);
            const topicId = topicResponse.body.data.topic.topic_id;

            // Step 2: Start a session (as student)
            const studentToken = await helper.loginAsStudent();
            const sessionData = {
                topic_id: topicId,
                session_type: 'practice'
            };

            const sessionStartResponse = await helper.makeRequest('POST', '/api/sessions', {
                token: studentToken,
                data: sessionData
            });

            helper.assertSuccessResponse(sessionStartResponse, null, 201);
            const sessionId = sessionStartResponse.body.data.session.session_id;

            // Step 3: Add measurements to the session
            const measurements = [
                {
                    session_id: sessionId,
                    sr_paas_score: 7,
                    pf_accuracy: 0.85,
                    pf_response_time_ms: 1200,
                    bh_hint_requests: 1,
                    bh_page_revisits: 0,
                    bh_pause_duration_ms: 500
                },
                {
                    session_id: sessionId,
                    sr_paas_score: 8,
                    pf_accuracy: 0.92,
                    pf_response_time_ms: 980,
                    bh_hint_requests: 0,
                    bh_page_revisits: 1,
                    bh_pause_duration_ms: 200
                }
            ];

            for (const measurement of measurements) {
                const measurementResponse = await helper.makeRequest('POST', '/api/measurements', {
                    token: studentToken,
                    data: measurement
                });
                helper.assertSuccessResponse(measurementResponse, null, 201);
            }

            // Step 4: End the session
            const sessionEndResponse = await helper.makeRequest('PUT', `/api/sessions/${sessionId}/end`, {
                token: studentToken
            });

            helper.assertSuccessResponse(sessionEndResponse);

            // Step 5: Verify session data
            const sessionDetailsResponse = await helper.makeRequest('GET', `/api/sessions/${sessionId}`, {
                token: studentToken
            });

            helper.assertSuccessResponse(sessionDetailsResponse);
            const session = sessionDetailsResponse.body.data.session;
            expect(session.session_id).toBe(sessionId);
            expect(session.status).toBe('completed');
            expect(session.ended_at).toBeDefined();

            // Step 6: Verify measurements were recorded
            const measurementsResponse = await helper.makeRequest('GET', `/api/measurements/session/${sessionId}`, {
                token: studentToken
            });

            helper.assertSuccessResponse(measurementsResponse);
            expect(measurementsResponse.body.data.measurements).toHaveLength(2);

            // Step 7: Verify topic statistics (as teacher)
            const topicStatsResponse = await helper.makeRequest('GET', `/api/topics/${topicId}/statistics`, {
                token: teacherToken
            });

            helper.assertSuccessResponse(topicStatsResponse);
            expect(topicStatsResponse.body.data.statistics).toBeDefined();
        });

        it('should handle concurrent sessions for different students', async () => {
            // Create additional test student
            const student2 = await helper.createTestUser({
                email: 'student2@test.com',
                role: 'student'
            });

            const teacherToken = await helper.loginAsTeacher();
            const student1Token = await helper.loginAsStudent();
            const student2Token = helper.generateToken(student2);

            // Create topic
            const topicData = {
                name: 'Concurrent Sessions Topic',
                description: 'Testing concurrent access',
                subject: 'Concurrency',
                grade_level: 'Grade 11'
            };

            const topicResponse = await helper.makeRequest('POST', '/api/topics', {
                token: teacherToken,
                data: topicData
            });

            helper.assertSuccessResponse(topicResponse, null, 201);
            const topicId = topicResponse.body.data.topic.topic_id;

            // Start sessions for both students
            const sessionData1 = { topic_id: topicId, session_type: 'practice' };
            const sessionData2 = { topic_id: topicId, session_type: 'practice' };

            const [session1Response, session2Response] = await Promise.all([
                helper.makeRequest('POST', '/api/sessions', {
                    token: student1Token,
                    data: sessionData1
                }),
                helper.makeRequest('POST', '/api/sessions', {
                    token: student2Token,
                    data: sessionData2
                })
            ]);

            helper.assertSuccessResponse(session1Response, null, 201);
            helper.assertSuccessResponse(session2Response, null, 201);

            const session1Id = session1Response.body.data.session.session_id;
            const session2Id = session2Response.body.data.session.session_id;

            expect(session1Id).not.toBe(session2Id);

            // Add measurements to both sessions
            const measurement1 = {
                session_id: session1Id,
                sr_paas_score: 7,
                pf_accuracy: 0.78,
                pf_response_time_ms: 1500,
                bh_hint_requests: 2,
                bh_page_revisits: 0,
                bh_pause_duration_ms: 300
            };

            const measurement2 = {
                session_id: session2Id,
                sr_paas_score: 8,
                pf_accuracy: 0.95,
                pf_response_time_ms: 800,
                bh_hint_requests: 1,
                bh_page_revisits: 0,
                bh_pause_duration_ms: 100
            };

            const [measurement1Response, measurement2Response] = await Promise.all([
                helper.makeRequest('POST', '/api/measurements', {
                    token: student1Token,
                    data: measurement1
                }),
                helper.makeRequest('POST', '/api/measurements', {
                    token: student2Token,
                    data: measurement2
                })
            ]);

            helper.assertSuccessResponse(measurement1Response, null, 201);
            helper.assertSuccessResponse(measurement2Response, null, 201);

            // End both sessions
            const [end1Response, end2Response] = await Promise.all([
                helper.makeRequest('PUT', `/api/sessions/${session1Id}/end`, {
                    token: student1Token
                }),
                helper.makeRequest('PUT', `/api/sessions/${session2Id}/end`, {
                    token: student2Token
                })
            ]);

            helper.assertSuccessResponse(end1Response);
            helper.assertSuccessResponse(end2Response);

            // Verify both sessions are completed and isolated
            const [session1Check, session2Check] = await Promise.all([
                helper.makeRequest('GET', `/api/sessions/${session1Id}`, {
                    token: student1Token
                }),
                helper.makeRequest('GET', `/api/sessions/${session2Id}`, {
                    token: student2Token
                })
            ]);

            helper.assertSuccessResponse(session1Check);
            helper.assertSuccessResponse(session2Check);

            expect(session1Check.body.data.session.status).toBe('completed');
            expect(session2Check.body.data.session.status).toBe('completed');
        });
    });

    describe('Data Consistency', () => {
        it('should maintain referential integrity', async () => {
            const teacherToken = await helper.loginAsTeacher();
            const studentToken = await helper.loginAsStudent();

            // Create topic
            const topicResponse = await helper.makeRequest('POST', '/api/topics', {
                token: teacherToken,
                data: {
                    name: 'Integrity Test Topic',
                    description: 'Testing data integrity',
                    subject: 'Database',
                    grade_level: 'Grade 10'
                }
            });

            helper.assertSuccessResponse(topicResponse, null, 201);
            const topicId = topicResponse.body.data.topic.topic_id;

            // Start session
            const sessionResponse = await helper.makeRequest('POST', '/api/sessions', {
                token: studentToken,
                data: { topic_id: topicId, session_type: 'practice' }
            });

            helper.assertSuccessResponse(sessionResponse, null, 201);
            const sessionId = sessionResponse.body.data.session.session_id;

            // Add measurement
            const measurementResponse = await helper.makeRequest('POST', '/api/measurements', {
                token: studentToken,
                data: {
                    session_id: sessionId,
                    sr_paas_score: 7,
                    pf_accuracy: 0.88,
                    pf_response_time_ms: 1100,
                    bh_hint_requests: 1,
                    bh_page_revisits: 0,
                    bh_pause_duration_ms: 300
                }
            });

            helper.assertSuccessResponse(measurementResponse, null, 201);

            // Verify data relationships in database
            const sessionData = await helper.db.one(`
                SELECT s.*, t.name as topic_name, u.first_name, u.last_name
                FROM learning_sessions s
                JOIN topics t ON s.topic_id = t.topic_id
                JOIN users u ON s.user_id = u.user_id
                WHERE s.session_id = $1
            `, [sessionId]);

            expect(sessionData.topic_name).toBe('Integrity Test Topic');
            expect(sessionData.first_name).toBe('Student');
            expect(sessionData.last_name).toBe('User');

            const measurementCount = await helper.db.one(`
                SELECT COUNT(*) as count FROM cl_measurements WHERE session_id = $1
            `, [sessionId]);

            expect(parseInt(measurementCount.count)).toBe(1);
        });

        it('should handle transaction rollbacks on errors', async () => {
            const studentToken = await helper.loginAsStudent();

            // Try to create measurement with invalid session ID
            const invalidMeasurement = {
                session_id: '12345678-1234-1234-1234-123456789abc', // Valid UUID format but doesn't exist
                sr_paas_score: 7,
                pf_accuracy: 0.88,
                pf_response_time_ms: 1100,
                bh_hint_requests: 1,
                bh_page_revisits: 0,
                bh_pause_duration_ms: 300
            };

            const response = await helper.makeRequest('POST', '/api/measurements', {
                token: studentToken,
                data: invalidMeasurement
            });

            helper.assertErrorResponse(response, 400);

            // Verify no partial data was inserted
            const measurementCount = await helper.db.one(`
                SELECT COUNT(*) as count FROM cl_measurements
                WHERE session_id = $1
            `, ['12345678-1234-1234-1234-123456789abc']);

            expect(parseInt(measurementCount.count)).toBe(0);
        });
    });
});