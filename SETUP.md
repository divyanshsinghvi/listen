# Listen - Setup & Installation Guide

## Quick Start

### Prerequisites
- **Node.js** 18+ (https://nodejs.org/)
- **Python** 3.10+ (https://python.org/)
- **Git** (for cloning the repo)

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd listen
```

#### 2. Install Node Dependencies
```bash
npm install
```

#### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

**Note on PyTorch:** The requirements.txt installs PyTorch CPU by default. For GPU support (RTX 3070):
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
```

#### 4. Build TypeScript
```bash
npm run build
```

#### 5. Run the App
```bash
npm start
```

---

## Using PyAudioWPatch on Windows

PyAudioWPatch is pre-configured for Windows WASAPI support. No additional setup needed - just install dependencies!

### If you get audio device errors:
```bash
# List available audio devices
python -c "import pyaudiowpatch as p; p.PyAudio().terminate()"

# Try alternative: use standard PyAudio
pip install pyaudio
```

---

## Using Parakeet Model

The app automatically downloads Parakeet TDT 0.6B v3 on first use (~600MB).

**Persistent Server Architecture:**
- Model initializes once during app startup (~21 seconds)
- Server stays running after initialization for fast repeated use
- All transcriptions (first and onwards): ~1-2 seconds (model preloaded)
- Model stays in GPU memory while app is running
- Automatically restarts if connection lost

**GPU Requirements:**
- NVIDIA GPU with CUDA Compute Capability 6.0+ (RTX 3070 ✓)
- CUDA Toolkit 12.8+
- cuDNN 8.x

**Model Storage:**
- Location: `~/.cache/huggingface/`
- Size: ~600MB
- Set custom location: `export HF_HOME=/path/to/cache`

---

## Usage

### Global Hotkey
- **Ctrl+Shift+Space** - Toggle recording on/off
- **Escape** - Cancel recording

### Workflow
1. Press Ctrl+Shift+Space
2. Speak into microphone
3. Press Ctrl+Shift+Space to stop
4. Text is automatically pasted at cursor position
5. Text also copied to clipboard as backup

---

## Configuration

### Environment Variables
```bash
# GPU acceleration
export CUDA_VISIBLE_DEVICES=0

# Model cache location
export HF_HOME=~/.cache/huggingface

# NeMo logging
export NEMO_LOG_LEVEL=INFO
```

### Settings File
User settings stored in: `~/.listen/settings.json`

Edit for custom preferences:
- Audio device selection
- Model preferences
- Hotkey customization
- Auto-paste behavior

---

## Troubleshooting

### Audio Recording Issues

**"No audio device found"**
```bash
# List devices
python -c "import sounddevice; print(sounddevice.query_devices())"
```

**Corrupted WAV files**
- Check file permissions on temp directory
- Ensure disk space available
- Try different audio device

### Transcription Issues

**"Model not available"**
```bash
# Check NeMo installation
python -c "import nemo.collections.asr"

# Verify GPU access
python -c "import torch; print(torch.cuda.is_available())"
```

**Out of memory**
- Close other applications
- Use smaller model variant
- Check GPU memory: `nvidia-smi`

### Auto-Paste Not Working

- Text is in clipboard - paste manually with Ctrl+V
- Check focus goes to target application
- Some apps block simulated keyboard input
- Try pasting in a text editor first

### App Startup Takes ~25 Seconds

**This is normal!** Here's what happens when you start the app:
1. Electron window opens
2. Persistent Parakeet server initializes (~21 seconds)
3. Model loads once into GPU memory
4. App displays "Ready to record" - now it's ready to use

**Once startup is done, transcriptions are instant** (~1-2 seconds each) because:
- Model stays loaded in persistent server memory
- Every transcription just does inference on the preloaded model
- No re-initialization, just pure transcription

**Timeline:**
- `npm start` → waiting ~25 seconds... → ready to use
- First transcription → ~1-2 seconds
- All subsequent transcriptions → ~1-2 seconds each

---

## Development

### Project Structure
```
listen/
├── src/                           # TypeScript source code
│   ├── main.ts                   # Electron main process
│   ├── recording.ts              # Audio recording manager
│   ├── transcription-router.ts   # Transcription service routing
│   ├── dataset.ts                # Dataset collection
│   ├── models/                   # STT model implementations
│   │   ├── ModelRouter.ts        # Model selection logic
│   │   ├── ParakeetModel.ts      # Parakeet STT model
│   │   └── ... (other models)
│   └── assets/                   # UI (HTML/CSS)
├── scripts/                       # Python utility scripts
│   └── record_audio_windows.py   # Windows audio recording
├── dist/                          # Compiled JavaScript
├── docs/                          # Documentation & architecture
├── window_focus.py               # Windows API focus management
├── package.json                  # Node dependencies
├── requirements.txt              # Python dependencies
├── tsconfig.json                 # TypeScript config
└── SETUP.md                      # This file
```

### Build Commands
```bash
# Build TypeScript
npm run build

# Watch for changes
npm run build -- --watch

# Clean build
rm -rf dist && npm run build
```

### Adding New Models
1. Create model class in `src/models/YourModel.ts`
2. Extend `STTModel` interface
3. Register in `ModelRouter.ts`
4. Add Python implementation script if needed

### Python Scripts Organization

Python utility scripts are organized in the `scripts/` directory:

- **`record_audio_windows.py`** - Windows audio recording using PyAudioWPatch
  - Used by `src/recording.ts` for WASAPI audio capture
  - Supports SIGINT/SIGTERM for graceful shutdown
  - Standalone script for better maintainability and IDE support

To add a new Python script:
1. Create new file in `scripts/` directory
2. Add proper shebang: `#!/usr/bin/env python3`
3. Include module docstring explaining purpose
4. Import from spawn process in TypeScript: `spawn('python', [scriptPath, arg1, arg2])`

**Benefits of this structure:**
- Python code gets proper syntax highlighting
- IDE linting and formatting work correctly
- Easier to debug and test scripts independently
- Clear separation of concerns

---

## Performance Tips

### Recording
- Use default microphone (avoid USB devices with high latency)
- Close background applications
- Use wired headset for better quality

### Transcription
- RTX 3070: ~30 seconds for 5 second audio (first run includes model load)
- Parakeet is fastest available model for most use cases
- Fallback models available if Parakeet unavailable
- GPU acceleration recommended for fastest inference

### Overall
- First run: ~35 seconds (includes model initialization)
- Subsequent runs: ~6-7 seconds (model preloaded in persistent server)
- Auto-paste immediate with proper window focus restoration

---

## Platform Support

### ✅ Windows
- Full support with PyAudioWPatch
- WASAPI audio input
- Keyboard simulation via pyautogui

### ✅ Linux
- Audio via ALSA (arecord) or SoX
- Keyboard simulation via xdotool (requires installation)

### ✅ macOS
- Audio via AVFoundation
- Keyboard simulation via built-in tools

---

## Security & Privacy

- **No cloud upload** - All processing local
- **No tracking** - No telemetry
- **Clipboard only** - Text pasted directly
- **Temporary files** - Auto-cleaned

---

## Support

### Check Logs
```bash
# Electron logs
npm start 2>&1 | tee listen.log

# Python errors
python -c "import nemo.collections.asr as nemo_asr"
```

### Common Issues
- See Troubleshooting section above
- Check docs/ARCHITECTURE.md for technical details
- Review source code comments

---

## License

See LICENSE file

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Build the app
3. ✅ Run and test
4. 📖 Read docs/ARCHITECTURE.md for details
5. 🚀 Customize for your needs
