# Coqui TTS Server Setup

This is a free, open-source Text-to-Speech server using Coqui TTS for high-quality voice generation.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation Steps

### 1. Install Python Dependencies

```bash
cd tts-server
pip install TTS flask flask-cors
```

### 2. Start the TTS Server

```bash
python tts_server.py
```

The server will start on `http://localhost:5000`

### 3. Update Frontend Configuration

The frontend is already configured to use this TTS server. Make sure the server is running before using voice features.

## How It Works

1. Frontend sends text to TTS server
2. Server generates audio using Coqui TTS
3. Server returns audio file URL
4. Frontend plays the audio

## Available Voices

Coqui TTS provides multiple high-quality voices. The default configuration uses:
- **Model**: `tts_models/en/ljspeech/tacotron2-DDC`
- **Vocoder**: `vocoder_models/en/ljspeech/hifigan_v2`

You can change to other models for different voice characteristics.

## Troubleshooting

### Server won't start
- Make sure Python 3.8+ is installed: `python --version`
- Install dependencies: `pip install TTS flask flask-cors`

### Audio quality issues
- Try different Coqui TTS models (see TTS documentation)
- Adjust audio settings in `tts_server.py`

### CORS errors
- Make sure flask-cors is installed
- Check that server is running on port 5000

## Alternative: Use Google Cloud TTS (Paid)

If you prefer cloud-based TTS with even better quality:
1. Get Google Cloud TTS API key
2. Update frontend to use Google Cloud TTS instead
3. See `src/utils/voicePrompts.ts` for integration points
