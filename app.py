from flask import Flask, render_template, request, jsonify
import numpy as np
import base64
import io
from PIL import Image
from datetime import datetime
import os

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("OpenCV not available, facial analysis will be limited")

try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("Transformers not available, using basic sentiment analysis")

app = Flask(__name__)

# Mental Health Analyzer class
class MentalHealthAnalyzer:
    def __init__(self):
        self.setup_models()
        self.conversation_history = []
        self.user_profile = {
            'mood_history': [],
            'stress_levels': [],
            'recommendations_given': []
        }

    def setup_models(self):
        if TRANSFORMERS_AVAILABLE:
            try:
                self.text_analyzer = pipeline("sentiment-analysis")
                print("✓ Loaded transformers sentiment pipeline")
            except Exception as e:
                print(f"Error loading transformers pipeline: {e}")
                self.text_analyzer = None
        else:
            self.text_analyzer = None

    def analyze_text_sentiment(self, text):
        try:
            if self.text_analyzer:
                result = self.text_analyzer(text)
                if isinstance(result, list) and result:
                    sentiment = result[0]
                else:
                    sentiment = {'label': 'NEUTRAL', 'score': 0.5}
                return {
                    'sentiment': sentiment,
                    'confidence': sentiment['score']
                }
            else:
                return self.basic_sentiment_analysis(text)
        except Exception as e:
            print(f"Error in text sentiment analysis: {e}")
            return self.basic_sentiment_analysis(text)

    def basic_sentiment_analysis(self, text):
        positive_words = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'joy', 'excited', 'fantastic']
        negative_words = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'depressed', 'anxious', 'worried', 'stressed']
        text_lower = text.lower()
        pos_count = sum(1 for w in positive_words if w in text_lower)
        neg_count = sum(1 for w in negative_words if w in text_lower)

        if pos_count > neg_count:
            return {'sentiment': {'label': 'POSITIVE', 'score': 0.7}, 'confidence': 0.7}
        elif neg_count > pos_count:
            return {'sentiment': {'label': 'NEGATIVE', 'score': 0.7}, 'confidence': 0.7}
        else:
            return {'sentiment': {'label': 'NEUTRAL', 'score': 0.5}, 'confidence': 0.5}

    def analyze_facial_emotion(self, image_data):
        try:
            if not CV2_AVAILABLE:
                # Fallback when OpenCV is not available
                emotions = {
                    'happy': np.random.uniform(0.1, 0.9),
                    'sad': np.random.uniform(0.1, 0.9),
                    'angry': np.random.uniform(0.1, 0.9),
                    'fear': np.random.uniform(0.1, 0.9),
                    'surprise': np.random.uniform(0.1, 0.9),
                    'neutral': np.random.uniform(0.1, 0.9)
                }
                total = sum(emotions.values())
                emotions = {k: v / total for k, v in emotions.items()}
                dominant = max(emotions, key=emotions.get)
                return {
                    'faces_detected': 1,  # Assume face detected for demo
                    'emotions': emotions,
                    'dominant_emotion': dominant,
                    'confidence': emotions[dominant],
                    'note': 'OpenCV not available, using mock analysis'
                }
            
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(io.BytesIO(image_bytes))
            image_np = np.array(image)
            gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)

            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)

            if len(faces) > 0:
                # Mock emotion scores for demo
                emotions = {
                    'happy': np.random.uniform(0.1, 0.9),
                    'sad': np.random.uniform(0.1, 0.9),
                    'angry': np.random.uniform(0.1, 0.9),
                    'fear': np.random.uniform(0.1, 0.9),
                    'surprise': np.random.uniform(0.1, 0.9),
                    'neutral': np.random.uniform(0.1, 0.9)
                }
                total = sum(emotions.values())
                emotions = {k: v / total for k, v in emotions.items()}
                dominant = max(emotions, key=emotions.get)
                return {
                    'faces_detected': len(faces),
                    'emotions': emotions,
                    'dominant_emotion': dominant,
                    'confidence': emotions[dominant]
                }
            else:
                return {
                    'faces_detected': 0,
                    'emotions': {},
                    'dominant_emotion': 'neutral',
                    'confidence': 0.0
                }
        except Exception as e:
            print(f"Error facial emotion analysis: {e}")
            return {
                'faces_detected': 0,
                'emotions': {},
                'dominant_emotion': 'neutral',
                'confidence': 0.0,
                'error': str(e)
            }

    def analyze_voice_emotion(self, audio_data):
        try:
            # Placeholder mock emotions
            emotions = {
                'calm': np.random.uniform(0.1, 0.8),
                'stressed': np.random.uniform(0.1, 0.8),
                'happy': np.random.uniform(0.1, 0.8),
                'sad': np.random.uniform(0.1, 0.8),
                'anxious': np.random.uniform(0.1, 0.8)
            }
            total = sum(emotions.values())
            emotions = {k: v / total for k, v in emotions.items()}
            dominant = max(emotions, key=emotions.get)
            return {
                'emotions': emotions,
                'dominant_emotion': dominant,
                'confidence': emotions[dominant]
            }
        except Exception as e:
            print(f"Error voice emotion analysis: {e}")
            return {
                'emotions': {},
                'dominant_emotion': 'neutral',
                'confidence': 0.0,
                'error': str(e)
            }

    def get_mental_health_recommendations(self, analysis):
        text_sentiment = analysis.get('text', {}).get('sentiment', {}).get('label', 'NEUTRAL')
        facial_emotion = analysis.get('facial', {}).get('dominant_emotion', 'neutral')
        voice_emotion = analysis.get('voice', {}).get('dominant_emotion', 'neutral')

        recommendations = {
            'immediate_actions': [],
            'resources': [],
            'activities': [],
            'professional_help': []
        }

        negative_text_sentiments = ['NEGATIVE']
        negative_facial_emotions = ['sad', 'angry', 'fear']
        negative_voice_emotions = ['stressed', 'sad', 'anxious']

        negative_indicators = 0
        if text_sentiment in negative_text_sentiments:
            negative_indicators += 1
        if facial_emotion in negative_facial_emotions:
            negative_indicators += 1
        if voice_emotion in negative_voice_emotions:
            negative_indicators += 1

        if negative_indicators >= 2:
            recommendations['immediate_actions'] = [
                "Take 5 deep breaths - inhale for 4 counts, hold for 4, exhale for 6",
                "Step away from your current environment for a few minutes",
                "Practice grounding: name 5 things you can see, 4 you can touch, 3 you can hear"
            ]
            recommendations['activities'] = [
                "Try a 10-minute guided meditation",
                "Go for a short walk outside",
                "Listen to calming music",
                "Write in a journal about your feelings",
                "Call a friend or family member"
            ]
            recommendations['resources'] = [
                "Crisis Text Line: Text HOME to 741741",
                "National Suicide Prevention Lifeline: 988",
                "Headspace app for meditation",
                "Calm app for sleep and relaxation"
            ]
            if negative_indicators == 3:
                recommendations['professional_help'] = [
                    "Consider speaking with a mental health professional",
                    "Contact your primary care doctor",
                    "Look into online therapy platforms like BetterHelp or Talkspace"
                ]
        elif negative_indicators == 1:
            recommendations['immediate_actions'] = [
                "Take a moment to acknowledge your feelings",
                "Practice self-compassion"
            ]
            recommendations['activities'] = [
                "Engage in a hobby you enjoy",
                "Practice gratitude - list 3 things you're thankful for",
                "Do some light exercise or stretching"
            ]
        else:
            recommendations['immediate_actions'] = [
                "Keep up the positive momentum!",
                "Share your good mood with others"
            ]
            recommendations['activities'] = [
                "Try something new today",
                "Help someone else - volunteer or do a kind act",
                "Set a small goal for tomorrow"
            ]

        return recommendations

    def generate_chatbot_response(self, user_message, analysis):
        text_sentiment = analysis.get('text', {}).get('sentiment', {}).get('label', 'NEUTRAL')

        responses = {
            'NEGATIVE': [
                "I can sense that you're going through a difficult time right now. Your feelings are valid, and it's okay to not be okay.",
                "It sounds like you're dealing with some challenging emotions. Remember that this feeling is temporary, and you're stronger than you know.",
                "I hear that you're struggling. Would you like to talk about what's bothering you, or would you prefer some coping strategies?"
            ],
            'POSITIVE': [
                "I'm glad to hear some positivity in your message! It's wonderful when we can find moments of joy or contentment.",
                "Your positive energy is noticeable! How can we build on this good feeling?",
                "It's great to connect with you when you're feeling good. What's contributing to your positive mood today?"
            ],
            'NEUTRAL': [
                "Thank you for sharing with me. I'm here to listen and support you however I can.",
                "I appreciate you taking the time to check in. How are you feeling right now?",
                "I'm here for you. Is there anything specific you'd like to talk about or explore today?"
            ]
        }

        import random
        base_response = random.choice(responses.get(text_sentiment, responses['NEUTRAL']))

        if analysis.get('facial', {}).get('faces_detected', 0) > 0:
            facial_emotion = analysis['facial']['dominant_emotion']
            if facial_emotion in ['sad', 'angry', 'fear']:
                base_response += f" I also notice from your expression that you might be feeling {facial_emotion}."

        return base_response

# Initialize analyzer instance
analyzer = MentalHealthAnalyzer()

@app.route('/')
def index():
    return render_template('index.html')  # Make sure you have an index.html in templates/

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        message = data.get('message', '')
        image_data = data.get('image', '')
        audio_data = data.get('audio', '')

        analysis_results = {}

        if message:
            analysis_results['text'] = analyzer.analyze_text_sentiment(message)

        if image_data:
            analysis_results['facial'] = analyzer.analyze_facial_emotion(image_data)

        if audio_data:
            analysis_results['voice'] = analyzer.analyze_voice_emotion(audio_data)

        recommendations = analyzer.get_mental_health_recommendations(analysis_results)
        chatbot_response = analyzer.generate_chatbot_response(message, analysis_results)

        # Store conversation
        analyzer.conversation_history.append({
            'timestamp': datetime.now().isoformat(),
            'user_message': message,
            'analysis': analysis_results,
            'bot_response': chatbot_response
        })

        return jsonify({
            'success': True,
            'analysis': analysis_results,
            'recommendations': recommendations,
            'chatbot_response': chatbot_response,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/history')
def get_history():
    return jsonify({
        'conversation_history': analyzer.conversation_history[-10:],  # last 10 entries
        'user_profile': analyzer.user_profile
    })

@app.route('/emergency')
def emergency_resources():
    return jsonify({
        'crisis_resources': [
            {
                'name': 'National Suicide Prevention Lifeline',
                'contact': '988',
                'description': '24/7 crisis support'
            },
            {
                'name': 'Crisis Text Line',
                'contact': 'Text HOME to 741741',
                'description': 'Free 24/7 crisis support via text'
            },
            {
                'name': 'SAMHSA National Helpline',
                'contact': '1-800-662-4357',
                'description': 'Treatment referral and information service'
            }
        ],
        'immediate_coping': [
            'Call emergency services (911) if in immediate danger',
            'Reach out to a trusted friend or family member',
            'Go to your nearest emergency room',
            'Contact your mental health provider'
        ]
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
