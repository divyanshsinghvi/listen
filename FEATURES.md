# Listen - Feature Documentation

Comprehensive guide to all features in the Listen voice-to-text app.

## Table of Contents

1. [Core Features](#core-features)
2. [System Tray Integration](#system-tray-integration)
3. [Settings & Configuration](#settings--configuration)
4. [Voice Commands](#voice-commands)
5. [Statistics & Analytics](#statistics--analytics)
6. [API Server Mode](#api-server-mode)
7. [Multi-Platform Support](#multi-platform-support)
8. [Advanced Features](#advanced-features)

---

## Core Features

### 1. Intelligent Model Routing

Listen automatically selects the best STT model based on your requirements:

```typescript
// Automatically use fastest model
const text = await service.transcribe('audio.wav', {
  routingPreferences: { priority: 'speed' }
});

// Best accuracy for English on desktop
const text = await service.transcribe('audio.wav', {
  routingPreferences: {
    priority: 'accuracy',
    language: 'en',
    platform: 'desktop'
  }
});
```

**Supported Models:**
- Moonshine (5-15x faster, optimized for edge)
- Distil-Whisper (6x faster, excellent for English)
- Faster-Whisper (4x faster)
- Whisper.cpp (C++ implementation)
- Python Whisper (baseline)

See [MODEL_COMPARISON.md](./MODEL_COMPARISON.md) for detailed benchmarks.

### 2. Global Hotkey Access

**Desktop:**
- `Ctrl+Shift+Space` - Start/Stop recording
- `Esc` - Cancel recording
- Customizable in settings

**Mobile:**
- One-tap button for recording
- Swipe gestures (coming soon)

### 3. Automatic Clipboard

Transcribed text is automatically copied to clipboard for instant pasting anywhere.

---

## System Tray Integration

### Features

- **Always accessible** - Runs in system tray
- **Quick actions** - Right-click menu for common tasks
- **Status indicator** - Visual recording state
- **Model switching** - Change models on the fly

### Tray Menu

```
Listen
├── Start/Stop Recording (Ctrl+Shift+Space)
├── ─────────────
├── Models
│   ├── ● Moonshine Tiny (active)
│   ├── ○ Distil-Whisper Small
│   └── ○ Faster-Whisper Base
├── Settings (Ctrl+,)
├── History (Ctrl+H)
├── ─────────────
├── Statistics
├── ─────────────
├── About
└── Quit (Ctrl+Q)
```

### Usage

```typescript
import { TrayManager } from './tray';

const tray = new TrayManager();
tray.createTray();
tray.setRecordingState(true);  // Update when recording
```

---

## Settings & Configuration

### Settings Categories

#### 1. General
- **Language**: Default transcription language
- **Auto-start**: Launch on system startup
- **Minimize to tray**: Keep running in background

#### 2. Recording
- **Mode**: Toggle / Push-to-talk / Continuous / VAD
- **Audio Quality**: Low (8kHz) / Medium (16kHz) / High (48kHz)
- **Noise Reduction**: Pre-process audio

#### 3. Models
- **Preferred Model**: Auto-select or specify model
- **Priority**: Speed / Balance / Accuracy
- **Streaming**: Enable real-time transcription

#### 4. Post-Processing
- **Auto-capitalize**: Capitalize sentences
- **Auto-punctuation**: Add punctuation automatically
- **Voice Commands**: Enable spoken commands
- **Custom Vocabulary**: Add technical terms

#### 5. Privacy
- **Save History**: Keep transcription history
- **History Limit**: Max number of entries (default: 100)
- **Auto-delete**: Delete old transcriptions (e.g., 30 days)

#### 6. Hotkeys
- Customize all keyboard shortcuts
- Multi-key combinations supported
- Conflict detection

#### 7. Advanced
- **API Server**: Enable REST API
- **API Port**: Server port (default: 8765)
- **Telemetry**: Anonymous usage statistics

### Accessing Settings

**Desktop:**
- Tray menu → Settings
- Hotkey: `Ctrl+,`

**Mobile:**
- App menu → Settings

### Configuration File

Settings stored in: `~/.config/listen/settings.json`

```json
{
  "language": "en",
  "recordingMode": "toggle",
  "modelPriority": "balance",
  "enableVoiceCommands": true,
  "autoCapitalize": true
}
```

---

## Voice Commands

### Supported Commands

#### Punctuation

| Command | Result | Aliases |
|---------|--------|---------|
| "period" | . | "full stop", "dot" |
| "comma" | , | - |
| "question mark" | ? | - |
| "exclamation mark" | ! | "exclamation point" |
| "colon" | : | - |
| "semicolon" | ; | - |

#### Line Breaks

| Command | Result |
|---------|--------|
| "new line" | \n |
| "new paragraph" | \n\n |

#### Formatting

| Command | Action |
|---------|--------|
| "caps on" | Enable ALL CAPS mode |
| "caps off" | Disable caps mode |
| "number mode on" | Convert words to digits |
| "number mode off" | Stop converting |

#### Editing

| Command | Action |
|---------|--------|
| "delete that" | Remove last sentence |
| "delete last word" | Remove last word |
| "scratch that" | Same as "delete that" |

#### Special Characters

| Command | Result |
|---------|--------|
| "at sign" | @ |
| "hashtag" | # |
| "dollar sign" | $ |
| "open quote" | " |
| "close quote" | " |

### Example Usage

**Input (spoken):**
```
Hello world period this is a test comma and it works exclamation mark new line
```

**Output (text):**
```
Hello world. This is a test, and it works!
```

### Custom Commands

Add custom voice commands via API:

```typescript
import { VoiceCommandProcessor } from './voice-commands';

const processor = new VoiceCommandProcessor();

processor.register({
  trigger: ['smiley face', 'smile'],
  action: (text) => text + ' :)',
  description: 'Insert smiley face'
});
```

---

## Statistics & Analytics

### Tracked Metrics

- **Total transcriptions**
- **Word count**
- **Character count**
- **Recording time**
- **Processing time**
- **Time saved** (vs typing)
- **Models used**
- **Languages used**

### Statistics Dashboard

**Total Stats:**
```
Transcriptions: 1,247
Total Words: 45,823
Time Saved: 18.2 hours
Most Used Model: Moonshine Base (72%)
Average Processing Time: 1.2s
```

**Daily Stats (Last 30 Days):**
```
Date          Transcriptions  Words   Time Saved
2025-01-12    15             542     12m
2025-01-11    23             891     24m
2025-01-10    18             673     18m
...
```

**Model Performance:**
```
Model                 Uses  Avg Processing  Avg Words
Moonshine Tiny        450   0.8s           34
Distil-Whisper Small  520   1.2s           41
Faster-Whisper Base   277   2.1s           38
```

### Export Statistics

Export to JSON for analysis:

```typescript
import { StatisticsManager } from './statistics';

const stats = new StatisticsManager();
const json = stats.exportToJSON();

fs.writeFileSync('stats.json', json);
```

### Privacy

- All statistics stored locally
- No data sent to external servers
- Can be disabled in settings
- Full control over data retention

---

## API Server Mode

Transform Listen into a transcription service for other apps!

### Starting the Server

```typescript
import { APIServer } from './api-server';

const server = new APIServer({
  port: 8765,
  host: '127.0.0.1',
  enableCORS: true
});

await server.start();
```

### API Endpoints

#### 1. Health Check

```bash
GET http://localhost:8765/health
```

Response:
```json
{
  "status": "ok",
  "uptime": 3600,
  "models": 5
}
```

#### 2. List Models

```bash
GET http://localhost:8765/models
```

Response:
```json
{
  "models": [
    {
      "name": "Moonshine Tiny",
      "speed": "ultra-fast",
      "accuracy": "good",
      "rtfSpeed": 10
    },
    ...
  ]
}
```

#### 3. Transcribe (Base64 Audio)

```bash
POST http://localhost:8765/transcribe
Content-Type: application/json

{
  "audio": "base64_encoded_wav_data",
  "preferences": {
    "priority": "speed",
    "language": "en"
  }
}
```

Response:
```json
{
  "text": "Hello world, this is a test.",
  "wordCount": 6,
  "characterCount": 29
}
```

#### 4. Transcribe File

```bash
POST http://localhost:8765/transcribe-file
Content-Type: application/json

{
  "path": "/path/to/audio.wav",
  "preferences": {
    "priority": "accuracy"
  }
}
```

### Example: Python Client

```python
import requests
import base64

# Read audio file
with open('audio.wav', 'rb') as f:
    audio_data = base64.b64encode(f.read()).decode()

# Transcribe
response = requests.post('http://localhost:8765/transcribe', json={
    'audio': audio_data,
    'preferences': {'priority': 'speed'}
})

print(response.json()['text'])
```

### Example: JavaScript Client

```javascript
const audio = fs.readFileSync('audio.wav').toString('base64');

const response = await fetch('http://localhost:8765/transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    audio,
    preferences: { priority: 'accuracy' }
  })
});

const { text } = await response.json();
console.log(text);
```

### Security Considerations

- **Local-only by default** (127.0.0.1)
- **No authentication** (trusted local apps only)
- **CORS enabled** (configurable)
- **File size limits** (100MB default)

For production use, consider:
- Adding API key authentication
- Rate limiting
- HTTPS/TLS
- Firewall rules

---

## Multi-Platform Support

### Desktop (Electron)

**Features:**
- System-wide overlay
- Global hotkeys
- System tray integration
- Multiple models

**Platforms:**
- ✅ Linux
- 🔜 macOS
- 🔜 Windows

### iOS (Native)

**Features:**
- WhisperKit (CoreML) integration
- On-device transcription
- Transcription history
- iCloud sync (optional)

**Requirements:**
- iOS 16.0+
- iPhone or iPad

**See:** [mobile/ios/README.md](./mobile/ios/README.md)

### Android (Native)

**Features:**
- TensorFlow Lite Whisper
- On-device transcription
- Material Design 3 UI
- History with search

**Requirements:**
- Android 7.0+

**See:** [mobile/android/README.md](./mobile/android/README.md)

---

## Advanced Features

### 1. Custom Vocabulary

Add technical terms, proper nouns, or domain-specific language:

```typescript
import { SettingsManager } from './settings';

const settings = new SettingsManager();
settings.addCustomWord('Kubernetes');
settings.addCustomWord('PostgreSQL');
settings.addCustomWord('TypeScript');
```

Models will be more likely to transcribe these words correctly.

### 2. Noise Reduction

Pre-process audio to reduce background noise:

```typescript
// Enable in settings
settings.set({ noiseReduction: true });
```

Uses audio filters to improve transcription quality in noisy environments.

### 3. Multiple Recording Modes

**Toggle Mode (Default):**
- Press hotkey to start
- Press again to stop

**Push-to-Talk:**
- Hold hotkey to record
- Release to transcribe

**Continuous:**
- Always recording
- Process on demand

**VAD (Voice Activity Detection):**
- Automatically start on speech
- Auto-stop on silence

### 4. Streaming Transcription

See text appear as you speak:

```typescript
settings.set({ enableStreaming: true });
```

Requires model with streaming support (e.g., Whisper.cpp with `-nt` flag).

### 5. Multi-Language Support

Auto-detect language or specify:

```typescript
const text = await service.transcribe('audio.wav', {
  transcriptionOptions: { language: 'es' },
  routingPreferences: { priority: 'accuracy' }
});
```

Supported languages depend on model (Whisper supports 99+).

### 6. Batch Processing

Process multiple audio files:

```typescript
const files = ['audio1.wav', 'audio2.wav', 'audio3.wav'];

for (const file of files) {
  const text = await service.transcribe(file);
  console.log(`${file}: ${text}`);
}
```

### 7. Plugin System (Coming Soon)

Extend Listen with custom post-processors:

```typescript
interface PostProcessor {
  name: string;
  process(text: string): string;
}

const spellCheck: PostProcessor = {
  name: 'spell-check',
  process(text) {
    // Spell checking logic
    return correctedText;
  }
};

service.registerPostProcessor(spellCheck);
```

---

## Keyboard Shortcuts Reference

| Action | Default Shortcut | Customizable |
|--------|------------------|--------------|
| Toggle Recording | Ctrl+Shift+Space | ✅ |
| Cancel Recording | Escape | ✅ |
| Show Settings | Ctrl+, | ✅ |
| Show History | Ctrl+H | ✅ |
| Quit App | Ctrl+Q | ✅ |

---

## Troubleshooting

### Recording Not Working
1. Check microphone permissions
2. Verify audio device in system settings
3. Try different audio quality settings

### Low Transcription Accuracy
1. Use higher quality audio (16kHz+)
2. Enable noise reduction
3. Add custom vocabulary
4. Try more accurate model (Distil-Whisper, Whisper base+)

### Slow Transcription
1. Switch to faster model (Moonshine)
2. Use smaller model variant (tiny vs base)
3. Check system resources (CPU/RAM)

### API Server Issues
1. Check port is not in use
2. Verify firewall allows local connections
3. Check server logs for errors

---

## Tips & Best Practices

1. **Use Moonshine for mobile** - Optimized for edge devices
2. **Use Distil-Whisper for English desktop** - Best balance
3. **Enable voice commands** - Faster than manual editing
4. **Customize hotkeys** - Match your workflow
5. **Review statistics** - Optimize your usage
6. **Add custom vocabulary** - Improve accuracy for your domain
7. **Enable noise reduction** - For better quality in noisy environments
8. **Use API mode** - Integrate with other tools
9. **Export statistics** - Track productivity gains
10. **Keep history enabled** - Never lose transcriptions

---

## Future Roadmap

- [ ] Streaming transcription (real-time)
- [ ] Web browser extension
- [ ] Emotion/sentiment detection
- [ ] Speaker diarization
- [ ] Custom model training
- [ ] Cloud backup (optional)
- [ ] Team collaboration features
- [ ] Plugin marketplace
- [ ] Voice biometrics
- [ ] Multi-device sync

---

## Contributing

Want to add features? See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT License - see [LICENSE](./LICENSE)
