#!/bin/bash

# Install NVIDIA Parakeet TDT - FASTEST STT model (3,333x real-time!)

set -e

echo "🚀 Installing NVIDIA Parakeet TDT 0.6B v3"
echo "========================================"
echo ""
echo "Performance: 3,333x real-time (transcribes 1 hour in 1 second!)"
echo "Accuracy: 6.32% WER"
echo "Languages: 25 European languages"
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
pip3 install omegaconf hydra-core

echo ""
echo "✅ Parakeet TDT installation complete!"
echo ""
echo "Model details:"
echo "- Name: nvidia/parakeet-tdt-0.6b-v3"
echo "- Size: ~600MB (downloads on first use)"
echo "- Speed: 3,333x real-time 🔥"
echo "- Accuracy: 6.32% WER (excellent)"
echo "- Languages: 25 (en, de, fr, es, it, pt, pl, nl, ro, cs, sk, bg, hr, sl, sr, mk, uk, be, et, lv, lt, mt, ga, cy)"
echo ""
echo "First transcription will download the model automatically."
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. npm run build"
echo "3. npm start"
echo ""
echo "Parakeet will be auto-selected for maximum speed!"
