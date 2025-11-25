#!/bin/bash

# Install NVIDIA Parakeet TDT - FASTEST STT model (3,333x real-time!)
# Fixed for WSL2/Ubuntu system package conflicts

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

# Use --user to avoid system package conflicts
export PIP_USER=1

echo "📦 Upgrading pip (user installation)..."
pip3 install --user --upgrade pip

echo "📦 Installing PyTorch (GPU/CUDA version)..."
pip3 install --user torch torchaudio --index-url https://download.pytorch.org/whl/cu121

echo "📦 Installing Cython..."
pip3 install --user Cython

echo "📦 Installing NeMo ASR (this will take several minutes)..."
# Install NeMo directly without trying to resolve all dependencies at once
pip3 install --user nemo_toolkit[asr]

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
echo "⚠️  Important: Make sure ~/.local/bin is in your PATH"
echo "Add to ~/.bashrc if needed:"
echo 'export PATH="$HOME/.local/bin:$PATH"'
echo ""
echo "First transcription will download the model automatically."
echo ""
echo "Next steps:"
echo "1. source ~/.bashrc  # If you added PATH"
echo "2. npm install"
echo "3. npm run build"
echo "4. npm start"
echo ""
echo "Parakeet will be auto-selected for maximum speed!"
