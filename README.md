# Listen - Voice-to-Text App

A multi-platform voice-to-text app with intelligent model routing, allowing you to speak instead of typing.

## Features

- 🎙️ **System-wide voice recording** (Desktop) / **One-tap recording** (Mobile)
- 🤖 **Multiple SOTA STT models** with automatic selection:
  - **Moonshine** (5-15x faster, optimized for edge devices)
  - **Distil-Whisper** (6x faster, excellent accuracy)
  - Faster-Whisper, Whisper.cpp, Python Whisper
- 🧠 **Intelligent model routing** - Auto-selects best model for your needs
- 📋 Automatic clipboard copy
- 🪟 Always-on-top overlay (Desktop)
- 📱 **Native iOS (Swift + WhisperKit)** and **Android (Kotlin + TFLite)** apps
- 🔒 **100% offline** - All processing on-device, no cloud services
- ⚡ Ultra-fast transcription (up to 15x real-time)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install an STT model (choose one or more):

   ### 🔥 **UNDER 1B Parameters** (Recommended - Edge-optimized)

   **Option A: Parakeet TDT v3 (FASTEST)**
   ```bash
   ./install-parakeet.sh  # 600M params, 6.32% WER, 25 languages, ultra-fast inference
   ```

   **Option B: Moonshine (Mobile-optimized)**
   ```bash
   ./install-moonshine.sh  # 40-200M params, 5-15x real-time
   ```

   **Option C: Distil-Whisper (Best for English)**
   ```bash
   ./install-distil-whisper.sh  # 244M params, 6x real-time
   ```

   **Option D: Faster-Whisper (Good balance)**
   ```bash
   pip install faster-whisper  # 74M params, 4x real-time
   ```

   **Option E: whisper.cpp (C++ implementation)**
   ```bash
   ./setup-whisper.sh  # 74M params, 2x real-time
   ```

   **Option F: Python Whisper (Fallback)**
   ```bash
   ./install-python-whisper.sh  # 74M params, baseline
   ```

   ### 🎯 **OVER 1B Parameters** (Optional - Maximum accuracy)

   **Option G: Canary Qwen 2.5B (#1 Accuracy)**
   ```bash
   ./install-canary.sh  # 2.5B params, 5.63% WER, 418x real-time
   ```

   > **Note:** The app will automatically use the fastest available model. Install multiple models for automatic fallback. **Only models you install will be used.**

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

## Model Selection & Routing

Listen uses an **intelligent routing system** that automatically selects the best available model based on your requirements.

**Recommended Models:**
- **Desktop (English)**: Distil-Whisper Small (6x faster, excellent accuracy)
- **Desktop (Multilingual)**: Moonshine Base (5-15x faster, good accuracy)
- **Mobile (iOS/Android)**: Moonshine Tiny (ultra-fast, only 40MB)

See [MODEL_COMPARISON.md](./MODEL_COMPARISON.md) for detailed benchmarks and comparisons.

## Platform Support

- ✅ **Linux** (Desktop - Electron)
- ✅ **iOS 16+** (Native Swift app) - See [mobile/ios/README.md](./mobile/ios/README.md)
- ✅ **Android 7+** (Native Kotlin app) - See [mobile/android/README.md](./mobile/android/README.md)
- 🔜 macOS (Desktop - Coming soon)
- ✅ Windows (Desktop - Initial support)

## Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System design and modular architecture
- [Model Comparison](./MODEL_COMPARISON.md) - Detailed STT model benchmarks
- [Quick Start Guide](./QUICKSTART.md) - Get up and running in 5 minutes
- [iOS README](./mobile/ios/README.md) - iOS app documentation
- [Android README](./mobile/android/README.md) - Android app documentation

## Requirements

- Node.js 18+
- One of: whisper.cpp, Python whisper, or faster-whisper (local models, no API needed)
- Audio recording: `arecord` (ALSA) or `sox` on Linux

## License

MIT
