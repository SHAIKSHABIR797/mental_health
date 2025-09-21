# Mental Health Companion - Render Deployment Guide

## Files Updated for Deployment

1. **requirements.txt** - Updated with compatible versions and removed problematic dependencies
2. **render.yaml** - Added proper build and start commands
3. **Procfile** - Moved to correct location with proper gunicorn command
4. **runtime.txt** - Specified Python version for Render
5. **app.py** - Optimized for production (removed debug mode, added error handling)
6. **.gitignore** - Added to exclude unnecessary files

## Key Changes Made

- Used `opencv-python-headless` instead of `opencv-python` for better compatibility
- Added proper error handling for missing dependencies
- Set debug=False for production
- Added PORT environment variable support
- Updated all package versions to be compatible

## Deployment Steps

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Connect your repository to Render
3. Render will automatically detect the Python app and use the configuration files
4. The app will be available at the provided Render URL

## Notes

- The app includes fallback mechanisms for when certain dependencies are not available
- Facial analysis will work with mock data if OpenCV fails to load
- All core functionality (text sentiment analysis, recommendations, chatbot) will work regardless
