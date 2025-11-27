#!/bin/bash

# Install NVIDIA Canary Qwen 2.5B - MOST ACCURATE model (5.63% WER)

set -e

echo "🎯 Installing NVIDIA Canary Qwen 2.5B"
echo "====================================="
echo ""
echo "Performance: #1 on Hugging Face Open ASR Leaderboard"
echo "Accuracy: 5.63% WER (best in class)"
echo "Speed: 418x real-time"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "📦 Installing NVIDIA NeMo toolkit..."
pip3 install nemo_toolkit['asr']

echo "📦 Installing additional dependencies..."
pip3 install torch torchaudio
pip3 install omegaconf hydra-core transformers

echo ""
echo "✅ Canary Qwen installation complete!"
echo ""
echo "Model details:"
echo "- Name: nvidia/canary-qwen-2.5b"
echo "- Size: ~2.5GB (downloads on first use)"
echo "- Speed: 418x real-time"
echo "- Accuracy: 5.63% WER (🏆 #1 on leaderboard)"
echo "- Features: Transcription + Translation"
echo "- Languages: Multilingual support"
echo ""
echo "First transcription will download the model automatically."
echo ""
echo "Note: GPU recommended for optimal performance"
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. npm run build"
echo "3. npm start"
echo ""
echo "Use Canary for highest accuracy transcription!"
