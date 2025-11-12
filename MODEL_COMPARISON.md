# Speech-to-Text Model Comparison (2025)

Comprehensive comparison of state-of-the-art open-source STT models for the Listen app.

## Performance Leaderboard (RTFx - Real-Time Factor)

Higher RTFx means faster processing. RTFx of 100 means the model processes audio 100x faster than real-time.

| Model | RTFx Speed | WER | Size | Best For |
|-------|-----------|-----|------|----------|
| **Canary Qwen 2.5B** | 418x | 5.63% | 2.5GB | Production servers |
| **Whisper Large V3 Turbo** | 216x | ~6% | 1.5GB | High accuracy + speed |
| **SenseVoice-Small** | ~150x | ~5% | 220MB | Asian languages, edge |
| **Voxtral 3B** | ~100x | <5% | 3GB | Edge deployment |
| **Moonshine Base** | 5-15x | 12.8% | 200MB | **Mobile/Edge (Recommended)** |
| **Distil-Whisper Small** | 6x | ~7% | 250MB | **Desktop (Recommended)** |
| **Whisper Base** | 1x | 12.7% | 150MB | Baseline |

## Detailed Model Analysis

### 1. Canary Qwen 2.5B ⚡ FASTEST
**Developer:** NVIDIA
**Released:** 2024
**Performance:** 418x real-time speed

**Pros:**
- Tops Hugging Face Open ASR leaderboard
- Extremely fast inference
- State-of-the-art accuracy (5.63% WER)

**Cons:**
- Large model size (2.5GB)
- Requires significant compute resources
- Not optimized for edge devices

**Best Use Case:** Cloud servers, batch transcription

---

### 2. Whisper Large V3 Turbo ⚡⚡
**Developer:** OpenAI
**Released:** Nov 2024
**Performance:** 216x real-time, 5.4x faster than Whisper v2

**Pros:**
- Official OpenAI model
- Reduced decoder layers (32→4) for speed
- Maintains similar accuracy to Large v2
- Wide language support

**Cons:**
- Still large (1.5GB)
- Not ideal for real-time on low-end devices

**Best Use Case:** Desktop apps, high-accuracy requirements

---

### 3. Moonshine 🌙 BEST FOR MOBILE
**Developer:** Useful Sensors
**Released:** Oct 2024
**Performance:** 5-15x faster than Whisper

**Pros:**
- **Optimized specifically for edge devices**
- Variable-length encoder (no zero-padding)
- 5x faster on 10s clips
- Tiny model: ~200MB
- Robust to noise
- 200,000 hours training data

**Cons:**
- Slightly higher WER than Whisper (12.8% vs 12.7%)
- Newer model, less battle-tested

**Best Use Case:** **Mobile apps (iOS/Android), embedded systems**

**Architecture Advantage:**
- Compute scales with audio length
- No fixed-window processing
- Lower memory footprint

---

### 4. Distil-Whisper 🚀 BEST FOR DESKTOP
**Developer:** Hugging Face
**Released:** Nov 2023
**Performance:** 6x faster than Whisper

**Pros:**
- **6x faster, 49% smaller**
- Within 1% WER of Whisper
- 1.3x fewer word duplicates
- 2.1% lower insertion error rate
- Production-ready

**Cons:**
- **English-only** (currently)
- Not as fast as newer models

**Best Use Case:** **Desktop Electron app, English transcription**

**Why Recommended:**
- Best balance of speed/accuracy for English
- Proven in production
- Lower resource usage than Whisper

---

### 5. SenseVoice-Small 🌏 BEST FOR ASIAN LANGUAGES
**Developer:** Alibaba (FunAudioLLM)
**Released:** 2024
**Performance:** 15x faster than Whisper-Large

**Pros:**
- **Ultra-fast: 70ms for 10s audio**
- Non-autoregressive architecture
- **Excellent for Chinese, Cantonese, Japanese, Korean**
- Emotion detection
- Punctuation detection

**Cons:**
- Less tested for non-Asian languages
- Smaller community

**Best Use Case:** Asian language support, real-time applications

---

### 6. Voxtral 🔥
**Developer:** Mistral AI
**Released:** Jan 2025
**Performance:** Outperforms Whisper Large v3

**Pros:**
- State-of-the-art accuracy
- Two sizes: 24B (production), 3B (edge)
- Comprehensive language support

**Cons:**
- Very new (Jan 2025)
- 24B version requires significant resources
- Limited benchmarks available

**Best Use Case:** Cutting-edge applications, multi-language

---

### 7. Meta Omnilingual ASR 🌍
**Developer:** Meta
**Released:** 2025
**Performance:** Similar to Whisper

**Pros:**
- **1,600+ languages** (vs Whisper's 99)
- Massive language coverage
- Open source

**Cons:**
- Slower than specialized models
- Large model size

**Best Use Case:** Rare language support, global applications

---

## Model Selection Guide

### For Mobile Apps (iOS/Android):
```
1st Choice: Moonshine Base/Tiny
2nd Choice: Distil-Whisper Small (English only)
3rd Choice: Whisper Tiny (fallback)
```

### For Desktop Apps (Electron):
```
1st Choice: Distil-Whisper Small (English)
2nd Choice: Moonshine Base
3rd Choice: Whisper Large V3 Turbo
```

### For Web Apps:
```
1st Choice: Moonshine Base (WASM)
2nd Choice: Whisper Tiny (WASM)
```

### For Servers/Cloud:
```
1st Choice: Canary Qwen 2.5B
2nd Choice: Whisper Large V3 Turbo
3rd Choice: Voxtral 24B
```

### For Asian Languages:
```
1st Choice: SenseVoice-Small
2nd Choice: Voxtral
3rd Choice: Whisper Large V3
```

### For Rare Languages:
```
1st Choice: Meta Omnilingual ASR
2nd Choice: Voxtral
3rd Choice: Whisper Large V3
```

## Speed vs Accuracy Trade-off

```
Speed Priority:
Canary Qwen → Whisper V3 Turbo → Distil-Whisper → Moonshine

Accuracy Priority:
Voxtral → Canary Qwen → Whisper V3 Turbo → Distil-Whisper

Balance:
Distil-Whisper (Desktop), Moonshine (Mobile)

Size Priority:
Moonshine Tiny (40MB) → Whisper Tiny (75MB) → SenseVoice (220MB)
```

## Deployment Recommendations for Listen App

### Current Implementation:
- ✅ Whisper (all variants)
- ✅ faster-whisper
- ✅ whisper.cpp
- ✅ Distil-Whisper (NEW)
- ✅ Moonshine (NEW)

### Recommended Default Models:

**Desktop (Electron):**
```
Primary: Distil-Whisper Small (English)
Fallback: Moonshine Base (multilingual)
Fallback: faster-whisper Base
```

**iOS:**
```
Primary: Moonshine Tiny (CoreML)
Fallback: WhisperKit Tiny
```

**Android:**
```
Primary: Moonshine Tiny (TFLite)
Fallback: Whisper Tiny (TFLite)
```

## Benchmark Summary

| Metric | Winner | Value |
|--------|--------|-------|
| **Fastest Overall** | Canary Qwen 2.5B | 418x RTF |
| **Best for Mobile** | Moonshine | 5-15x + small size |
| **Best Accuracy** | Voxtral 24B | <5% WER |
| **Best Balance** | Distil-Whisper | 6x speed, 1% WER penalty |
| **Smallest** | Moonshine Tiny | ~40MB |
| **Most Languages** | Meta Omnilingual | 1,600+ |

## Installation Guide

See individual installation scripts:
- `install-moonshine.sh` - Moonshine (recommended for mobile/edge)
- `install-distil-whisper.sh` - Distil-Whisper (recommended for desktop)
- `install-python-whisper.sh` - Standard Whisper (baseline)
- `setup-whisper.sh` - whisper.cpp (C++ implementation)

## References

1. [Modal Blog: Top STT Models 2025](https://modal.com/blog/open-source-stt)
2. [Moonshine Paper](https://arxiv.org/html/2410.15608v2)
3. [Distil-Whisper GitHub](https://github.com/huggingface/distil-whisper)
4. [Mistral Voxtral](https://mistral.ai/news/voxtral)
5. [SenseVoice Hugging Face](https://huggingface.co/FunAudioLLM/SenseVoiceSmall)
