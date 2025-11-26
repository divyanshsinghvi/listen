# Listen - Architecture Documentation

## Overview

Listen is a high-performance voice-to-text overlay application that records audio and transcribes it using state-of-the-art speech-to-text (STT) models. The application uses an intelligent model router to automatically select the best available model based on system capabilities and user preferences.

**Key Features:**
- Global hotkey activation (Ctrl+Shift+Space)
- Automatic model selection (fastest available)
- GPU-accelerated transcription (RTX 3070)
- Fast audio recording using Windows WASAPI
- Clipboard integration (auto-paste transcribed text)
- Multi-platform support (Desktop, iOS, Android)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Electron Desktop App                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Main Process (src/main.ts)                             │   │
│  │  ├─ Global Hotkey Registration (Ctrl+Shift+Space)       │   │
│  │  ├─ Window Management & UI Lifecycle                    │   │
│  │  ├─ IPC Communication with Renderer                     │   │
│  │  └─ Clipboard Integration                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Recording Manager (src/recording.ts)                   │   │
│  │  ├─ Platform Detection (Windows/Linux)                  │   │
│  │  ├─ Windows: PyAudioWPatch + WASAPI                     │   │
│  │  ├─ Linux: arecord/sox                                  │   │
│  │  └─ WAV File Management & Cleanup                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Transcription Router (src/transcription-router.ts)     │   │
│  │  └─ ModularTranscriptionService                         │   │
│  │     ├─ Initialize available models                      │   │
│  │     ├─ Route to best model                              │   │
│  │     └─ Return: {text, modelUsed, duration, confidence} │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Model Router (src/models/ModelRouter.ts)               │   │
│  │  ├─ Model Priority Ranking                              │   │
│  │  ├─ Availability Checking                               │   │
│  │  └─ Scoring & Selection                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  STT Models (src/models/*.ts)                           │   │
│  │  ├─ ParakeetModel (3,333x real-time) ⭐ DEFAULT         │   │
│  │  ├─ CanaryModel (418x real-time)                        │   │
│  │  ├─ DistilWhisperModel (6x real-time)                  │   │
│  │  ├─ MoonshineModel (5-15x real-time)                   │   │
│  │  ├─ FasterWhisperModel (4x real-time)                  │   │
│  │  ├─ WhisperCppModel (2x real-time)                     │   │
│  │  └─ PythonWhisperModel (baseline)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Python Subprocess (Model-specific scripts)             │   │
│  │  └─ GPU-accelerated inference via PyTorch/NeMo          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Main Process (`src/main.ts`)

**Responsibilities:**
- Create transparent overlay window
- Register global hotkey (Ctrl+Shift+Space)
- Toggle recording on/off
- Manage transcription lifecycle
- Update UI with status
- Handle clipboard operations

**Key Methods:**
- `createWindow()` - Initialize Electron window
- `toggleRecording()` - Record → Transcribe → Display flow
- `registerShortcuts()` - Global hotkey setup

**Flow:**
```
User presses Ctrl+Shift+Space
  ↓
toggleRecording() called
  ↓
Start Recording (RecordingManager.startRecording())
  ↓
[5 seconds later] User presses Ctrl+Shift+Space again
  ↓
Stop Recording (RecordingManager.stopRecording())
  ↓
Transcribe (ModularTranscriptionService.transcribe())
  ↓
Copy to Clipboard (clipboard.writeText())
  ↓
Hide Window & Display Result
```

### 2. Recording Manager (`src/recording.ts`)

**Responsibilities:**
- Detect platform (Windows/Linux)
- Record audio from default microphone
- Save to WAV format
- Manage temp files and cleanup

**Windows Implementation:**
- **PyAudioWPatch** - Modern fork of PyAudio with WASAPI support
- **WASAPI** - Windows native audio API
- **wave module** - Python's built-in WAV writer
- **16kHz, mono, 16-bit** - Optimal for speech recognition

```python
# record_audio_fast.py
p = pyaudio.PyAudio()
stream = p.open(format=pyaudio.paInt16, channels=1, rate=16000, input=True)

with wave.open(output_path, 'wb') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(p.get_sample_size(pyaudio.paInt16))
    wf.setframerate(16000)

    while is_recording:
        data = stream.read(chunk_size)
        wf.writeframes(data)
```

**Linux Implementation:**
- Falls back to `arecord` (ALSA) or `rec` (SoX)
- Same output format for compatibility

**Performance:**
- Recording startup: ~100ms
- File validity: Proper WAV headers with correct format metadata
- Cleanup: Keeps only last 5 recordings to save disk space

### 3. Transcription Router (`src/transcription-router.ts`)

**Responsibilities:**
- Initialize available STT models
- Route audio to best model
- Return complete result object

**Interface:**
```typescript
async transcribe(
  audioFilePath: string,
  options?: {
    transcriptionOptions?: TranscriptionOptions;
    routingPreferences?: RoutingPreferences;
  }
): Promise<TranscriptionResult & { modelUsed: string }>
```

**Returns:**
```typescript
{
  text: string;           // Transcribed text
  duration: number;       // Processing time in ms
  confidence: number;     // 0-1 confidence score
  language: string;       // Detected/used language
  modelUsed: string;      // Which model was selected
}
```

### 4. Model Router (`src/models/ModelRouter.ts`)

**Model Priority Order (by speed):**

| Rank | Model | Speed | Real-time | Accuracy | Languages | Size | GPU |
|------|-------|-------|-----------|----------|-----------|------|-----|
| 1 | **Parakeet TDT 0.6B v3** | 3,333x | 1 hour → 1 sec | 6.32% WER | 25 | 600MB | Optional |
| 2 | Canary Qwen 2.5B | 418x | ~1.4 sec/min | 5.63% WER | Multi | 2.5GB | Yes |
| 3 | Distil-Whisper small | 6x | 10 min → 1.6 min | <1% WER | EN | 250MB | No |
| 4 | Moonshine base | 5-15x | Variable | Good | Multi | 200MB | No |
| 5 | FasterWhisper base | 4x | 2.5x faster | Very Good | EN | 74MB | No |
| 6 | Moonshine tiny | 8-25x | Very fast | Fair | Multi | 40MB | No |
| 7 | Whisper.cpp base | 2x | Baseline | Good | EN | 74MB | No |
| 8 | Python Whisper base | 1x | 2 min/sec | Excellent | Multi | 74MB | No |

**Selection Logic:**
```
1. Check models in priority order
2. Stop at FIRST available model
3. Return that model immediately
```

**Why Parakeet First?**
- Fastest: 3,333x real-time = 1 hour audio in 1 second
- Reasonable accuracy: 6.32% WER (competitive)
- Supports 25 European languages
- Perfect for desktop use case

**Scoring System (if multiple criteria needed):**
```typescript
score =
  speedScore * priority_weight +
  accuracyScore * accuracy_weight +
  rtfBonus * efficiency_weight
```

### 5. STT Models

Each model implements the `STTModel` interface:

```typescript
interface STTModel {
  isAvailable(): Promise<boolean>;
  initialize(): Promise<void>;
  transcribe(audioPath: string, options?: TranscriptionOptions): Promise<TranscriptionResult>;
  getInfo(): ModelInfo;
  cleanup(): Promise<void>;
}
```

**Parakeet Implementation Example:**
```typescript
// src/models/ParakeetModel.ts
async transcribe(audioFilePath: string): Promise<TranscriptionResult> {
  const { stdout } = await execAsync(
    `python3 ${scriptPath} "${audioFilePath}" nvidia/parakeet-tdt-0.6b-v3 en`
  );

  return {
    text: stdout.trim(),
    duration: Date.now() - startTime,
    confidence: 0.95,
    language: 'en',
  };
}
```

**Python Transcription Script:**
```python
# parakeet_transcribe.py
import nemo.collections.asr as nemo_asr

model = nemo_asr.models.ASRModel.from_pretrained('nvidia/parakeet-tdt-0.6b-v3')
result = model.transcribe([audio_path])[0]

# Extract text from Hypothesis object
print(result.text)  # Critical: must extract .text property
```

---

## Data Flow

### Complete Pipeline:

```
1. USER INPUT
   ├─ Presses Ctrl+Shift+Space
   └─ App starts recording

2. AUDIO RECORDING (RecordingManager)
   ├─ spawn('python', ['record_audio_fast.py', audioPath])
   ├─ PyAudioWPatch reads from microphone via WASAPI
   ├─ Write to WAV: 16kHz, mono, 16-bit
   └─ File: temp/recording_TIMESTAMP.wav (≈147KB for 5 sec)

3. TRANSCRIPTION REQUEST (Main → Router)
   ├─ ModularTranscriptionService.transcribe(audioPath)
   └─ Pass audio file path

4. MODEL SELECTION (ModelRouter)
   ├─ Check Parakeet availability
   ├─ If available: Use Parakeet → RETURN
   ├─ Else: Check next model in queue
   └─ Selected: ParakeetModel

5. EXECUTION (ParakeetModel)
   ├─ spawn('python', ['parakeet_transcribe.py', audioPath, modelName, language])
   ├─ NeMo loads: nvidia/parakeet-tdt-0.6b-v3
   ├─ GPU inference (~30 seconds on RTX 3070)
   └─ Return: "What's new? I'm here when you are dead."

6. RESULT PROCESSING
   ├─ Extract stdout from Python process
   ├─ Build result object:
   │  {
   │    text: "What's new?...",
   │    duration: 31591,
   │    confidence: 0.95,
   │    language: 'en',
   │    modelUsed: 'Parakeet TDT 0.6B V3'
   │  }
   └─ Return to Main

7. UI & CLIPBOARD
   ├─ Copy text to clipboard
   ├─ Display in overlay
   └─ Auto-hide after 1.5 seconds
```

---

## Technology Stack

### Frontend/Desktop
- **Framework**: Electron
- **Language**: TypeScript
- **Build**: TypeScript Compiler (tsc)

### Audio Recording
- **Windows**: PyAudioWPatch + WASAPI
- **Linux**: arecord (ALSA) or rec (SoX)
- **Format**: WAV (16kHz, mono, 16-bit PCM)

### Speech Recognition
- **Primary Model**: NVIDIA Parakeet TDT 0.6B v3
- **Framework**: PyTorch + NeMo Toolkit
- **Execution**: GPU-accelerated (CUDA 12.8/12.9)
- **Fallbacks**: Canary, Distil-Whisper, Moonshine, etc.

### Python Stack
```
PyTorch 2.9.0+cu128
NeMo Toolkit (ASR module)
sounddevice / PyAudioWPatch
wave (stdlib)
```

### Backend (Optional)
- **API Server**: Node.js HTTP Server (`src/api-server.ts`)
- **Protocol**: JSON over HTTP
- **Port**: 3000 (default)

---

## Performance Characteristics

### Audio Recording
```
Resolution:    16-bit PCM
Channels:      1 (mono)
Sample Rate:   16,000 Hz
Bitrate:       256 kbps
Duration:      5 seconds
File Size:     ~147 KB
Latency:       <100ms startup
```

### Transcription
```
Model:         Parakeet TDT 0.6B v3
Real-time:     3,333x
Duration:      ~30 seconds for 5 sec audio
GPU:           RTX 3070
Memory:        ~600 MB
Accuracy:      6.32% WER (Word Error Rate)
Languages:     25 European languages
```

### End-to-End
```
User Press → Recording Start:  100ms
Recording Duration:             5 seconds
Recording Stop → File Ready:    50ms
Transcription Processing:       30 seconds
Clipboard Copy & Display:       10ms
Total Time:                     ~35 seconds
```

---

## Configuration

### Model Selection Priority

**Default (Auto):**
```typescript
new ModelRouter() // Uses priority order:
// 1. Parakeet (fastest)
// 2. Canary (best accuracy)
// 3. Distil-Whisper (balanced)
// ...etc
```

**Custom Preferences:**
```typescript
transcriptionService.transcribe(audioPath, {
  routingPreferences: {
    priority: 'balance',      // 'speed' | 'accuracy' | 'balance'
    language: 'en',           // Language code
    platform: 'desktop',      // 'desktop' | 'mobile' | 'server'
    maxMemory: 1024,          // MB limit
    requireOffline: false     // Must work without internet
  }
})
```

### Environment Variables
```bash
# GPU acceleration
export CUDA_VISIBLE_DEVICES=0

# Model cache location
export HF_HOME=~/.cache/huggingface

# Logging
export NEMO_LOG_LEVEL=INFO
```

---

## Error Handling

### Recording Failures
```
❌ No audio device found
   └─ Fallback: Retry with different device
   └─ Last resort: Reject with informative error

❌ File permission denied
   └─ Create temp directory
   └─ Use user home directory

❌ Corrupted WAV file
   └─ Validate file before transcription
   └─ Re-record if invalid
```

### Transcription Failures
```
❌ Model not available
   └─ Check next model in queue
   └─ Continue until one succeeds

❌ Audio format invalid
   └─ Log error with audio details
   └─ Suggest re-recording

❌ CUDA out of memory
   └─ Fall back to CPU models
   └─ Or use smaller model variants
```

---

## Extensibility

### Adding a New Model

1. Create model class extending `STTModel`:
```typescript
// src/models/MyModel.ts
export class MyModel extends STTModel {
  async isAvailable(): Promise<boolean> { }
  async transcribe(audioPath: string): Promise<TranscriptionResult> { }
  getInfo(): ModelInfo { }
}
```

2. Register in ModelRouter:
```typescript
// src/models/ModelRouter.ts
this.models = [
  new MyModel(),           // Add new model
  new ParakeetModel(),     // Existing models...
  // ...
];
```

3. Model automatically available for selection!

### Custom Scoring Logic

Override in ModelRouter.calculateScore():
```typescript
private calculateScore(model: STTModel, prefs: RoutingPreferences): number {
  // Custom scoring algorithm
  // Return higher score = better match
}
```

---

## File Structure

```
listen/
├── src/
│   ├── main.ts                    # Electron entry point
│   ├── recording.ts               # Audio recording manager
│   ├── transcription-router.ts    # Transcription service
│   ├── api-server.ts              # Optional HTTP API
│   ├── settings.ts                # User settings
│   ├── models/
│   │   ├── ModelInterface.ts      # STTModel interface
│   │   ├── ModelRouter.ts         # Model selection logic
│   │   ├── ParakeetModel.ts       # Parakeet implementation
│   │   ├── CanaryModel.ts
│   │   ├── DistilWhisperModel.ts
│   │   ├── MoonshineModel.ts
│   │   └── ... (other models)
│   └── assets/
│       ├── index.html             # UI
│       └── style.css
├── dist/                          # Compiled JavaScript
├── temp/                          # Temporary audio files
├── docs/
│   ├── ARCHITECTURE.md            # This file
│   └── API.md                     # API documentation
├── package.json
├── tsconfig.json
└── install-parakeet.sh           # Setup script
```

---

## Future Enhancements

- [ ] Real-time transcription (streaming)
- [ ] Multi-language auto-detection
- [ ] Custom model fine-tuning
- [ ] Offline-first with optional cloud fallback
- [ ] WebRTC for collaborative transcription
- [ ] Browser extension support
- [ ] Mobile app (React Native)
- [ ] Advanced audio preprocessing
- [ ] Speaker diarization
- [ ] Punctuation restoration

---

## References

- [NVIDIA Parakeet](https://github.com/NVIDIA/NeMo/blob/main/nemo/collections/asr/models/parakeet_models.py)
- [NeMo Toolkit](https://github.com/NVIDIA/NeMo)
- [PyAudio Documentation](https://people.csail.mit.edu/hubert/pyaudio/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [HuggingFace Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard)
