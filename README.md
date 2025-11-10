# Listen - Voice-to-Text Overlay App

A system-wide voice-to-text overlay app inspired by WhisperFlow, allowing you to speak instead of typing anywhere on your system.

## Features

- 🎙️ System-wide voice recording with global hotkey
- 🤖 Whisper-powered speech-to-text transcription
- 📋 Automatic text insertion via clipboard
- 🪟 Always-on-top overlay window
- ⚡ Fast and responsive

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install a local Whisper implementation (choose one):

   **Option A: whisper.cpp (Recommended - Fast & Lightweight)**
   ```bash
   # Clone and build whisper.cpp
   git clone https://github.com/ggerganov/whisper.cpp
   cd whisper.cpp
   make
   sudo cp main /usr/local/bin/whisper-cpp

   # Download a model (tiny, base, small, medium, or large)
   bash ./models/download-ggml-model.sh base
   mkdir -p ../models
   cp models/ggml-base.bin ../models/
   ```

   **Option B: Python Whisper**
   ```bash
   pip install openai-whisper
   ```

   **Option C: faster-whisper (Optimized)**
   ```bash
   pip install faster-whisper
   ```

3. Build and run:
```bash
npm run build
npm start
```

Or run in development mode:
```bash
npm run dev
```

## Usage

1. Press `Ctrl+Shift+Space` to activate the overlay
2. Speak your text
3. Press `Ctrl+Shift+Space` again to stop recording
4. The transcribed text will be automatically copied to clipboard
5. Paste (Ctrl+V) in any application

## Keyboard Shortcuts

- `Ctrl+Shift+Space` - Start/Stop recording
- `Esc` - Cancel recording and close overlay

## Configuration

Edit the settings in the app to customize:
- Hotkey combination
- Whisper model selection
- Audio quality settings

## Requirements

- Node.js 18+
- One of: whisper.cpp, Python whisper, or faster-whisper (local models, no API needed)
- Audio recording: `arecord` (ALSA) or `sox` on Linux

## License

MIT
