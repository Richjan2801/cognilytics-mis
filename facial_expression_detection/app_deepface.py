"""
Facial Expression Detection Service - UPDATED VERSION
Uses DeepFace AI to accurately detect facial expressions and emotions
"""

import os
import cv2
import json
import base64
import numpy as np
from flask import Flask, request, jsonify
from datetime import datetime
from typing import Dict, List, Tuple
import logging

# Import DeepFace untuk emotion detection
try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
    print("✅ DeepFace loaded successfully")
except ImportError:
    DEEPFACE_AVAILABLE = False
    print("❌ Warning: deepface not installed. Install with: pip install deepface")

# Import MediaPipe untuk face detection
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
    print("✅ MediaPipe loaded successfully")
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    print("❌ Warning: mediapipe not installed.")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max
app.config['JSON_SORT_KEYS'] = False

# Emotion to Cognitive Load mapping (untuk calculate CL-Index)
EMOTION_TO_CL = {
    'happy': 0.2,
    'neutral': 0.4,
    'sad': 0.5,
    'angry': 0.7,
    'disgust': 0.65,
    'fear': 0.8,
    'surprise': 0.55
}


class FacialExpressionDetector:
    """
    Detects facial expressions menggunakan DeepFace AI
    Provides accurate emotion recognition (happy, sad, angry, fear, etc.)
    """
    
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.expression_history = []
        self.confidence_threshold = 0.3
        
        logger.info(f"FacialExpressionDetector initialized")
        logger.info(f"DeepFace available: {DEEPFACE_AVAILABLE}")
        logger.info(f"MediaPipe available: {MEDIAPIPE_AVAILABLE}")
    
    def detect_emotion_deepface(self, image_array: np.ndarray, enforce_detection=False) -> Dict:
        """
        Detect facial expression menggunakan DeepFace
        Returns: {
            'dominant_emotion': 'happy',
            'emotion_confidence': 0.95,
            'emotion_scores': {'happy': 0.95, 'sad': 0.02, ...},
            'cognitive_load_estimate': 0.25
        }
        """
        if not DEEPFACE_AVAILABLE:
            logger.warning("⚠️  DeepFace not available, returning mock data")
            return self._get_mock_emotion()
        
        try:
            logger.info("🎭 Starting DeepFace emotion detection...")
            
            # Use DeepFace.analyze untuk emotion detection
            # Ini menggunakan VGGFace2 pre-trained model
            analysis = DeepFace.analyze(
                img_path=image_array,
                actions=['emotion'],
                enforce_detection=enforce_detection,
                silent=True
            )
            
            # DeepFace returns list of results (one per face)
            if analysis and len(analysis) > 0:
                result = analysis[0]  # Ambil wajah terbesar
                
                logger.info(f"✅ Emotions detected: {result.get('emotion', {})}")
                
                # Extract emotion data
                emotions_dict = result.get('emotion', {})
                dominant_emotion = result.get('dominant_emotion', 'neutral')
                
                # Find confidence untuk dominant emotion
                emotion_confidence = emotions_dict.get(dominant_emotion, 0) / 100.0
                
                # Normalize all emotion scores to 0-1
                emotion_scores = {
                    emotion: score / 100.0 
                    for emotion, score in emotions_dict.items()
                }
                
                # Calculate cognitive load dari emotions
                cognitive_load = self._calculate_cognitive_load(emotion_scores)
                
                logger.info(f"📊 Emotion Scores: {emotion_scores}")
                logger.info(f"🧠 Cognitive Load: {cognitive_load:.3f}")
                
                return {
                    'face_detected': True,
                    'dominant_emotion': dominant_emotion,
                    'emotion_confidence': round(emotion_confidence, 4),
                    'emotion_scores': emotion_scores,
                    'cognitive_load_estimate': round(cognitive_load, 4),
                    'source': 'deepface_vggface2'
                }
            else:
                logger.warning("⚠️  No face detected")
                return {
                    'face_detected': False,
                    'error': 'No face detected in image',
                    'dominant_emotion': None,
                    'emotion_confidence': 0.0,
                    'emotion_scores': {}
                }
        
        except Exception as e:
            logger.error(f"❌ DeepFace error: {str(e)}")
            # Return fallback dengan mock data
            return self._get_mock_emotion()
    
    def _calculate_cognitive_load(self, emotion_scores: Dict) -> float:
        """
        Calculate cognitive load estimate dari emotion scores
        
        Formula:
        CL = weighted average dari emotion CL values
        
        Setiap emotion dipetakan ke CL value:
        - happy: 0.2 (rendah stress)
        - neutral: 0.4 (moderate)
        - fear: 0.8 (tinggi stress)
        - etc
        """
        if not emotion_scores:
            return 0.5
        
        cl_estimate = 0
        for emotion, score in emotion_scores.items():
            # Get CL value untuk emotion ini
            cl_value = EMOTION_TO_CL.get(emotion, 0.5)
            # Weight dengan confidence
            cl_estimate += cl_value * score
        
        # Clamp ke 0-1
        cl_estimate = max(0.0, min(1.0, cl_estimate))
        return round(cl_estimate, 4)
    
    def _get_mock_emotion(self) -> Dict:
        """
        Return mock emotion data ketika DeepFace tidak tersedia
        Gunakan untuk testing/development
        """
        return {
            'face_detected': True,
            'dominant_emotion': 'neutral',
            'emotion_confidence': 0.65,
            'emotion_scores': {
                'happy': 0.10,
                'sad': 0.05,
                'angry': 0.05,
                'fear': 0.05,
                'disgust': 0.05,
                'neutral': 0.65,
                'surprise': 0.05
            },
            'cognitive_load_estimate': 0.4,
            'source': 'mock'
        }
    
    def detect_faces_opencv(self, image_array: np.ndarray) -> List[Tuple]:
        """
        Detect faces menggunakan OpenCV Haar Cascade
        Returns: list of (x, y, width, height) tuples
        """
        gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.3,
            minNeighbors=5,
            minSize=(30, 30)
        )
        return faces
    
    def extract_features(self, image_array: np.ndarray) -> Dict:
        """
        Extract semua facial features dari image
        
        Returns: {
            'timestamp': ISO timestamp,
            'face_detected': bool,
            'emotion': {...},
            'face_count': int
        }
        """
        features = {
            'timestamp': datetime.utcnow().isoformat(),
            'face_detected': False,
            'emotion': None,
            'face_count': 0
        }
        
        try:
            # First detect faces dengan OpenCV
            gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
            
            if len(faces) > 0:
                features['face_detected'] = True
                features['face_count'] = len(faces)
                
                # Ambil wajah terbesar
                largest_face_idx = max(
                    range(len(faces)), 
                    key=lambda i: faces[i][2] * faces[i][3]
                )
                
                # Analyze emotion menggunakan DeepFace
                emotion_result = self.detect_emotion_deepface(image_array)
                if emotion_result:
                    features['emotion'] = emotion_result
            
            return features
        
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return features


# Initialize detector
detector = FacialExpressionDetector()


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'facial-expression-detection',
        'version': '2.0.0',
        'deepface_available': DEEPFACE_AVAILABLE,
        'mediapipe_available': MEDIAPIPE_AVAILABLE
    })


@app.route('/api/v1/detect', methods=['POST'])
def detect_emotion():
    """
    Detect emotion dari single base64 image
    
    Request:
    {
        'image_base64': 'iVBORw0KGgo...',
        'user_id': 'usr_001' (optional),
        'session_id': 'sess_001' (optional)
    }
    
    Response:
    {
        'success': true,
        'data': {
            'face_detected': true,
            'dominant_emotion': 'happy',
            'emotion_confidence': 0.95,
            'emotion_scores': {...},
            'cognitive_load_estimate': 0.25,
            'processing_time_ms': 245
        }
    }
    """
    try:
        import time
        start_time = time.time()
        
        # Get request data
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        image_base64 = request_data.get('image_base64')
        user_id = request_data.get('user_id')
        session_id = request_data.get('session_id')
        
        if not image_base64:
            return jsonify({
                'success': False,
                'error': 'image_base64 is required'
            }), 400
        
        logger.info(f"📥 Received emotion detection request for user: {user_id}")
        
        # Decode base64 image
        try:
            # Remove data URL prefix if present
            if image_base64.startswith('data:image'):
                image_base64 = image_base64.split(',')[1]
            
            image_data = base64.b64decode(image_base64)
            nparr = np.frombuffer(image_data, np.uint8)
            image_array = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image_array is None:
                return jsonify({
                    'success': False,
                    'error': 'Invalid image data'
                }), 400
            
            logger.info(f"✅ Image decoded successfully: {image_array.shape}")
        
        except Exception as e:
            logger.error(f"❌ Image decode error: {e}")
            return jsonify({
                'success': False,
                'error': f'Failed to decode image: {str(e)}'
            }), 400
        
        # Detect emotion
        emotion_result = detector.detect_emotion_deepface(image_array)
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000
        
        logger.info(f"✅ Detection complete in {processing_time:.0f}ms")
        
        return jsonify({
            'success': True,
            'data': {
                **emotion_result,
                'processing_time_ms': round(processing_time, 2)
            }
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Error in detect_emotion: {e}")
        return jsonify({
            'success': False,
            'error': f'Detection failed: {str(e)}'
        }), 500


@app.route('/api/v1/batch', methods=['POST'])
def batch_detect_emotion():
    """
    Batch detect emotions dari multiple images
    """
    try:
        import time
        start_time = time.time()
        
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({'success': False, 'error': 'Request body required'}), 400
        
        images = request_data.get('images', [])
        
        if not images or not isinstance(images, list):
            return jsonify({
                'success': False,
                'error': 'images must be a non-empty array'
            }), 400
        
        logger.info(f"📥 Batch detection request for {len(images)} images")
        
        results = []
        successful = 0
        failed = 0
        
        for idx, img_data in enumerate(images):
            try:
                image_base64 = img_data.get('image_base64')
                image_id = img_data.get('image_id', f'img_{idx}')
                
                if not image_base64:
                    results.append({
                        'image_id': image_id,
                        'success': False,
                        'error': 'image_base64 missing'
                    })
                    failed += 1
                    continue
                
                # Decode
                if image_base64.startswith('data:image'):
                    image_base64 = image_base64.split(',')[1]
                
                image_data = base64.b64decode(image_base64)
                nparr = np.frombuffer(image_data, np.uint8)
                image_array = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if image_array is None:
                    results.append({
                        'image_id': image_id,
                        'success': False,
                        'error': 'Invalid image data'
                    })
                    failed += 1
                    continue
                
                # Detect
                emotion = detector.detect_emotion_deepface(image_array)
                results.append({
                    'image_id': image_id,
                    'success': True,
                    **emotion
                })
                successful += 1
            
            except Exception as e:
                logger.error(f"Error processing image {idx}: {e}")
                results.append({
                    'image_id': img_data.get('image_id', f'img_{idx}'),
                    'success': False,
                    'error': str(e)
                })
                failed += 1
        
        processing_time = (time.time() - start_time) * 1000
        
        return jsonify({
            'success': True,
            'data': {
                'batch_id': request_data.get('batch_id', 'batch_auto'),
                'total_images': len(images),
                'successful': successful,
                'failed': failed,
                'results': results,
                'processing_time_ms': round(processing_time, 2)
            }
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Error in batch_detect_emotion: {e}")
        return jsonify({
            'success': False,
            'error': f'Batch detection failed: {str(e)}'
        }), 500


@app.route('/api/v1/analyze', methods=['POST'])
def analyze_features():
    """
    Extract all facial features (emotion + landmarks)
    """
    try:
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({'success': False, 'error': 'Request body required'}), 400
        
        image_base64 = request_data.get('image_base64')
        
        if not image_base64:
            return jsonify({'success': False, 'error': 'image_base64 required'}), 400
        
        # Decode image
        if image_base64.startswith('data:image'):
            image_base64 = image_base64.split(',')[1]
        
        image_data = base64.b64decode(image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        image_array = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image_array is None:
            return jsonify({'success': False, 'error': 'Invalid image'}), 400
        
        # Extract features
        features = detector.extract_features(image_array)
        
        return jsonify({
            'success': True,
            'data': features
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Error in analyze_features: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    
    logger.info(f"🚀 Starting Facial Expression Detection Service on port {port}")
    logger.info(f"📝 Debug mode: {debug}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        threaded=True
    )
