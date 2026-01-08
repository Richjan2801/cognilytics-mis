"""
Facial Expression Detection Service Setup
Initializes and configures the service
"""

import os
import sys
from pathlib import Path

def setup_environment():
    """Set up environment variables"""
    env_file = Path(__file__).parent / '.env'
    if not env_file.exists():
        with open(env_file, 'w') as f:
            f.write("""# Facial Expression Detection Service Configuration
PORT=5000
DEBUG=False
FLASK_ENV=production

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/fed_service.log
""")
        print(f"✓ Created .env file at {env_file}")
    
    # Load .env file
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    key, value = line.split('=', 1)
                    os.environ[key] = value

def setup_directories():
    """Create necessary directories"""
    directories = ['logs', 'uploads', 'models', 'data']
    for directory in directories:
        dir_path = Path(__file__).parent / directory
        dir_path.mkdir(exist_ok=True)
    print(f"✓ Created necessary directories")

def check_dependencies():
    """Check if all required dependencies are installed"""
    required = {
        'flask': 'Flask',
        'cv2': 'opencv-python',
        'numpy': 'numpy'
    }
    
    optional = {
        'deepface': 'deepface',
        'mediapipe': 'mediapipe'
    }
    
    missing_required = []
    missing_optional = []
    
    print("\nDependency Check:")
    print("-" * 40)
    
    for module, package in required.items():
        try:
            __import__(module)
            print(f"✓ {package}")
        except ImportError:
            missing_required.append(package)
            print(f"✗ {package} (REQUIRED)")
    
    for module, package in optional.items():
        try:
            __import__(module)
            print(f"✓ {package}")
        except ImportError:
            missing_optional.append(package)
            print(f"⚠ {package} (Optional - some features disabled)")
    
    if missing_required:
        print(f"\n❌ Missing required packages: {', '.join(missing_required)}")
        print("Install with: pip install -r requirements.txt")
        return False
    
    if missing_optional:
        print(f"\n⚠️  Missing optional packages: {', '.join(missing_optional)}")
        print("Some features will be disabled. Install with: pip install -r requirements.txt")
    
    return True

def main():
    """Run setup"""
    print("""
    ╔═══════════════════════════════════════════════════════╗
    ║  Facial Expression Detection Service - Setup         ║
    ╚═══════════════════════════════════════════════════════╝
    """)
    
    # Set up environment
    setup_environment()
    
    # Set up directories
    setup_directories()
    
    # Check dependencies
    if check_dependencies():
        print("\n✓ Setup completed successfully!")
        print("\nTo start the service, run:")
        print("  python app.py")
    else:
        print("\n❌ Setup failed. Please install missing dependencies.")
        sys.exit(1)

if __name__ == '__main__':
    main()
