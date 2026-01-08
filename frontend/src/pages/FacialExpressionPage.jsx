import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CameraComponent } from '../components/CameraComponent';
import { facialExpressionService } from '../services/facialExpressionService';
import { DashboardLayout } from '../components/layout/DashboardLayout';

/**
 * Emotion color mapping
 */
const EMOTION_COLORS = {
    happy: 'bg-yellow-500',
    sad: 'bg-blue-500',
    angry: 'bg-red-600',
    surprised: 'bg-purple-500',
    fear: 'bg-orange-500',
    disgust: 'bg-green-600',
    neutral: 'bg-gray-500'
};

const EMOTION_TEXT_COLORS = {
    happy: 'text-yellow-600',
    sad: 'text-blue-600',
    angry: 'text-red-700',
    surprised: 'text-purple-600',
    fear: 'text-orange-600',
    disgust: 'text-green-700',
    neutral: 'text-gray-600'
};

/**
 * Facial Expression Detection Page
 */
export function FacialExpressionPage() {
    const { token, user } = useContext(AuthContext);
    
    const [detectionActive, setDetectionActive] = useState(false);
    const [detectionResults, setDetectionResults] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [stats, setStats] = useState({
        totalFrames: 0,
        averageCognitiveLevelLoad: 0,
        dominantEmotion: null,
        sessionStartTime: null
    });
    const [captureInterval, setCaptureInterval] = useState(2000); // 2 seconds default

    // Load analysis history on mount
    useEffect(() => {
        loadHistory();
    }, []);

    /**
     * Load analysis history
     */
    const loadHistory = async () => {
        if (!token) return;

        const result = await facialExpressionService.getAnalysisHistory(token);
        if (result.success) {
            setAnalysisHistory(result.data.history || []);
        }
    };

    /**
     * Handle frame capture from camera
     */
    const handleFrameCapture = async (frameBase64) => {
        if (!detectionActive || isProcessing || !token) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Send frame to backend for emotion detection
            const result = await facialExpressionService.detectEmotion(frameBase64, token);

            if (result.success) {
                const detection = result.data;

                // Update current results
                setDetectionResults({
                    ...detection,
                    timestamp: new Date().toISOString()
                });

                // Update statistics
                setStats(prev => {
                    const newTotal = prev.totalFrames + 1;
                    const newAvg = (prev.averageCognitiveLevelLoad * prev.totalFrames + 
                                  (detection.cognitive_load || 0)) / newTotal;

                    return {
                        ...prev,
                        totalFrames: newTotal,
                        averageCognitiveLevelLoad: parseFloat(newAvg.toFixed(2)),
                        dominantEmotion: detection.dominant_emotion || prev.dominantEmotion,
                        sessionStartTime: prev.sessionStartTime || new Date()
                    };
                });

                // Add to history
                setAnalysisHistory(prev => [
                    {
                        ...detection,
                        timestamp: new Date().toISOString()
                    },
                    ...prev
                ].slice(0, 100)); // Keep last 100 entries
            } else {
                setError(result.error || 'Detection failed');
            }
        } catch (err) {
            console.error('Frame processing error:', err);
            setError('Error processing frame');
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * Toggle detection on/off
     */
    const handleToggleDetection = () => {
        setDetectionActive(!detectionActive);
        if (!detectionActive) {
            setStats({
                totalFrames: 0,
                averageCognitiveLevelLoad: 0,
                dominantEmotion: null,
                sessionStartTime: new Date()
            });
            setAnalysisHistory([]);
            setSuccess('Emotion detection started');
            setTimeout(() => setSuccess(null), 3000);
        } else {
            setSuccess('Emotion detection stopped');
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    /**
     * Render emotion badge
     */
    const renderEmotionBadge = (emotion, confidence) => {
        if (!emotion) return null;
        
        return (
            <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${EMOTION_COLORS[emotion] || 'bg-gray-500'}`}></div>
                <span className={`font-semibold ${EMOTION_TEXT_COLORS[emotion] || 'text-gray-600'}`}>
                    {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                </span>
                {confidence && (
                    <span className="text-sm text-gray-500">
                        ({Math.round(confidence * 100)}%)
                    </span>
                )}
            </div>
        );
    };

    /**
     * Render stress level indicator
     */
    const renderStressLevel = (cognitiveLoad) => {
        if (cognitiveLoad === null || cognitiveLoad === undefined) return null;

        let level = 'Low';
        let color = 'bg-green-100 text-green-800';

        if (cognitiveLoad > 0.7) {
            level = 'High';
            color = 'bg-red-100 text-red-800';
        } else if (cognitiveLoad > 0.4) {
            level = 'Medium';
            color = 'bg-yellow-100 text-yellow-800';
        }

        return (
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${color}`}>
                Stress: {level} ({Math.round(cognitiveLoad * 100)}%)
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Facial Expression Detection
                    </h1>
                    <p className="text-gray-600">
                        Real-time emotion and cognitive load analysis using your device camera
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 font-medium">Error</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Success Alert */}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-700 font-medium">{success}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Camera Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Live Camera Feed
                            </h2>
                            <CameraComponent
                                onFrameCapture={handleFrameCapture}
                                autoCapture={detectionActive}
                                captureInterval={captureInterval}
                            />
                        </div>
                    </div>

                    {/* Results Panel */}
                    <div className="space-y-4">
                        {/* Control Panel */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Controls</h3>
                            
                            <div className="space-y-4">
                                <button
                                    onClick={handleToggleDetection}
                                    className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                                        detectionActive
                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                                >
                                    {detectionActive ? 'Stop Detection' : 'Start Detection'}
                                </button>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Capture Interval (ms)
                                    </label>
                                    <input
                                        type="range"
                                        min="500"
                                        max="5000"
                                        step="500"
                                        value={captureInterval}
                                        onChange={(e) => setCaptureInterval(parseInt(e.target.value))}
                                        disabled={detectionActive}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{captureInterval}ms</p>
                                </div>

                                <button
                                    onClick={loadHistory}
                                    className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    Refresh History
                                </button>
                            </div>
                        </div>

                        {/* Current Results */}
                        {detectionResults && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Detection</h3>
                                
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Primary Emotion</p>
                                        {renderEmotionBadge(
                                            detectionResults.dominant_emotion,
                                            detectionResults.emotion_confidence
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Cognitive Load</p>
                                        {renderStressLevel(detectionResults.cognitive_load)}
                                    </div>

                                    {detectionResults.emotion_scores && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-2">All Emotions</p>
                                            <div className="space-y-1">
                                                {Object.entries(detectionResults.emotion_scores)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .slice(0, 5)
                                                    .map(([emotion, score]) => (
                                                        <div key={emotion} className="flex items-center justify-between text-xs">
                                                            <span className="text-gray-600">{emotion}</span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-12 h-2 bg-gray-200 rounded overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-blue-500"
                                                                        style={{ width: `${score * 100}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-gray-600 w-8 text-right">
                                                                    {Math.round(score * 100)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Session Statistics */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Stats</h3>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Frames Analyzed:</span>
                                    <span className="font-semibold text-gray-900">{stats.totalFrames}</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Avg Cognitive Load:</span>
                                    <span className="font-semibold text-gray-900">
                                        {Math.round(stats.averageCognitiveLevelLoad * 100)}%
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Primary Emotion:</span>
                                    <span className="font-semibold text-gray-900">
                                        {stats.dominantEmotion ? stats.dominantEmotion.charAt(0).toUpperCase() + stats.dominantEmotion.slice(1) : 'N/A'}
                                    </span>
                                </div>

                                {stats.sessionStartTime && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Duration:</span>
                                        <span className="font-semibold text-gray-900">
                                            {detectionActive ? (
                                                <span>
                                                    {Math.floor((new Date() - stats.sessionStartTime) / 1000)}s
                                                </span>
                                            ) : (
                                                Math.floor((new Date() - stats.sessionStartTime) / 1000) + 's'
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analysis History */}
                {analysisHistory.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis History</h2>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-gray-700 font-semibold">Time</th>
                                        <th className="px-4 py-2 text-left text-gray-700 font-semibold">Emotion</th>
                                        <th className="px-4 py-2 text-left text-gray-700 font-semibold">Confidence</th>
                                        <th className="px-4 py-2 text-left text-gray-700 font-semibold">Cognitive Load</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {analysisHistory.slice(0, 20).map((entry, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">
                                                {new Date(entry.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-4 py-2">
                                                {entry.dominant_emotion?.charAt(0).toUpperCase() + entry.dominant_emotion?.slice(1)}
                                            </td>
                                            <td className="px-4 py-2">
                                                {Math.round((entry.emotion_confidence || 0) * 100)}%
                                            </td>
                                            <td className="px-4 py-2">
                                                {Math.round((entry.cognitive_load || 0) * 100)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {analysisHistory.length === 0 && !detectionActive && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                        <p className="text-blue-700">
                            Start the detection to begin analyzing facial expressions and emotions
                        </p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
