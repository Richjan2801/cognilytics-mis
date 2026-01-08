import { useState, useEffect } from 'react';
import { useCamera } from '../hooks/useCamera';

/**
 * Camera Component - Displays real-time video stream with camera controls
 */
export function CameraComponent({ onFrameCapture = null, autoCapture = false, captureInterval = 1000 }) {
    const {
        videoRef,
        canvasRef,
        isActive,
        isCameraReady,
        error,
        frameCount,
        startCamera,
        stopCamera,
        toggleCamera,
        captureFrame,
        startFrameCapture,
        stopFrameCapture
    } = useCamera();

    const [showCanvas, setShowCanvas] = useState(false);

    // Handle auto-capture when component mounts and camera is ready
    useEffect(() => {
        if (autoCapture && isCameraReady && onFrameCapture) {
            startFrameCapture(onFrameCapture, captureInterval);
        }

        return () => {
            if (autoCapture) {
                stopFrameCapture();
            }
        };
    }, [autoCapture, isCameraReady, onFrameCapture, captureInterval, startFrameCapture, stopFrameCapture]);

    const handleManualCapture = () => {
        const frame = captureFrame();
        if (frame && onFrameCapture) {
            onFrameCapture(frame);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Camera Error Display */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">Camera Error</p>
                    <p className="text-red-600 text-xs mt-1">{error}</p>
                </div>
            )}

            {/* Video Stream Container */}
            <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto block"
                    style={{ aspectRatio: '4/3' }}
                />

                {/* Canvas for frame capture (hidden) */}
                <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                />

                {/* Status Overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="bg-black bg-opacity-60 px-3 py-2 rounded-lg">
                        <span className="text-xs text-gray-300">
                            {isActive ? (
                                <span className="flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Live
                                </span>
                            ) : (
                                'Not Active'
                            )}
                        </span>
                    </div>

                    {autoCapture && isCameraReady && (
                        <div className="bg-black bg-opacity-60 px-3 py-2 rounded-lg">
                            <span className="text-xs text-gray-300">
                                Frames: <span className="font-semibold text-white">{frameCount}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {!isCameraReady && isActive && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                        <div className="text-center">
                            <div className="inline-block animate-spin mb-3">
                                <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full"></div>
                            </div>
                            <p className="text-gray-300 text-sm">Initializing Camera...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Control Buttons */}
            <div className="mt-4 flex gap-3 justify-center flex-wrap">
                <button
                    onClick={toggleCamera}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        isActive
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                    {isActive ? 'Stop Camera' : 'Start Camera'}
                </button>

                {!autoCapture && (
                    <button
                        onClick={handleManualCapture}
                        disabled={!isCameraReady}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                        Capture Frame
                    </button>
                )}

                <button
                    onClick={() => setShowCanvas(!showCanvas)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                    {showCanvas ? 'Hide' : 'Show'} Debug
                </button>
            </div>

            {/* Debug Canvas Display */}
            {showCanvas && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Last Captured Frame:</p>
                    <canvas
                        ref={canvasRef}
                        className="w-full border border-gray-300 rounded"
                    />
                </div>
            )}

            {/* Information Panel */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600">
                    <strong>Status:</strong> {isActive ? 'Camera Active' : 'Camera Inactive'} | 
                    <strong className="ml-2">Ready:</strong> {isCameraReady ? 'Yes' : 'No'}
                </p>
                {autoCapture && (
                    <p className="text-xs text-gray-600 mt-1">
                        <strong>Capture Interval:</strong> {captureInterval}ms | 
                        <strong className="ml-2">Frames Captured:</strong> {frameCount}
                    </p>
                )}
            </div>
        </div>
    );
}
