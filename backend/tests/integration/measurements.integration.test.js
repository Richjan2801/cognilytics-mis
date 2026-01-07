// Measurements Integration Tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import IntegrationTestHelper from './helper.js';

const helper = new IntegrationTestHelper('_measurements');

describe('Measurements Integration', () => {
    beforeAll(async () => {
        // Set test-specific database name for this test file
        process.env.TEST_DB_NAME = 'cognilytics_mis_test_measurements';
        helper.testDbName = 'cognilytics_mis_test_measurements';
        await helper.setupDatabase();
    }, 60000);

    afterAll(async () => {
        await helper.cleanupDatabase();
    }, 60000);

    describe('Measurement Creation & Retrieval', () => {
        it('should create and retrieve measurements for a session', async () => {
            // Step 1: Create a topic (as teacher)
            const teacherToken = await helper.loginAsTeacher();
            const topicData = {
                name: 'Measurements Test Topic',
                description: 'Testing measurement operations',
                subject: 'Measurement Testing',
                grade_level: 'Grade 11'
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

            // Step 3: Add multiple measurements to the session
            const measurements = [
                {
                    session_id: sessionId,
                    sr_paas_score: 8,
                    pf_accuracy: 0.95,
                    pf_response_time_ms: 850,
                    bh_hint_requests: 0,
                    bh_page_revisits: 0,
                    bh_pause_duration_ms: 150
                },
                {
                    session_id: sessionId,
                    sr_paas_score: 7,
                    pf_accuracy: 0.88,
                    pf_response_time_ms: 1200,
                    bh_hint_requests: 1,
                    bh_page_revisits: 1,
                    bh_pause_duration_ms: 300
                },
                {
                    session_id: sessionId,
                    sr_paas_score: 9,
                    pf_accuracy: 0.92,
                    pf_response_time_ms: 950,
                    bh_hint_requests: 0,
                    bh_page_revisits: 0,
                    bh_pause_duration_ms: 200
                }
            ];

            const measurementIds = [];
            for (const measurement of measurements) {
                const measurementResponse = await helper.makeRequest('POST', '/api/measurements', {
                    token: studentToken,
                    data: measurement
                });
                helper.assertSuccessResponse(measurementResponse, null, 201);
                measurementIds.push(measurementResponse.body.data.measurement_id);
            }

            // Step 4: Retrieve measurements by session
            const sessionMeasurementsResponse = await helper.makeRequest('GET', `/api/measurements/session/${sessionId}`, {
                token: studentToken
            });

            helper.assertSuccessResponse(sessionMeasurementsResponse);
            expect(sessionMeasurementsResponse.body.data.measurements).toHaveLength(3);

            // Verify measurement data structure
            const retrievedMeasurements = sessionMeasurementsResponse.body.data.measurements;
            retrievedMeasurements.forEach((measurement, index) => {
                expect(measurement.session_id).toBe(sessionId);
                expect(measurement.cl_index).toBeDefined();
                expect(measurement.cl_category).toBeDefined();
                expect(['low', 'optimal', 'high', 'overload']).toContain(measurement.cl_category);
            });

            // Step 5: Retrieve user's measurements
            const userMeasurementsResponse = await helper.makeRequest('GET', '/api/measurements/my-measurements', {
                token: studentToken
            });

            helper.assertSuccessResponse(userMeasurementsResponse);
            expect(userMeasurementsResponse.body.data.measurements.length).toBeGreaterThanOrEqual(3);

            // Step 6: Retrieve measurements by topic (as teacher)
            const topicMeasurementsResponse = await helper.makeRequest('GET', `/api/measurements/topic/${topicId}`, {
                token: teacherToken
            });

            helper.assertSuccessResponse(topicMeasurementsResponse);
            expect(topicMeasurementsResponse.body.data.measurements).toHaveLength(3);
        });

        it('should validate measurement data correctly', async () => {
            const studentToken = await helper.loginAsStudent();

            // Test invalid session ID
            const invalidMeasurement = {
                session_id: 'invalid-session-id',
                sr_paas_score: 7,
                pf_accuracy: 0.85,
                pf_response_time_ms: 1000,
                bh_hint_requests: 1,
                bh_page_revisits: 0,
                bh_pause_duration_ms: 200
            };

            const invalidResponse = await helper.makeRequest('POST', '/api/measurements', {
                token: studentToken,
                data: invalidMeasurement
            });

            helper.assertErrorResponse(invalidResponse, 400);

            // Test invalid accuracy (outside 0-1 range)
            const invalidAccuracy = {
                session_id: '12345678-1234-1234-1234-123456789abc', // Valid UUID format
                sr_paas_score: 7,
                pf_accuracy: 1.5, // Invalid: > 1
                pf_response_time_ms: 1000,
                bh_hint_requests: 1,
                bh_page_revisits: 0,
                bh_pause_duration_ms: 200
            };

            const accuracyResponse = await helper.makeRequest('POST', '/api/measurements', {
                token: studentToken,
                data: invalidAccuracy
            });

            helper.assertErrorResponse(accuracyResponse, 400);
        });

        it('should handle concurrent measurements from different students', async () => {
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
                name: 'Concurrent Measurements Topic',
                description: 'Testing concurrent measurement submissions',
                subject: 'Concurrency',
                grade_level: 'Grade 10'
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

            // Submit measurements concurrently
            const measurement1 = {
                session_id: session1Id,
                sr_paas_score: 8,
                pf_accuracy: 0.90,
                pf_response_time_ms: 1100,
                bh_hint_requests: 1,
                bh_page_revisits: 0,
                bh_pause_duration_ms: 250
            };

            const measurement2 = {
                session_id: session2Id,
                sr_paas_score: 6,
                pf_accuracy: 0.75,
                pf_response_time_ms: 1400,
                bh_hint_requests: 2,
                bh_page_revisits: 1,
                bh_pause_duration_ms: 400
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

            // Verify measurements are stored correctly
            const topicMeasurementsResponse = await helper.makeRequest('GET', `/api/measurements/topic/${topicId}`, {
                token: teacherToken
            });

            helper.assertSuccessResponse(topicMeasurementsResponse);
            expect(topicMeasurementsResponse.body.data.measurements).toHaveLength(2);

            // Verify each measurement belongs to correct session
            const measurements = topicMeasurementsResponse.body.data.measurements;
            const sessionIds = measurements.map(m => m.session_id);
            expect(sessionIds).toContain(session1Id);
            expect(sessionIds).toContain(session2Id);
        });

        it('should calculate CL-index correctly', async () => {
            // Create topic and session
            const teacherToken = await helper.loginAsTeacher();
            const studentToken = await helper.loginAsStudent();

            const topicData = {
                name: 'CL Calculation Test Topic',
                description: 'Testing CL-index calculation',
                subject: 'CL Testing',
                grade_level: 'Grade 12'
            };

            const topicResponse = await helper.makeRequest('POST', '/api/topics', {
                token: teacherToken,
                data: topicData
            });

            helper.assertSuccessResponse(topicResponse, null, 201);
            const topicId = topicResponse.body.data.topic.topic_id;

            const sessionData = {
                topic_id: topicId,
                session_type: 'practice'
            };

            const sessionResponse = await helper.makeRequest('POST', '/api/sessions', {
                token: studentToken,
                data: sessionData
            });

            helper.assertSuccessResponse(sessionResponse, null, 201);
            const sessionId = sessionResponse.body.data.session.session_id;

            // Test high cognitive load scenario
            const highLoadMeasurement = {
                session_id: sessionId,
                sr_paas_score: 2, // High mental effort
                pf_accuracy: 0.60, // Poor performance
                pf_response_time_ms: 2500, // Slow response
                bh_hint_requests: 5, // Many hints
                bh_page_revisits: 3, // Many revisits
                bh_pause_duration_ms: 1200 // Long pauses
            };

            const highLoadResponse = await helper.makeRequest('POST', '/api/measurements', {
                token: studentToken,
                data: highLoadMeasurement
            });

            helper.assertSuccessResponse(highLoadResponse, null, 201);
            const highLoadResult = highLoadResponse.body.data;
            expect(highLoadResult.cl_index).toBeGreaterThan(0.2); // Should be relatively high load
            expect(highLoadResult.cl_category).toBe('optimal'); // Based on actual calculation result

            // Test optimal cognitive load scenario
            const optimalLoadMeasurement = {
                session_id: sessionId,
                sr_paas_score: 7, // Moderate effort
                pf_accuracy: 0.85, // Good performance
                pf_response_time_ms: 1000, // Reasonable response time
                bh_hint_requests: 1, // Few hints
                bh_page_revisits: 0, // No revisits
                bh_pause_duration_ms: 200 // Short pauses
            };

            const optimalLoadResponse = await helper.makeRequest('POST', '/api/measurements', {
                token: studentToken,
                data: optimalLoadMeasurement
            });

            helper.assertSuccessResponse(optimalLoadResponse, null, 201);
            const optimalLoadResult = optimalLoadResponse.body.data;
            expect(optimalLoadResult.cl_index).toBeGreaterThan(0.3);
            expect(optimalLoadResult.cl_index).toBeLessThan(0.7);
            expect(optimalLoadResult.cl_category).toBe('optimal');
        });
    });
});
