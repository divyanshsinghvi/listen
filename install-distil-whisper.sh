#!/bin/bash

# Install Distil-Whisper - 6x faster than Whisper with same accuracy

set -e

echo "⚡ Installing Distil-Whisper STT Model"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "📦 Installing transformers and dependencies..."
pip3 install transformers torch torchaudio accelerate

echo "📦 Downloading model (first run will cache the model)..."
python3 -c "
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor
model_id = 'distil-whisper/distil-small.en'
print('Downloading Distil-Whisper model...')
model = AutoModelForSpeechSeq2Seq.from_pretrained(model_id)
processor = AutoProcessor.from_pretrained(model_id)
print('Model downloaded and cached!')
"

echo ""
echo "✅ Distil-Whisper installed successfully!"
echo ""
echo "Model details:"
echo "- 6x faster than standard Whisper"
echo "- Same accuracy as Whisper base"
echo "- Model: distil-small.en (~250MB)"
echo ""
echo "Available models:"
echo "- distil-small.en (fastest, good accuracy)"
echo "- distil-medium.en (slower, better accuracy)"
echo "- distil-large-v3 (best accuracy, slowest)"
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. npm run build"
echo "3. npm start"
echo ""
