#!/bin/bash

# Setup script for Listen app - installs whisper.cpp and model

set -e

echo "🎙️  Setting up Listen - Voice-to-Text App"
echo "========================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Check if make is installed
if ! command -v make &> /dev/null; then
    echo "❌ Make is not installed. Please install build-essential (Ubuntu/Debian) or build-tools."
    exit 1
fi

# Check for audio recording tools
echo "📝 Checking audio recording tools..."
if ! command -v arecord &> /dev/null && ! command -v rec &> /dev/null; then
    echo "⚠️  Warning: No audio recording tool found (arecord or sox)."
    echo "   Install one of the following:"
    echo "   - Ubuntu/Debian: sudo apt-get install alsa-utils"
    echo "   - Or install sox: sudo apt-get install sox"
    echo ""
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "📦 Cloning whisper.cpp..."
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp

echo "🔨 Building whisper.cpp..."
make

echo "📥 Downloading Whisper base model..."
bash ./models/download-ggml-model.sh base

echo "📁 Installing to system..."
# Try to install to /usr/local/bin, fall back to ~/.local/bin if no sudo
if [ -w /usr/local/bin ]; then
    cp main /usr/local/bin/whisper-cpp
    echo "✅ Installed whisper-cpp to /usr/local/bin"
else
    mkdir -p ~/.local/bin
    cp main ~/.local/bin/whisper-cpp
    echo "✅ Installed whisper-cpp to ~/.local/bin"
    echo "⚠️  Make sure ~/.local/bin is in your PATH"
    echo "   Add to ~/.bashrc or ~/.zshrc: export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

# Copy model to Listen project
echo "📦 Installing model..."
cd "$OLDPWD"
mkdir -p models
cp "$TEMP_DIR/whisper.cpp/models/ggml-base.bin" models/

# Cleanup
echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. npm run build"
echo "3. npm start"
echo ""
echo "Press Ctrl+Shift+Space to activate voice input anywhere!"
