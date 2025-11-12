#!/bin/bash

# Install Moonshine - Fastest STT model (5x faster than Whisper)

set -e

echo "🌙 Installing Moonshine STT Model"
echo "=================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "📦 Installing Moonshine ONNX..."
pip3 install moonshine-onnx

echo "📦 Installing ONNX Runtime..."
pip3 install onnxruntime

echo ""
echo "✅ Moonshine installed successfully!"
echo ""
echo "This is the FASTEST model available:"
echo "- 5x faster than Whisper"
echo "- ~200MB model size"
echo "- Optimized for edge/mobile devices"
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. npm run build"
echo "3. npm start"
echo ""
