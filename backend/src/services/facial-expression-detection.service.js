/**
 * Facial Expression Detection Client Service
 * Communicates with the Python Facial Expression Detection Service
 */

import axios from 'axios';
import config from '../config/env.js';

const API_BASE_URL = config.FED_SERVICE_HOST;
const TIMEOUT = config.FED_SERVICE_TIMEOUT;

class FacialExpressionClient {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: TIMEOUT,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Check if FED service is available
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            console.error('FED service health check failed:', error.message);
            throw new Error('Facial Expression Detection service is unavailable');
        }
    }

    /**
     * Detect facial expression from single image
     * @param {string} imageBase64 - Base64 encoded image
     * @param {string} userId - User ID
     * @param {string} sessionId - Session ID
     */
    async detectExpression(imageBase64, userId, sessionId) {
        try {
            const response = await this.client.post('/api/v1/detect', {
                image_base64: imageBase64,
                user_id: userId,
                session_id: sessionId
            });

            console.log('🎭 FED Service Response:', JSON.stringify(response.data, null, 2));

            if (!response.data.success) {
                throw new Error(response.data.error || 'Detection failed');
            }

            console.log('✅ Returning data:', JSON.stringify(response.data.data, null, 2));
            return response.data.data;
        } catch (error) {
            console.error('Expression detection error:', error.message);
            throw error;
        }
    }

    /**
     * Detect facial expressions from multiple images
     * @param {Array} images - Array of {image_base64, timestamp}
     * @param {string} userId - User ID
     * @param {string} sessionId - Session ID
     */
    async detectBatch(images, userId, sessionId) {
        try {
            const response = await this.client.post('/api/v1/batch', {
                images,
                user_id: userId,
                session_id: sessionId
            });

            if (!response.data.success) {
                throw new Error(response.data.error || 'Batch detection failed');
            }

            return response.data.data;
        } catch (error) {
            console.error('Batch detection error:', error.message);
            throw error;
        }
    }

    /**
     * Calibrate detector for specific user
     * @param {string} userId - User ID
     * @param {Array} imageBase64Array - Array of base64 encoded images
     */
    async calibrateUser(userId, imageBase64Array) {
        try {
            const response = await this.client.post('/api/v1/calibrate', {
                user_id: userId,
                images: imageBase64Array
            });

            if (!response.data.success) {
                throw new Error(response.data.error || 'Calibration failed');
            }

            return response.data.data;
        } catch (error) {
            console.error('Calibration error:', error.message);
            throw error;
        }
    }
}

export const fedClient = new FacialExpressionClient();

/**
 * Convert video frame to Base64 string
 * @param {HTMLCanvasElement} canvas - Canvas element with frame
 */
export function frameToBase64(canvas) {
    try {
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    } catch (error) {
        console.error('Frame conversion error:', error);
        return null;
    }
}

/**
 * Capture image from video stream
 * @param {HTMLVideoElement} video - Video element
 */
export function captureFrame(video) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        return frameToBase64(canvas);
    } catch (error) {
        console.error('Frame capture error:', error);
        return null;
    }
}

/**
 * Stream facial expression detection from camera
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @param {Function} onFrame - Callback for each frame result
 * @param {number} interval - Interval between captures (ms)
 */
export async function startExpressionStream(userId, sessionId, onFrame, interval = 1000) {
    try {
        const video = document.createElement('video');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.play();

        const captureInterval = setInterval(async () => {
            try {
                const frameBase64 = captureFrame(video);
                if (frameBase64) {
                    const result = await fedClient.detectExpression(frameBase64, userId, sessionId);
                    if (onFrame) {
                        onFrame(result);
                    }
                }
            } catch (error) {
                console.error('Stream capture error:', error);
            }
        }, interval);

        return {
            stop: () => {
                clearInterval(captureInterval);
                stream.getTracks().forEach(track => track.stop());
            },
            video,
            stream
        };
    } catch (error) {
        console.error('Stream initialization error:', error);
        throw error;
    }
}

/**
 * Calculate average cognitive load from expressions
 * @param {Array} expressions - Array of expression results
 */
export function calculateAverageLoad(expressions) {
    if (!expressions || expressions.length === 0) {
        return 0.5;
    }

    const loads = expressions
        .map(e => e.detection_result?.cognitive_load_estimate)
        .filter(cl => typeof cl === 'number');

    if (loads.length === 0) {
        return 0.5;
    }

    return loads.reduce((a, b) => a + b, 0) / loads.length;
}

/**
 * Detect stress indicators from expressions
 * @param {Array} expressions - Array of expression results
 */
export function detectStressIndicators(expressions) {
    if (!expressions || expressions.length === 0) {
        return { stress_level: 'normal', indicators: [] };
    }

    const indicators = [];
    const loads = expressions.map(e => e.detection_result?.cognitive_load_estimate || 0.5);
    const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;

    if (avgLoad > 0.8) {
        indicators.push('high_cognitive_load');
    }

    if (avgLoad > 0.65) {
        indicators.push('elevated_stress');
    }

    // Check for consistent negative expressions
    const negativeExpressions = expressions.filter(e => {
        const emotion = e.detection_result?.expression?.dominant_emotion;
        return ['anger', 'fear', 'disgust', 'sad'].includes(emotion);
    });

    if (negativeExpressions.length > expressions.length * 0.5) {
        indicators.push('negative_expressions');
    }

    return {
        stress_level: avgLoad > 0.8 ? 'critical' : avgLoad > 0.65 ? 'high' : avgLoad > 0.4 ? 'moderate' : 'normal',
        average_load: avgLoad,
        indicators,
        expression_count: expressions.length
    };
}

export default fedClient;
