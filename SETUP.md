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

---

## Development

### Project Structure
```
listen/
├── src/                    # TypeScript source
│   ├── main.ts            # Electron main process
│   ├── recording.ts       # Audio recording
│   ├── transcription-router.ts
│   ├── models/            # STT model implementations
│   └── assets/            # UI (HTML/CSS)
├── dist/                  # Compiled JavaScript
├── docs/                  # Documentation
├── package.json           # Node dependencies
├── requirements.txt       # Python dependencies
├── tsconfig.json         # TypeScript config
└── SETUP.md              # This file
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

---

## Performance Tips

### Recording
- Use default microphone (avoid USB devices with high latency)
- Close background applications
- Use wired headset for better quality

### Transcription
- RTX 3070: ~30 seconds for 5 second audio
- Parakeet is fastest (3,333x real-time)
- Fallback models available if Parakeet unavailable
- GPU acceleration recommended

### Overall
- First run slower (model download + cache)
- Subsequent runs faster (~35 seconds total)
- Auto-paste delayed if system busy

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
