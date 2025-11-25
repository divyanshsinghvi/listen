#!/bin/bash

# Install Moonshine - Fastest STT model (5-15x faster than Whisper)

set -e

echo "🌙 Installing Moonshine STT Model"
echo "=================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "📦 Installing Moonshine (useful-moonshine)..."
pip3 install useful-moonshine

echo ""
echo "✅ Moonshine installed successfully!"
echo ""
echo "Model details:"
echo "- Package: useful-moonshine"
echo "- Speed: 5-15x faster than Whisper"
echo "- Size: Tiny (~40MB) and Base (~200MB) variants"
echo "- Optimized for edge/mobile devices"
echo "- Backend: Keras (supports PyTorch, TensorFlow, JAX)"
echo ""
echo "First transcription will download the model automatically."
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. npm run build"
echo "3. npm start"
echo ""
