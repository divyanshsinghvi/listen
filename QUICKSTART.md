# Quick Start Guide

Get up and running with Listen in 5 minutes!

## Automated Setup (Linux)

### Option 1: whisper.cpp (Recommended)
```bash
# Run the automated setup script
./setup-whisper.sh

# Install Node.js dependencies
npm install

# Build and start
npm run build
npm start
```

### Option 2: Python Whisper
```bash
# Run the Python Whisper setup script
./install-python-whisper.sh

# Install Node.js dependencies
npm install

# Build and start
npm run build
npm start
```

## Manual Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Whisper (choose one)

**whisper.cpp (Fast, C++):**
```bash
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make
sudo cp main /usr/local/bin/whisper-cpp
bash ./models/download-ggml-model.sh base
mkdir -p ../models
cp models/ggml-base.bin ../models/
```

**Python Whisper:**
```bash
pip install openai-whisper
sudo apt-get install ffmpeg  # or equivalent for your OS
```

**faster-whisper (Optimized):**
```bash
pip install faster-whisper
```

### 3. Install Audio Tools (Linux)
```bash
# Ubuntu/Debian
sudo apt-get install alsa-utils

# Or use sox
sudo apt-get install sox
```

### 4. Build and Run
```bash
npm run build
npm start
```

## Usage

1. Launch the app: `npm start`
2. The app runs in the background (system tray)
3. Press `Ctrl+Shift+Space` anywhere to start recording
4. Speak your text
5. Press `Ctrl+Shift+Space` again to stop
6. Text is automatically copied to clipboard
7. Paste with `Ctrl+V` in any application!

## Troubleshooting

### "No Whisper implementation found"
- Make sure you've installed at least one Whisper option
- Check that the executable is in your PATH:
  - `which whisper-cpp` (for whisper.cpp)
  - `which whisper` (for Python whisper)

### "No audio recording tool found"
- Install `alsa-utils` or `sox`:
  ```bash
  sudo apt-get install alsa-utils sox
  ```

### Global shortcut not working
- The app requires X11 (doesn't work on Wayland yet)
- Make sure no other app is using `Ctrl+Shift+Space`

### Model download issues
- Models are downloaded on first use (Python Whisper)
- For whisper.cpp, ensure models/ggml-base.bin exists
- Alternative models: tiny (faster), small, medium, large (more accurate)

## Tips

- Use `tiny` model for fastest transcription
- Use `base` model for good balance (recommended)
- Use `small` or higher for better accuracy
- The first transcription may be slow (model loading)
- Subsequent transcriptions are much faster!
