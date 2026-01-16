FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Set environment variable to use headless mode
ENV OPENCV_VIDEOIO_DEBUG=0
ENV DISPLAY=
ENV LIBGL_ALWAYS_INDIRECT=1

# Install minimal system dependencies for headless OpenCV and MediaPipe
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libgomp1 \
    libgstreamer1.0-0 \
    libgstreamer-plugins-base1.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/* || echo "Some packages may not be available in this Debian version"

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with more lenient versioning
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs uploads models data

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PORT=5000

# Run the application
CMD ["python", "app.py"]