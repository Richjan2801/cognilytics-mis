import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Service for facial expression detection API calls
 */
export const facialExpressionService = {
    /**
     * Detect emotions in a single frame
     * @param {string} imageBase64 - Base64 encoded image
     * @param {string} token - JWT authentication token
     * @returns {Promise} Detection results with emotion and cognitive load
     */
    async detectEmotion(imageBase64, token) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/facial-expression/detect`,
                {
                    image: imageBase64
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Emotion detection error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    },

    /**
     * Batch detect emotions in multiple frames
     * @param {string[]} imageBase64Array - Array of base64 encoded images
     * @param {string} token - JWT authentication token
     * @returns {Promise} Batch detection results
     */
    async batchDetectEmotions(imageBase64Array, token) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/facial-expression/batch`,
                {
                    images: imageBase64Array
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000 // 60 second timeout for batch processing
                }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Batch emotion detection error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    },

    /**
     * Calibrate emotion detection with baseline images
     * @param {string[]} baselineImages - Array of base64 encoded baseline images
     * @param {string} token - JWT authentication token
     * @param {object} metadata - Additional calibration metadata
     * @returns {Promise} Calibration results
     */
    async calibrateDetection(baselineImages, token, metadata = {}) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/facial-expression/calibrate`,
                {
                    baseline_images: baselineImages,
                    metadata: metadata
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000
                }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Calibration error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    },

    /**
     * Get emotion analysis history for current session
     * @param {string} token - JWT authentication token
     * @returns {Promise} Analysis history
     */
    async getAnalysisHistory(token) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/facial-expression/history`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('History retrieval error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
};
