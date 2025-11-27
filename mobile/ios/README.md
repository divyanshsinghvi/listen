# Listen iOS App

Native iOS app for voice-to-text transcription using on-device Whisper models.

## Features

- 🎙️ Record audio with one tap
- 🤖 On-device transcription using WhisperKit (CoreML)
- 📋 Automatic clipboard copy
- 📜 Transcription history
- 🔒 Privacy-focused (all processing on-device)
- ⚡ Fast and efficient

## Requirements

- iOS 16.0+
- Xcode 15.0+
- Swift 5.9+

## Setup

### 1. Install WhisperKit

WhisperKit is required for on-device transcription:

```bash
# Add WhisperKit as a Swift Package dependency in Xcode
# Or add to Package.swift:
dependencies: [
    .package(url: "https://github.com/argmaxinc/WhisperKit.git", from: "0.5.0")
]
```

### 2. Open in Xcode

```bash
cd mobile/ios
open Listen.xcodeproj
```

### 3. Configure Signing

1. Select the Listen target
2. Go to "Signing & Capabilities"
3. Select your development team
4. Update the bundle identifier if needed

### 4. Build and Run

1. Select your target device or simulator
2. Press Cmd+R to build and run

## Model Selection

WhisperKit supports multiple model sizes:

- **tiny** - Fastest, ~40MB, good for quick transcription
- **base** - Balanced, ~150MB, recommended
- **small** - Better accuracy, ~500MB
- **medium** - High accuracy, ~1.5GB
- **large** - Best accuracy, ~3GB (requires significant device resources)

To change the model, edit `TranscriptionService.swift`:

```swift
whisperKit = try await WhisperKit(model: "base") // Change to desired model
```

## Permissions

The app requires microphone permission, which is requested on first use. The permission description is configured in `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Listen needs access to your microphone to record audio for transcription.</string>
```

## Architecture

- **ListenApp.swift** - App entry point
- **ContentView.swift** - Main UI with recording controls
- **AudioRecorder.swift** - Audio recording with AVFoundation
- **TranscriptionService.swift** - WhisperKit integration
- **HistoryView.swift** - Transcription history display

## Usage

1. Launch the app
2. Tap the microphone button to start recording
3. Speak your text
4. Tap stop when finished
5. Text is automatically transcribed and copied to clipboard
6. Paste anywhere!

## Testing

Run tests with:

```bash
xcodebuild test -scheme Listen -destination 'platform=iOS Simulator,name=iPhone 15'
```

## Troubleshooting

### Model Download Issues
- First run will download the model (~150MB for base)
- Ensure you have a good internet connection
- Models are cached after first download

### Transcription Errors
- Check microphone permissions in Settings
- Ensure sufficient device storage
- Try a smaller model if running out of memory

### Build Errors
- Ensure you're using Xcode 15.0+
- Clean build folder (Cmd+Shift+K)
- Reset package cache if WhisperKit fails to load

## Performance

On-device transcription performance varies by model and device:

| Model  | iPhone 12 | iPhone 14 Pro | iPhone 15 Pro |
|--------|-----------|---------------|---------------|
| tiny   | ~2x       | ~3x          | ~4x           |
| base   | ~1x       | ~1.5x        | ~2x           |
| small  | ~0.5x     | ~0.8x        | ~1x           |

(Speed relative to real-time audio duration)

## Privacy

All transcription happens on-device using CoreML. No data is sent to external servers.

## License

MIT
