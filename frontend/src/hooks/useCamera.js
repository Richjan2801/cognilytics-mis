import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for managing camera access and frame capture
 */
export function useCamera() {
    console.log('📷 useCamera hook initialized');
    
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
            
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.');
            }

            // Check if we're running on HTTPS or localhost
            const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
            if (!isSecure) {
                console.warn('Camera access may not work properly over HTTP. Consider using HTTPS for production.');
            }

            const constraints = {
                video: {
                    width: { ideal: 640, min: 320 },
                    height: { ideal: 480, min: 240 },
                    frameRate: { ideal: 30, min: 15 }
                    // Remove facingMode to let browser choose default camera
                },
                audio: false
            };

            console.log('Requesting camera access with constraints:', constraints);
            
            // Try to get camera access
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (firstError) {
                console.warn('First camera attempt failed:', firstError.message);
                // Fallback to basic video constraints
                try {
                    const fallbackConstraints = { video: true, audio: false };
                    console.log('Trying fallback constraints:', fallbackConstraints);
                    stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
                } catch (fallbackError) {
                    console.error('Fallback camera access also failed:', fallbackError);
                    throw fallbackError;
                }
            }
            
            console.log('Camera stream obtained successfully');
            
            // Log stream details
            console.log('Stream tracks:', stream.getTracks().map(track => ({
                kind: track.kind,
                label: track.label,
                enabled: track.enabled,
                readyState: track.readyState
            })));
            
            streamRef.current = stream;
            
            if (videoRef.current) {
                console.log('Assigning stream to video element');
                videoRef.current.srcObject = stream;
                console.log('Video element srcObject set:', !!videoRef.current.srcObject);
                
                videoRef.current.onloadedmetadata = () => {
                    console.log('Video metadata loaded, camera ready');
                    console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                    setIsCameraReady(true);
                    setIsActive(true);
                };
                
                // Add error handler for video element
                videoRef.current.onerror = (e) => {
                    console.error('Video element error:', e);
                    setError('Video playback failed. Please check camera permissions.');
                };
                
                // Ensure video is not showing the page itself
                videoRef.current.oncanplay = () => {
                    console.log('Video can play, checking stream validity');
                    console.log('Video element dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                    // Check if video dimensions are reasonable (not showing page)
                    if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                        console.log(`Video dimensions: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                    } else {
                        console.warn('Video dimensions are invalid, might be showing page instead of camera');
                        setError('Camera stream appears invalid. Please refresh the page and allow camera access.');
                    }
                };
            } else {
                console.error('Video ref is null, cannot assign stream');
                setError('Video element not found. Please refresh the page.');
            }
        } catch (err) {
            console.error('Camera access error:', err);
            
            let errorMessage = 'Failed to access camera';
            
            if (err.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera access in your browser settings and refresh the page.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No camera found. Please connect a camera and try again.';
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'Camera is already in use by another application.';
            } else if (err.name === 'OverconstrainedError') {
                errorMessage = 'Camera does not support the requested video quality.';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        }
    }, []);

    /**
     * Stop camera stream
     */
    const stopCamera = useCallback(() => {
        console.log('🛑 Stopping camera...');
        
        // Stop all tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                console.log('Stopping track:', track.kind);
                track.stop();
            });
            streamRef.current = null;
        }
        
        // Clear video source
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            console.log('Cleared video srcObject');
        }
        
        // Clear capture interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log('Cleared capture interval');
        }

        setIsActive(false);
        setIsCameraReady(false);
        setFrameCount(0);
        console.log('Camera stopped successfully');
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
            console.warn('⚠️ Camera not ready yet');
            return;
        }

        console.log('🎬 Starting frame capture with interval:', interval, 'ms');
        intervalRef.current = setInterval(() => {
            const frame = captureFrame();
            if (frame && callback) {
                console.log('📷 Frame captured, calling callback');
                callback(frame);
            } else {
                console.log('⚠️ Frame capture failed or no callback');
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
