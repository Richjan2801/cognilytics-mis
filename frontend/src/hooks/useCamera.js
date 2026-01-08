import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for managing camera access and frame capture
 */
export function useCamera() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);

    const [isActive, setIsActive] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [error, setError] = useState(null);
    const [frameCount, setFrameCount] = useState(0);

    /**
     * Start camera stream
     */
    const startCamera = useCallback(async () => {
        try {
            setError(null);
            
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setIsCameraReady(true);
                    setIsActive(true);
                };
            }
        } catch (err) {
            setError(err.message || 'Failed to access camera');
            console.error('Camera error:', err);
        }
    }, []);

    /**
     * Stop camera stream
     */
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        setIsActive(false);
        setIsCameraReady(false);
        setFrameCount(0);
    }, []);

    /**
     * Capture current frame as base64 image
     */
    const captureFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) {
            return null;
        }

        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            
            ctx.drawImage(videoRef.current, 0, 0);
            
            // Convert to base64
            const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            setFrameCount(prev => prev + 1);
            
            return base64;
        } catch (err) {
            console.error('Frame capture error:', err);
            return null;
        }
    }, []);

    /**
     * Start capturing frames at specified interval
     */
    const startFrameCapture = useCallback((callback, interval = 1000) => {
        if (!isCameraReady) {
            console.warn('Camera not ready yet');
            return;
        }

        intervalRef.current = setInterval(() => {
            const frame = captureFrame();
            if (frame && callback) {
                callback(frame);
            }
        }, interval);
    }, [isCameraReady, captureFrame]);

    /**
     * Stop capturing frames
     */
    const stopFrameCapture = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    /**
     * Toggle camera on/off
     */
    const toggleCamera = useCallback(async () => {
        if (isActive) {
            stopCamera();
        } else {
            await startCamera();
        }
    }, [isActive, startCamera, stopCamera]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return {
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
    };
}
