# Listen Android App

Native Android app for voice-to-text transcription using on-device TensorFlow Lite Whisper models.

## Features

- 🎙️ Record audio with one tap
- 🤖 On-device transcription using TFLite Whisper
- 📋 Automatic clipboard copy
- 📜 Transcription history
- 🔒 Privacy-focused (all processing on-device)
- ⚡ Fast and efficient

## Requirements

- Android Studio Hedgehog | 2023.1.1 or newer
- Android SDK 24 (Android 7.0) or higher
- Kotlin 1.9+
- Gradle 8.0+

## Setup

### 1. Open in Android Studio

```bash
cd mobile/android
# Open in Android Studio
```

### 2. Add TFLite Whisper Model

You need to convert a Whisper model to TFLite format:

```bash
# Option 1: Use pre-converted models
# Download from: https://github.com/usefulsensors/openai-whisper/releases
# Place in: app/src/main/assets/models/whisper_tiny.tflite

# Option 2: Convert yourself
pip install whisper-tflite
whisper-tflite-convert --model tiny --output whisper_tiny.tflite
```

Place the `.tflite` file in `app/src/main/assets/models/`

### 3. Configure build.gradle

The app already includes TensorFlow Lite dependencies:

```kotlin
dependencies {
    implementation 'org.tensorflow:tensorflow-lite:2.14.0'
    implementation 'org.tensorflow:tensorflow-lite-support:0.4.4'
}
```

### 4. Build and Run

1. Connect your Android device or start an emulator
2. Click Run (Shift+F10)
3. Grant microphone permission when prompted

## Model Selection

Available TFLite Whisper models:

- **tiny** - Fastest, ~40MB, good for quick transcription
- **base** - Balanced, ~150MB (recommended)
- **small** - Better accuracy, ~500MB
- **medium** - High accuracy, ~1.5GB

To change model, update in `TranscriptionService.kt`:

```kotlin
val modelBuffer = loadModelFile("whisper_base.tflite") // Change filename
```

## Permissions

The app requires microphone permission. Request is handled at runtime:

```kotlin
// In MainActivity
val permissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
) { isGranted ->
    // Handle permission result
}
permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
```

## Architecture

```
app/src/main/java/com/listen/app/
├── MainActivity.kt              - Main entry point
├── ui/
│   ├── screens/
│   │   └── MainScreen.kt        - Main UI screen
│   └── theme/
│       └── Theme.kt             - Material3 theme
├── viewmodel/
│   └── RecordingViewModel.kt    - Business logic
├── audio/
│   └── AudioRecorder.kt         - Audio recording
└── transcription/
    └── TranscriptionService.kt  - TFLite inference
```

## Usage

1. Launch the app
2. Grant microphone permission
3. Tap the microphone button to start recording
4. Speak your text
5. Tap stop when finished
6. Text is automatically transcribed and copied
7. Paste anywhere!

## Building TFLite Models

### Option 1: Use whisper.tflite

```bash
pip install whisper-tflite
python -c "
from whisper_tflite import convert_model
convert_model('tiny', 'whisper_tiny.tflite')
"
```

### Option 2: Manual Conversion

```python
import whisper
import tf2onnx
import onnx
from onnx_tf.backend import prepare

# Load Whisper model
model = whisper.load_model("tiny")

# Convert to ONNX
# ... (conversion steps)

# Convert ONNX to TFLite
# ... (conversion steps)
```

## Troubleshooting

### Model Not Found
- Ensure TFLite model is in `app/src/main/assets/models/`
- Check filename matches in TranscriptionService.kt
- Rebuild the project

### Permission Denied
- Check microphone permission in Settings > Apps > Listen
- Ensure physical microphone is available on device

### Transcription Errors
- Check model is properly converted for TFLite
- Verify audio format is compatible
- Check device has sufficient RAM

### Build Errors
- Sync Gradle (File > Sync Project with Gradle Files)
- Clean and rebuild (Build > Clean Project)
- Update Android Studio and SDK

## Performance

On-device transcription performance varies by model and device:

| Model  | Pixel 6 | Galaxy S22 | OnePlus 9 |
|--------|---------|------------|-----------|
| tiny   | ~2x     | ~2.5x      | ~2x       |
| base   | ~1x     | ~1.2x      | ~0.9x     |
| small  | ~0.5x   | ~0.6x      | ~0.4x     |

(Speed relative to real-time audio duration)

## Advanced: Using Whisper.cpp on Android

For even better performance, you can use whisper.cpp with Android NDK:

1. Build whisper.cpp for Android
2. Create JNI bindings
3. Call from Kotlin via JNI

See: https://github.com/ggerganov/whisper.cpp/tree/master/examples/whisper.android

## Privacy

All transcription happens on-device. No data is sent to external servers.

## License

MIT
