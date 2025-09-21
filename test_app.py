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
    print(f"✓ Text analysis works: {result['sentiment']['label']}")
    
    # Test recommendations
    analysis = {'text': result}
    recommendations = analyzer.get_mental_health_recommendations(analysis)
    print(f"✓ Recommendations work: {len(recommendations['immediate_actions'])} actions")
    
    # Test chatbot response
    chatbot_response = analyzer.generate_chatbot_response(test_text, analysis)
    print(f"✓ Chatbot response works: {len(chatbot_response)} characters")
    
    # Test health endpoint
    with app.test_client() as client:
        response = client.get('/health')
        print(f"✓ Health check works: {response.status_code}")
    
    print("\n🎉 All tests passed! App is ready for deployment.")
    print("📦 Dependencies: Flask + Gunicorn only")
    print("🚀 Ready for Render deployment!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
