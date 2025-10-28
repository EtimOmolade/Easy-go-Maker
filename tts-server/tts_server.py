#!/usr/bin/env python3
"""
Coqui TTS Server for SpiritConnect
Provides high-quality text-to-speech conversion using free, open-source Coqui TTS
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import hashlib
from TTS.api import TTS

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Initialize TTS model
# Using a good quality English model
print("Loading TTS model... (this may take a minute on first run)")
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
print("TTS model loaded successfully!")

# Directory to store generated audio files
AUDIO_DIR = os.path.join(os.path.dirname(__file__), 'audio_cache')
os.makedirs(AUDIO_DIR, exist_ok=True)

def get_audio_filename(text):
    """Generate a unique filename based on text content"""
    text_hash = hashlib.md5(text.encode()).hexdigest()
    return f"{text_hash}.wav"

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "TTS server is running"})

@app.route('/synthesize', methods=['POST'])
def synthesize():
    """
    Synthesize speech from text
    Expects JSON: {"text": "text to speak"}
    Returns: Audio file
    """
    data = request.get_json()

    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400

    text = data['text']

    if not text.strip():
        return jsonify({"error": "Empty text provided"}), 400

    # Generate filename based on text hash (cache mechanism)
    filename = get_audio_filename(text)
    filepath = os.path.join(AUDIO_DIR, filename)

    # Generate audio if not cached
    if not os.path.exists(filepath):
        print(f"Generating audio for: {text[:50]}...")
        try:
            tts.tts_to_file(text=text, file_path=filepath)
            print(f"Audio generated: {filename}")
        except Exception as e:
            print(f"Error generating audio: {str(e)}")
            return jsonify({"error": f"TTS generation failed: {str(e)}"}), 500
    else:
        print(f"Using cached audio: {filename}")

    # Return audio file
    return send_file(filepath, mimetype='audio/wav')

@app.route('/synthesize_url', methods=['POST'])
def synthesize_url():
    """
    Synthesize speech and return URL instead of file
    Expects JSON: {"text": "text to speak"}
    Returns: {"audio_url": "/audio/<hash>.wav"}
    """
    data = request.get_json()

    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400

    text = data['text']

    if not text.strip():
        return jsonify({"error": "Empty text provided"}), 400

    # Generate filename based on text hash
    filename = get_audio_filename(text)
    filepath = os.path.join(AUDIO_DIR, filename)

    # Generate audio if not cached
    if not os.path.exists(filepath):
        print(f"Generating audio for: {text[:50]}...")
        try:
            tts.tts_to_file(text=text, file_path=filepath)
            print(f"Audio generated: {filename}")
        except Exception as e:
            print(f"Error generating audio: {str(e)}")
            return jsonify({"error": f"TTS generation failed: {str(e)}"}), 500
    else:
        print(f"Using cached audio: {filename}")

    # Return URL to audio file
    audio_url = f"http://localhost:5000/audio/{filename}"
    return jsonify({"audio_url": audio_url})

@app.route('/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    """Serve cached audio files"""
    filepath = os.path.join(AUDIO_DIR, filename)

    if not os.path.exists(filepath):
        return jsonify({"error": "Audio file not found"}), 404

    return send_file(filepath, mimetype='audio/wav')

@app.route('/clear_cache', methods=['POST'])
def clear_cache():
    """Clear all cached audio files"""
    try:
        files = os.listdir(AUDIO_DIR)
        for file in files:
            if file.endswith('.wav'):
                os.remove(os.path.join(AUDIO_DIR, file))
        return jsonify({"message": f"Cleared {len(files)} cached files"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("SpiritConnect TTS Server")
    print("=" * 60)
    print("Server starting on http://localhost:5000")
    print("Press Ctrl+C to stop")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=False)
