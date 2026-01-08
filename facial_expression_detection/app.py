"""
Facial Expression Detection Service
Uses computer vision to detect facial expressions and cognitive load indicators
"""

import os
import sys
import cv2
import json
import base64
import numpy as np
from flask import Flask, request, jsonify
from datetime import datetime
from typing import Dict, List, Tuple

# Try to import face detection libraries
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("Warning: deepface not installed. Install with: pip install deepface")

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    print("Warning: mediapipe not installed. Install with: pip install mediapipe")

# Initialize Flask app
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

# Facial expression to cognitive load mapping
EXPRESSION_TO_CL = {
    'happy': 0.2,
    'neutral': 0.5,
    'sad': 0.6,
    'anger': 0.7,
    'disgust': 0.65,
    'fear': 0.75,
    'surprise': 0.55
}

class FacialExpressionDetector:
    """Detects facial expressions and maps to cognitive load"""
    
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.expression_history = []
        self.confidence_threshold = 0.3
    
    def detect_expression_deepface(self, image_array: np.ndarray) -> Dict:
        """Detect facial expression using DeepFace"""
        if not DEEPFACE_AVAILABLE:
            return None
        
        try:
            result = DeepFace.analyze(
                image_array,
                actions=['emotion'],
                enforce_detection=False
            )
            
            if result and len(result) > 0:
                emotions = result[0].get('emotion', {})
                dominant_emotion = result[0].get('dominant_emotion', 'neutral')
                
                return {
                    'emotions': emotions,
                    'dominant_emotion': dominant_emotion,
                    'confidence': emotions.get(dominant_emotion, 0) / 100
                }
        except Exception as e:
            print(f"DeepFace error: {e}")
        
        return None
    
    def detect_expression_mediapipe(self, image_array: np.ndarray) -> Dict:
        """Detect facial landmarks using MediaPipe for micro-expressions"""
        if not MEDIAPIPE_AVAILABLE:
            return None
        
        try:
            mp_face_mesh = mp.solutions.face_mesh
            mp_drawing = mp.solutions.drawing_utils
            
            with mp_face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                min_detection_confidence=0.5
            ) as face_mesh:
                results = face_mesh.process(cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB))
                
                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0]
                    
                    # Analyze facial landmarks for micro-expressions
                    eye_openness = self._calculate_eye_openness(landmarks)
                    mouth_openness = self._calculate_mouth_openness(landmarks)
                    brow_height = self._calculate_brow_height(landmarks)
                    
                    return {
                        'eye_openness': eye_openness,
                        'mouth_openness': mouth_openness,
                        'brow_height': brow_height,
                        'landmarks_detected': True
                    }
        except Exception as e:
            print(f"MediaPipe error: {e}")
        
        return None
    
    def _calculate_eye_openness(self, landmarks) -> float:
        """Calculate eye openness from landmarks (0-1)"""
        # Left eye points
        left_eye_top = landmarks.landmark[159]
        left_eye_bottom = landmarks.landmark[145]
        left_eye_openness = abs(left_eye_top.y - left_eye_bottom.y)
        
        # Right eye points
        right_eye_top = landmarks.landmark[386]
        right_eye_bottom = landmarks.landmark[374]
        right_eye_openness = abs(right_eye_top.y - right_eye_bottom.y)
        
        return (left_eye_openness + right_eye_openness) / 2
    
    def _calculate_mouth_openness(self, landmarks) -> float:
        """Calculate mouth openness from landmarks (0-1)"""
        mouth_top = landmarks.landmark[13]
        mouth_bottom = landmarks.landmark[14]
        return abs(mouth_top.y - mouth_bottom.y)
    
    def _calculate_brow_height(self, landmarks) -> float:
        """Calculate brow height from landmarks (0-1)"""
        left_brow = landmarks.landmark[70]
        right_brow = landmarks.landmark[300]
        nose_top = landmarks.landmark[6]
        
        return max(
            abs(left_brow.y - nose_top.y),
            abs(right_brow.y - nose_top.y)
        )
    
    def extract_features(self, image_array: np.ndarray) -> Dict:
        """Extract all facial features from image"""
        features = {
            'timestamp': datetime.utcnow().isoformat(),
            'face_detected': False,
            'expression': None,
            'landmarks': None,
            'cognitive_load_estimate': None
        }
        
        # Detect faces
        gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) > 0:
            features['face_detected'] = True
            features['face_count'] = len(faces)
            
            # Analyze main face (largest)
            largest_face_idx = max(range(len(faces)), key=lambda i: faces[i][2] * faces[i][3])
            x, y, w, h = faces[largest_face_idx]
            face_roi = image_array[y:y+h, x:x+w]
            
            # Try DeepFace analysis
            expr_result = self.detect_expression_deepface(face_roi)
            if expr_result:
                features['expression'] = expr_result
            
            # Try MediaPipe analysis
            landmarks_result = self.detect_expression_mediapipe(face_roi)
            if landmarks_result:
                features['landmarks'] = landmarks_result
            
            # Calculate cognitive load estimate
            features['cognitive_load_estimate'] = self._estimate_cognitive_load(features)
        
        return features
    
    def _estimate_cognitive_load(self, features: Dict) -> float:
        """Estimate cognitive load based on facial features (0-1)"""
        if not features['face_detected']:
            return 0.5  # Default neutral
        
        cl_score = 0.5  # Start with neutral
        weights_sum = 0
        
        # Use expression if available
        if features['expression'] and 'dominant_emotion' in features['expression']:
            emotion = features['expression']['dominant_emotion']
            emotion_cl = EXPRESSION_TO_CL.get(emotion, 0.5)
            confidence = features['expression'].get('confidence', 0.5)
            
            cl_score += (emotion_cl - 0.5) * confidence * 0.5
            weights_sum += 0.5
        
        # Use landmarks if available
        if features['landmarks']:
            landmarks = features['landmarks']
            
            # Low eye openness often indicates fatigue/stress
            if 'eye_openness' in landmarks:
                eye_factor = (0.5 - landmarks['eye_openness']) * 2
                cl_score += eye_factor * 0.3
                weights_sum += 0.3
            
            # Low brow often indicates concentration/stress
            if 'brow_height' in landmarks:
                brow_factor = (0.5 - landmarks['brow_height']) * 0.5
                cl_score += brow_factor * 0.2
                weights_sum += 0.2
        
        # Normalize score
        if weights_sum > 0:
            cl_score = cl_score / weights_sum
        
        return max(0, min(1, cl_score))


# Initialize detector
detector = FacialExpressionDetector()


# API Routes

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Facial Expression Detection Service',
        'deepface_available': DEEPFACE_AVAILABLE,
        'mediapipe_available': MEDIAPIPE_AVAILABLE,
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/v1/detect', methods=['POST'])
def detect_expression():
    """
    Detect facial expression from image
    
    Request JSON:
    {
        'image_base64': '<base64_encoded_image>',
        'user_id': '<optional_user_id>',
        'session_id': '<optional_session_id>'
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image_base64' not in data:
            return jsonify({
                'success': False,
                'error': 'image_base64 is required in request body'
            }), 400
        
        # Decode image
        try:
            image_data = base64.b64decode(data['image_base64'])
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Failed to decode image: {str(e)}'
            }), 400
        
        # Extract features
        features = detector.extract_features(image)
        
        return jsonify({
            'success': True,
            'data': {
                'user_id': data.get('user_id'),
                'session_id': data.get('session_id'),
                'detection_result': features
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Detection failed: {str(e)}'
        }), 500


@app.route('/api/v1/batch', methods=['POST'])
def detect_batch():
    """
    Detect facial expressions from multiple images
    
    Request JSON:
    {
        'images': [
            {
                'image_base64': '<base64>',
                'timestamp': '<ISO_timestamp>'
            },
            ...
        ],
        'user_id': '<user_id>',
        'session_id': '<session_id>'
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'images' not in data:
            return jsonify({
                'success': False,
                'error': 'images array is required'
            }), 400
        
        results = []
        
        for img_data in data['images']:
            try:
                # Decode image
                image_bytes = base64.b64decode(img_data['image_base64'])
                nparr = np.frombuffer(image_bytes, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                # Extract features
                features = detector.extract_features(image)
                features['timestamp'] = img_data.get('timestamp', features['timestamp'])
                
                results.append(features)
            except Exception as e:
                results.append({
                    'error': str(e),
                    'timestamp': img_data.get('timestamp')
                })
        
        # Calculate aggregate statistics
        cl_scores = [r.get('cognitive_load_estimate', 0.5) for r in results if 'cognitive_load_estimate' in r]
        aggregate = {
            'total_frames': len(results),
            'faces_detected': sum(1 for r in results if r.get('face_detected')),
            'average_cognitive_load': np.mean(cl_scores) if cl_scores else 0.5,
            'max_cognitive_load': max(cl_scores) if cl_scores else 0.5,
            'min_cognitive_load': min(cl_scores) if cl_scores else 0.5,
        } if results else {}
        
        return jsonify({
            'success': True,
            'data': {
                'user_id': data.get('user_id'),
                'session_id': data.get('session_id'),
                'results': results,
                'aggregate': aggregate
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Batch detection failed: {str(e)}'
        }), 500


@app.route('/api/v1/camera/stream', methods=['GET'])
def camera_stream():
    """
    Real-time camera stream endpoint (Server-Sent Events)
    Client should set up WebSocket or SSE connection for real-time updates
    """
    try:
        def generate_frames():
            cap = cv2.VideoCapture(0)
            
            if not cap.isOpened():
                yield f"data: {json.dumps({'error': 'Camera not accessible'})}\n\n"
                return
            
            frame_count = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Extract features every N frames
                if frame_count % 5 == 0:
                    features = detector.extract_features(frame)
                    yield f"data: {json.dumps(features)}\n\n"
                
                frame_count += 1
                
                if frame_count > 300:  # Limit stream
                    break
            
            cap.release()
        
        return generate_frames(), 200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache'
        }
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Stream failed: {str(e)}'
        }), 500


@app.route('/api/v1/calibrate', methods=['POST'])
def calibrate():
    """
    Calibrate detector for specific user
    Used to establish baseline expressions for better accuracy
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        images = data.get('images', [])
        
        if not user_id or not images:
            return jsonify({
                'success': False,
                'error': 'user_id and images array required'
            }), 400
        
        # Process calibration images
        expressions = []
        for img_data in images:
            try:
                image_bytes = base64.b64decode(img_data)
                nparr = np.frombuffer(image_bytes, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                features = detector.extract_features(image)
                expressions.append(features)
            except Exception as e:
                continue
        
        if not expressions:
            return jsonify({
                'success': False,
                'error': 'Failed to process calibration images'
            }), 400
        
        return jsonify({
            'success': True,
            'data': {
                'user_id': user_id,
                'calibration_samples': len(expressions),
                'baseline_metrics': {
                    'avg_cl': np.mean([e.get('cognitive_load_estimate', 0.5) for e in expressions]),
                    'faces_detected': sum(1 for e in expressions if e.get('face_detected'))
                }
            }
        }), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Calibration failed: {str(e)}'
        }), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    print(f"""
    ╔══════════════════════════════════════════╗
    ║  Facial Expression Detection Service    ║
    ║  Running on http://localhost:{port}       ║
    ╚══════════════════════════════════════════╝
    
    Features Enabled:
    - DeepFace: {'✓' if DEEPFACE_AVAILABLE else '✗'}
    - MediaPipe: {'✓' if MEDIAPIPE_AVAILABLE else '✗'}
    """)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
