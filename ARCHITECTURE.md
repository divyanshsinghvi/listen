# Listen - Architecture Documentation

## Overview

Listen is a multi-platform voice-to-text application with a modular architecture that supports automatic model selection and routing.

## Project Structure

```
listen/
├── src/                          # Desktop Electron app
│   ├── main.ts                   # Main process
│   ├── recording.ts              # Audio recording
│   ├── transcription.ts          # Legacy transcription (deprecated)
│   ├── transcription-router.ts   # Modern modular service
│   └── models/                   # Modular model system
│       ├── ModelInterface.ts     # Abstract base interface
│       ├── ModelRouter.ts        # Intelligent routing system
│       ├── MoonshineModel.ts     # Moonshine implementation
│       ├── DistilWhisperModel.ts # Distil-Whisper implementation
│       ├── WhisperCppModel.ts    # Whisper.cpp implementation
│       ├── FasterWhisperModel.ts # Faster-Whisper implementation
│       └── PythonWhisperModel.ts # Python Whisper fallback
├── mobile/
│   ├── ios/                      # Native iOS app (Swift + SwiftUI)
│   │   └── Listen/
│   │       ├── ListenApp.swift
│   │       ├── ContentView.swift
│   │       ├── AudioRecorder.swift
│   │       ├── TranscriptionService.swift (WhisperKit)
│   │       └── HistoryView.swift
│   └── android/                  # Native Android app (Kotlin + Compose)
│       └── app/src/main/
│           ├── MainActivity.kt
│           ├── ui/screens/MainScreen.kt
│           ├── viewmodel/RecordingViewModel.kt
│           ├── audio/AudioRecorder.kt
│           └── transcription/TranscriptionService.kt (TFLite)
├── assets/                       # UI assets
│   └── index.html                # Electron overlay UI
└── models/                       # Model binaries
    └── ggml-*.bin                # Whisper.cpp models

```

## Architecture Patterns

### 1. Modular Model System

The app uses a plugin-based architecture for STT models:

```typescript
// Abstract interface all models implement
interface STTModel {
  isAvailable(): Promise<boolean>;
  transcribe(audioPath, options): Promise<TranscriptionResult>;
  getInfo(): ModelInfo;
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}
```

**Benefits:**
- Easy to add new models
- Automatic fallback if a model isn't available
- Consistent API across all models
- Testable and maintainable

### 2. Intelligent Routing

The `ModelRouter` automatically selects the best model based on:
- **Speed requirements** (ultra-fast, fast, medium, slow)
- **Accuracy requirements** (excellent, good, fair)
- **Language** (English, multilingual, Asian languages)
- **Platform** (desktop, mobile, server)
- **Memory constraints**
- **Availability** (installed models)

```typescript
// Example: Auto-select fastest model
const result = await router.transcribe(audioPath, {}, {
  priority: 'speed',
  platform: 'desktop'
});

// Example: Best for Asian languages
const result = await router.transcribe(audioPath, {}, {
  priority: 'balance',
  language: 'zh'
});
```

### 3. Model Selection Algorithm

The router scores each available model based on:

```
Score = (SpeedWeight × SpeedScore) +
        (AccuracyWeight × AccuracyScore) +
        (RTFBonus × 0.2) +
        PlatformBonus +
        LanguageBonus
```

Where weights change based on priority:
- **Speed priority**: 60% speed, 20% accuracy, 20% RTF
- **Accuracy priority**: 20% speed, 60% accuracy, 20% RTF
- **Balance**: 40% speed, 40% accuracy, 20% RTF

## Model Implementations

### Moonshine (Recommended for Mobile)
- **Type**: ONNX
- **Speed**: 5-15x real-time
- **Size**: 40MB (tiny), 200MB (base)
- **Best for**: Edge devices, mobile apps
- **Implementation**: Python script via subprocess

### Distil-Whisper (Recommended for Desktop)
- **Type**: Transformers + PyTorch
- **Speed**: 6x real-time
- **Size**: 250MB (small), 750MB (medium)
- **Best for**: Desktop English transcription
- **Implementation**: Python script via subprocess

### Whisper.cpp
- **Type**: C++ binary
- **Speed**: 2x real-time
- **Size**: 150MB (base)
- **Best for**: Low-level integration
- **Implementation**: Direct binary execution

### Faster-Whisper
- **Type**: CTranslate2 (optimized)
- **Speed**: 4x real-time
- **Size**: 150MB (base)
- **Best for**: Python environments
- **Implementation**: Python script via subprocess

### Python Whisper
- **Type**: PyTorch
- **Speed**: 1x real-time (baseline)
- **Size**: 150MB (base)
- **Best for**: Fallback option
- **Implementation**: Python script via subprocess

## Data Flow

### Desktop (Electron):

```
User presses hotkey
  ↓
Start audio recording (ALSA/sox)
  ↓
User presses hotkey again
  ↓
Stop recording → Save to temp file
  ↓
Initialize ModelRouter
  ↓
Router selects best model (e.g., Distil-Whisper)
  ↓
Model transcribes audio
  ↓
Text copied to clipboard
  ↓
Show result in overlay
  ↓
Auto-hide after 1.5s
```

### iOS:

```
Tap record button
  ↓
Request microphone permission
  ↓
Start AVAudioRecorder (16kHz, mono, PCM)
  ↓
Tap stop button
  ↓
Stop recording → Save to Documents
  ↓
WhisperKit transcribes (CoreML)
  ↓
Text copied to UIPasteboard
  ↓
Display result + save to history
```

### Android:

```
Tap record button
  ↓
Request RECORD_AUDIO permission
  ↓
Start MediaRecorder (16kHz, mono)
  ↓
Tap stop button
  ↓
Stop recording → Save to cache
  ↓
TFLite Whisper transcribes
  ↓
Text copied to ClipboardManager
  ↓
Display result + save to history
```

## Configuration

### Model Selection Priority (Default)

**Desktop:**
1. Distil-Whisper Small (if English)
2. Moonshine Base (if multilingual or English)
3. Faster-Whisper Base
4. Whisper.cpp Base
5. Python Whisper Base

**iOS:**
1. Moonshine Tiny (CoreML)
2. WhisperKit Tiny

**Android:**
1. Moonshine Tiny (TFLite)
2. Whisper Tiny (TFLite)

### Overriding Model Selection

Users can override automatic selection:

```typescript
// Use specific model
const text = await service.transcribeWithModel(
  audioPath,
  'Moonshine tiny'
);

// Or with routing preferences
const text = await service.transcribe(audioPath, {
  routingPreferences: {
    priority: 'accuracy', // Use most accurate available
    maxMemory: 500, // Max 500MB
    language: 'zh' // Chinese
  }
});
```

## Performance Characteristics

| Platform | Model | Cold Start | Warm Transcription (10s audio) |
|----------|-------|------------|-------------------------------|
| Desktop | Moonshine | ~2s | ~1s (10x real-time) |
| Desktop | Distil-Whisper | ~3s | ~1.5s (6x real-time) |
| Desktop | Whisper.cpp | ~1s | ~5s (2x real-time) |
| iOS | WhisperKit Tiny | ~2s | ~3s (3x real-time) |
| Android | TFLite Whisper | ~2s | ~4s (2.5x real-time) |

## Security Considerations

### Privacy
- **All processing happens locally** (no cloud services)
- Audio files stored temporarily, deleted after transcription
- No telemetry or analytics
- No network requests for transcription

### Permissions
- **Microphone**: Required for audio recording
- **Storage**: Temporary audio file storage only
- No location, contacts, or other sensitive permissions

### Sandboxing
- Electron: Content isolation enabled
- iOS: Standard app sandbox
- Android: Standard app sandbox

## Extension Points

### Adding a New Model

1. Create new model class implementing `STTModel`:

```typescript
export class MyNewModel extends STTModel {
  async isAvailable(): Promise<boolean> {
    // Check if model is installed
  }

  async transcribe(audioPath: string): Promise<TranscriptionResult> {
    // Implement transcription
  }

  getInfo(): ModelInfo {
    return {
      name: 'My New Model',
      type: 'custom',
      speed: 'ultra-fast',
      // ...
    };
  }
}
```

2. Register in `ModelRouter` constructor:

```typescript
this.models = [
  new MyNewModel(),
  new MoonshineModel(),
  // ...
];
```

3. Done! Router will automatically use it if available.

### Adding New Features

**Streaming Transcription:**
- Modify `STTModel` interface to support streaming
- Implement in models that support it (e.g., Whisper.cpp)

**Multi-Language UI:**
- Add i18n to Electron, iOS, Android UIs
- Update router language handling

**Cloud Sync:**
- Add optional cloud storage for history
- Maintain local-first architecture

## Testing

### Unit Tests
```bash
npm test                          # Desktop tests
cd mobile/ios && xcodebuild test  # iOS tests
cd mobile/android && ./gradlew test  # Android tests
```

### Integration Tests
- Model availability detection
- Routing algorithm
- Audio recording
- Transcription accuracy

### Performance Tests
- Benchmark each model
- Memory usage monitoring
- Real-time factor measurements

## Deployment

### Desktop (Electron)
```bash
npm run build
npm run package  # Creates installer
```

### iOS
```bash
cd mobile/ios
xcodebuild -scheme Listen archive
# Or build in Xcode
```

### Android
```bash
cd mobile/android
./gradlew assembleRelease
```

## Future Improvements

1. **Streaming Transcription**: Real-time text as you speak
2. **Voice Commands**: "new line", "period", etc.
3. **Custom Dictionaries**: Technical terms, names
4. **Multi-Speaker Diarization**: Identify different speakers
5. **Emotion Detection**: Use SenseVoice for tone analysis
6. **Punctuation Restoration**: Automatic punctuation
7. **Noise Cancellation**: Pre-process audio
8. **GPU Acceleration**: CUDA/Metal support for faster models
9. **Web Version**: WASM-based browser extension
10. **Model Quantization**: Even smaller models

## References

- [Moonshine Paper](https://arxiv.org/html/2410.15608v2)
- [Distil-Whisper GitHub](https://github.com/huggingface/distil-whisper)
- [Whisper.cpp GitHub](https://github.com/ggerganov/whisper.cpp)
- [WhisperKit iOS](https://github.com/argmaxinc/WhisperKit)
- [Model Comparison](./MODEL_COMPARISON.md)
