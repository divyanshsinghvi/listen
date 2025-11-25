# Efficient STT Models (Under 1 Billion Parameters)

Focus on **edge-optimized models** perfect for mobile, desktop, and embedded systems.

## Top Models Under 1B Parameters (2025)

| Model | Params | RTFx Speed | WER | Size | Best For |
|-------|--------|-----------|-----|------|----------|
| **Parakeet TDT v3** | 600M | **3,333x** 🔥 | 6.32% | 600MB | **#1 Speed Champion** |
| **Distil-Whisper Small** | 244M | **6x** | ~7% | 250MB | **Desktop English** |
| **Moonshine Base** | ~200M | **5-15x** | 12.8% | 200MB | **Mobile/Edge** |
| **Whisper Base** | 74M | 1x | 12.7% | 150MB | Baseline |
| **Moonshine Tiny** | ~40M | **5-15x** | 13.5% | 40MB | **Ultra-lightweight** |

## Detailed Comparison

### 1. 🚀 NVIDIA Parakeet TDT 0.6B v3 (FASTEST)

**Why Choose:**
- **3,333x real-time**: Transcribes 1 hour of audio in 1 second!
- Excellent accuracy (6.32% WER)
- 25 European languages supported
- 600M parameters - perfect balance

**Stats:**
- Model: `nvidia/parakeet-tdt-0.6b-v3`
- Size: ~600MB
- Languages: en, de, fr, es, it, pt, pl, nl, ro, cs, sk, bg, hr, sl, sr, mk, uk, be, et, lv, lt, mt, ga, cy
- Architecture: Fast Conformer + TDT
- License: CC-BY-4.0

**Performance:**
```
Audio Length: 1 hour
Processing Time: ~1 second
Throughput: 3,600x faster than typing
```

**Use Cases:**
- Real-time transcription
- Batch processing
- Server-side transcription
- Live captioning

**Installation:**
```bash
./install-parakeet.sh
```

---

### 2. ⚡ Distil-Whisper Small (244M)

**Why Choose:**
- 6x faster than Whisper
- Within 1% WER of Whisper
- Excellent for English
- Production-proven

**Stats:**
- Model: `distil-whisper/distil-small.en`
- Size: ~250MB
- Languages: English only
- Architecture: Distilled from Whisper
- License: MIT

**Performance:**
```
Speed: 6x real-time
Accuracy: ~7% WER
Best for: Desktop English transcription
```

**Installation:**
```bash
./install-distil-whisper.sh
```

---

### 3. 🌙 Moonshine Base (~200M)

**Why Choose:**
- Optimized for edge devices
- Variable-length encoding (efficient)
- Good noise robustness
- Mobile-friendly

**Stats:**
- Model: `moonshine/base`
- Size: ~200MB
- Languages: English + multilingual
- Architecture: Variable-length encoder
- Training: 200K hours

**Performance:**
```
Speed: 5-15x real-time (depends on audio length)
Accuracy: 12.8% WER
Best for: Mobile apps, IoT devices
```

**Installation:**
```bash
./install-moonshine.sh
```

---

### 4. 📱 Moonshine Tiny (~40M - Ultra-Lightweight)

**Why Choose:**
- Smallest model (only 40MB!)
- Still 5-15x faster than real-time
- Perfect for mobile apps
- Low memory footprint

**Stats:**
- Model: `moonshine/tiny`
- Size: ~40MB
- Languages: English
- Memory: <100MB RAM

**Performance:**
```
Speed: 5-15x real-time
Accuracy: 13.5% WER
Best for: Mobile, embedded systems
```

---

### 5. Whisper Base (74M - Baseline)

**Stats:**
- Model: `openai/whisper-base`
- Size: ~150MB
- Languages: 99 languages
- Architecture: Transformer encoder-decoder

**Performance:**
```
Speed: 1x real-time
Accuracy: 12.7% WER
Best for: Fallback option
```

---

## Model Selection Guide

### For Maximum Speed:
```
1. Parakeet TDT v3 (3,333x) 🏆
2. Moonshine Base (5-15x)
3. Distil-Whisper Small (6x)
```

### For Mobile/Edge:
```
1. Moonshine Tiny (40MB) 🏆
2. Moonshine Base (200MB)
3. Whisper Tiny (75MB)
```

### For Desktop:
```
1. Parakeet TDT v3 (fastest + accurate) 🏆
2. Distil-Whisper Small (English only)
3. Moonshine Base
```

### For Best Accuracy (under 1B):
```
1. Parakeet TDT v3 (6.32% WER) 🏆
2. Distil-Whisper Small (~7% WER)
3. Whisper Base (12.7% WER)
```

### For Multilingual (under 1B):
```
1. Parakeet TDT v3 (25 languages) 🏆
2. Moonshine Base
3. Whisper Base (99 languages, but slower)
```

---

## Performance Benchmarks

### Speed Comparison (10s audio clip):

| Model | Processing Time | RTFx |
|-------|----------------|------|
| Parakeet TDT v3 | **0.003s** | 3,333x |
| Moonshine Base | 0.8s | 12x |
| Distil-Whisper Small | 1.7s | 6x |
| Whisper Base | 10s | 1x |

### Memory Usage:

| Model | RAM Usage | VRAM (GPU) |
|-------|-----------|------------|
| Moonshine Tiny | ~100MB | N/A |
| Whisper Base | ~300MB | ~500MB |
| Moonshine Base | ~400MB | N/A |
| Distil-Whisper Small | ~600MB | ~1GB |
| Parakeet TDT v3 | ~1.2GB | ~2GB |

---

## Installation Quick Reference

```bash
# Fastest model (3,333x)
./install-parakeet.sh

# Best for mobile (40MB)
./install-moonshine.sh

# Best for English desktop (6x)
./install-distil-whisper.sh

# Install all for automatic fallback
./install-parakeet.sh
./install-moonshine.sh
./install-distil-whisper.sh
```

---

## Architecture Comparison

### Parakeet TDT v3
- **Encoder**: Fast Conformer (2x faster than standard)
- **Decoder**: Token-and-Duration Transducer (TDT)
- **Optimization**: Highly optimized for throughput
- **Training**: NVIDIA Granary dataset

### Moonshine
- **Encoder**: Variable-length (no padding)
- **Decoder**: Lightweight
- **Optimization**: Edge-focused, low latency
- **Training**: 200K hours diverse data

### Distil-Whisper
- **Encoder**: Same as Whisper
- **Decoder**: Distilled (4 layers vs 32)
- **Optimization**: Knowledge distillation
- **Training**: Teacher-student from Whisper

---

## Why Under 1B Parameters?

1. **Edge Deployment**: Fits on mobile devices
2. **Fast Inference**: Lower compute requirements
3. **Lower Latency**: Critical for real-time use
4. **Cost-Effective**: Cheaper to run at scale
5. **Privacy**: Can run fully offline
6. **Battery Life**: Important for mobile apps

---

## Recommended Defaults

**Listen App Auto-Selection:**
- Desktop: Parakeet TDT v3 (if installed), else Distil-Whisper
- Mobile: Moonshine Tiny
- Server: Parakeet TDT v3

**Manual Selection:**
```typescript
// For maximum speed
const text = await service.transcribe('audio.wav', {
  routingPreferences: { preferredModel: 'Parakeet TDT 0.6B V3' }
});

// For mobile optimization
const text = await service.transcribe('audio.wav', {
  routingPreferences: { platform: 'mobile' }
});
```

---

## Future: Even Smaller Models

Coming soon:
- Moonshine Nano (~10MB)
- Whisper-Distil Tiny (~80MB)
- Parakeet TDT 0.3B

All under 1B parameters!
