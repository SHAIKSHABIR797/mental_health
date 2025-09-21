#!/usr/bin/env python3
"""
Simple test script to verify the app works locally
"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import app, analyzer
    
    print("✓ App imports successfully")
    
    # Test basic sentiment analysis
    test_text = "I'm feeling really happy today!"
    result = analyzer.analyze_text_sentiment(test_text)
    print(f"✓ Text analysis works: {result}")
    
    # Test recommendations
    analysis = {'text': result}
    recommendations = analyzer.get_mental_health_recommendations(analysis)
    print(f"✓ Recommendations work: {len(recommendations['immediate_actions'])} actions")
    
    print("\n🎉 All tests passed! App is ready for deployment.")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
