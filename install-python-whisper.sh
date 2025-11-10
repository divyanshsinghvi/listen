#!/bin/bash

# Alternative setup script using Python Whisper instead of whisper.cpp

set -e

echo "🎙️  Setting up Listen with Python Whisper"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
    echo "❌ pip is not installed. Please install pip."
    exit 1
fi

echo "📦 Installing Python Whisper..."
pip3 install -U openai-whisper

echo "📦 Installing ffmpeg (required for Whisper)..."
if command -v apt-get &> /dev/null; then
    echo "Detected Debian/Ubuntu - installing ffmpeg..."
    sudo apt-get update && sudo apt-get install -y ffmpeg
elif command -v dnf &> /dev/null; then
    echo "Detected Fedora - installing ffmpeg..."
    sudo dnf install -y ffmpeg
elif command -v pacman &> /dev/null; then
    echo "Detected Arch - installing ffmpeg..."
    sudo pacman -S --noconfirm ffmpeg
else
    echo "⚠️  Could not detect package manager. Please install ffmpeg manually."
fi

echo ""
echo "✅ Python Whisper installed!"
echo ""
echo "The first time you run the app, it will download the 'base' model (~150MB)."
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. npm run build"
echo "3. npm start"
echo ""
echo "Press Ctrl+Shift+Space to activate voice input anywhere!"
