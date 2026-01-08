# Facial Expression Detection Service

A Python-based microservice that detects facial expressions and maps them to cognitive load indicators using computer vision and machine learning.

## Features

- **Real-time Facial Expression Detection**: Detects emotions and facial features from images
- **Cognitive Load Mapping**: Maps facial expressions to cognitive load indices (0-1 scale)
- **Micro-expression Analysis**: Uses MediaPipe for detailed facial landmark analysis
- **Batch Processing**: Process multiple images at once with aggregate statistics
- **User Calibration**: Establishes baseline expressions for individual users
- **Stress Indicators**: Identifies stress patterns and cognitive overload markers

## Technology Stack

- **Flask**: Lightweight web framework for API endpoints
- **OpenCV**: Computer vision and image processing
- **DeepFace**: Emotion recognition and facial analysis
- **MediaPipe**: Facial landmark detection for micro-expressions
- **NumPy**: Numerical computations

## Installation

### Prerequisites

- Python 3.8+
- pip (Python package manager)
- Webcam/Camera (for real-time detection)

### Setup

1. Navigate to the service directory:
```bash
cd facial_expression_detection
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Run setup script:
```bash
python setup.py
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

### Development Mode

```bash
python app.py
```

The service will start on `http://localhost:5000`

### Production Mode

```bash
export FLASK_ENV=production
export DEBUG=False
python app.py
```

## API Endpoints

### Health Check

```
GET /health

Response:
{
  "status": "healthy",
  "service": "Facial Expression Detection Service",
  "deepface_available": true,
  "mediapipe_available": true,
  "timestamp": "2024-01-08T12:00:00.000Z"
}
```

### Detect Expression from Single Image

```
POST /api/v1/detect

Request Body:
{
  "image_base64": "<base64_encoded_image>",
  "user_id": "user-uuid",
  "session_id": "session-uuid"
}

Response:
{
  "success": true,
  "data": {
    "user_id": "user-uuid",
    "session_id": "session-uuid",
    "detection_result": {
      "timestamp": "2024-01-08T12:00:00.000Z",
      "face_detected": true,
      "expression": {
        "emotions": {...},
        "dominant_emotion": "neutral",
        "confidence": 0.95
      },
      "landmarks": {
        "eye_openness": 0.3,
        "mouth_openness": 0.2,
        "brow_height": 0.5
      },
      "cognitive_load_estimate": 0.52
    }
  }
}
```

### Batch Process Multiple Images

```
POST /api/v1/batch

Request Body:
{
  "images": [
    {
      "image_base64": "<base64>",
      "timestamp": "2024-01-08T12:00:00Z"
    },
    ...
  ],
  "user_id": "user-uuid",
  "session_id": "session-uuid"
}

Response:
{
  "success": true,
  "data": {
    "user_id": "user-uuid",
    "session_id": "session-uuid",
    "results": [...],
    "aggregate": {
      "total_frames": 10,
      "faces_detected": 10,
      "average_cognitive_load": 0.55,
      "max_cognitive_load": 0.78,
      "min_cognitive_load": 0.32
    }
  }
}
```

### Calibrate User

```
POST /api/v1/calibrate

Request Body:
{
  "user_id": "user-uuid",
  "images": ["<base64_1>", "<base64_2>", ..., "<base64_n>"]
}

Response:
{
  "success": true,
  "data": {
    "user_id": "user-uuid",
    "calibration_samples": 5,
    "baseline_metrics": {
      "avg_cl": 0.48,
      "faces_detected": 5
    }
  }
}
```

## Integration with Backend

The service communicates with the CogniLytics MIS Backend through HTTP endpoints:

### Backend Configuration

Add to `.env`:
```
FED_SERVICE_HOST=http://localhost:5000
FED_SERVICE_TIMEOUT=30000
```

### Backend Usage

```javascript
import { fedClient } from './services/facial-expression-detection.service.js';

// Detect expression
const result = await fedClient.detectExpression(imageBase64, userId, sessionId);

// Batch detection
const batchResult = await fedClient.detectBatch(images, userId, sessionId);

// Calibrate user
const calibration = await fedClient.calibrateUser(userId, imageArray);
```

## Cognitive Load Mapping

The service maps facial expressions to cognitive load indices:

| Expression | CL Index | Meaning |
|-----------|----------|---------|
| Happy | 0.2 | Low stress, engaged |
| Neutral | 0.5 | Normal state |
| Surprise | 0.55 | Slight engagement |
| Sad | 0.6 | Moderate stress |
| Disgust | 0.65 | Higher stress |
| Anger | 0.7 | Significant stress |
| Fear | 0.75 | High stress, anxiety |

Additional modifiers based on:
- **Eye Openness**: Closed eyes indicate fatigue/stress
- **Brow Height**: Lowered brows indicate concentration/stress
- **Mouth Position**: Can indicate surprise, stress, or concentration

## Database Schema

The backend stores facial expression data:

```sql
-- Individual detections
CREATE TABLE facial_expression_data (
  id SERIAL PRIMARY KEY,
  session_id UUID,
  user_id UUID,
  expression_data JSONB,
  cognitive_load FLOAT,
  detected_at TIMESTAMP
);

-- Batch analysis
CREATE TABLE facial_expression_batch_data (
  id SERIAL PRIMARY KEY,
  session_id UUID,
  user_id UUID,
  batch_data JSONB,
  average_cognitive_load FLOAT,
  stress_indicators JSONB,
  recorded_at TIMESTAMP
);

-- User calibration
CREATE TABLE user_calibration_data (
  user_id UUID PRIMARY KEY,
  calibration_data JSONB,
  calibrated_at TIMESTAMP
);
```

## Performance Considerations

- **Image Size**: Optimal size is 640x480 or similar. Larger images take longer to process
- **Batch Size**: Recommended batch size is 5-20 images for optimal performance
- **Timeout**: Default timeout is 30 seconds per request
- **Memory**: Requires 2GB+ RAM for optimal performance with DeepFace

## Troubleshooting

### Issue: "Camera not accessible"
- Ensure webcam is connected and accessible
- Check camera permissions in OS settings
- Close other applications using the camera

### Issue: "ModuleNotFoundError"
- Reinstall dependencies: `pip install -r requirements.txt`
- Ensure virtual environment is activated

### Issue: Low detection accuracy
- Ensure adequate lighting in the environment
- Perform user calibration for better accuracy
- Use higher quality images

### Issue: Slow processing
- Reduce image size
- Reduce batch size
- Enable GPU acceleration if available

## Configuration

Environment variables in `.env`:

```
# Server
PORT=5000
DEBUG=False
FLASK_ENV=production

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/fed_service.log
```

## Development

### Running Tests

```bash
python -m pytest tests/
```

### Code Style

```bash
# Format with Black
black .

# Lint with Flake8
flake8 .
```

## Performance Metrics

- **Single Image Detection**: ~100-300ms (depends on face complexity)
- **Batch Processing**: ~50ms per image (average)
- **API Response Time**: <500ms (with FED latency included)
- **Accuracy**: ~85% for emotion detection, ~95% for face detection

## Future Enhancements

- [ ] GPU acceleration support
- [ ] Real-time video stream processing
- [ ] Demographic analysis
- [ ] Multiple face tracking
- [ ] Emotion transition analysis
- [ ] Fatigue and sleepiness detection
- [ ] User preferences and privacy controls

## License

ISC

## Support

For issues or questions, please contact the development team or create an issue in the main repository.
