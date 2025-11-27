# Quick Setup for WSL2 - Lightweight Options

If you're having issues with Parakeet/NeMo installation, here are simpler alternatives:

## 🚀 EASIEST: Faster-Whisper (Recommended for WSL2)

**Why:** Simple installation, no complex dependencies, 4x faster than Whisper

```bash
# One-line install
pip3 install faster-whisper

# That's it!
```

**Pros:**
- ✅ Minimal dependencies
- ✅ 4x faster than standard Whisper
- ✅ Good accuracy (same as Whisper)
- ✅ Easy to install in WSL2
- ✅ Small download (~150MB)

**Cons:**
- ⚠️ Not as fast as Parakeet (4x vs 3,333x)

---

## 🌙 LIGHTWEIGHT: Distil-Whisper

**Why:** 6x faster, best for English, proven in production

```bash
./install-distil-whisper.sh
```

**Pros:**
- ✅ 6x faster than Whisper
- ✅ Excellent for English
- ✅ Stable Hugging Face Transformers
- ✅ ~250MB model

**Cons:**
- ⚠️ English only
- ⚠️ Requires PyTorch + Transformers

---

## 💪 BEST BALANCE: Whisper.cpp

**Why:** C++ implementation, no Python dependencies

```bash
./setup-whisper.sh
```

**Pros:**
- ✅ No Python dependency hell
- ✅ Native C++ (fast)
- ✅ Works reliably in WSL2
- ✅ Multiple models (tiny to large)

**Cons:**
- ⚠️ Requires compilation
- ⚠️ Only 2x faster than baseline

---

## 📊 Comparison Table

| Model | Install Difficulty | Speed | Size | WSL2 Compatible |
|-------|-------------------|-------|------|-----------------|
| **Faster-Whisper** ⭐ | Easy | 4x | 150MB | ✅ Perfect |
| **Distil-Whisper** | Medium | 6x | 250MB | ✅ Good |
| **Whisper.cpp** | Medium | 2x | 150MB | ✅ Good |
| **Moonshine** | Medium | 5-15x | 200MB | ✅ Good (if install works) |
| **Parakeet** | Hard | 3,333x | 600MB | ⚠️ Complex (NeMo issues) |

---

## 🎯 My Recommendation for WSL2:

### Option 1: Quick Start (5 minutes)
```bash
pip3 install faster-whisper
npm run build
npm start
```

### Option 2: Best English Performance (10 minutes)
```bash
./install-distil-whisper.sh
npm run build
npm start
```

### Option 3: C++ Native (15 minutes)
```bash
./setup-whisper.sh
npm run build
npm start
```

---

## 🐛 If Parakeet Install Fails:

**Don't waste time debugging!** Parakeet requires NVIDIA NeMo which has complex dependencies that often conflict in WSL2.

**Instead:**
1. Cancel the installation (Ctrl+C)
2. Use `pip3 install faster-whisper` (takes 30 seconds)
3. You'll get 4x speedup with zero hassle

**Or wait for the fix:** I've updated the install-parakeet.sh script with workarounds, but it may still have issues depending on your WSL2 setup.

---

## 🧪 Test Any Model:

After installing any model:

```bash
# Test transcription
python3 -c "
from faster_whisper import WhisperModel
model = WhisperModel('base')
segments, info = model.transcribe('test.wav')
for segment in segments:
    print(segment.text)
"
```

Replace `faster_whisper` with your chosen library.

---

## ✅ Best Practice:

**Install multiple models** for automatic fallback:

```bash
pip3 install faster-whisper    # Fast, reliable
./install-distil-whisper.sh    # Faster, English
./install-moonshine.sh         # Fastest that works
```

The app will automatically use the fastest available!

---

## 💡 Pro Tip:

For WSL2, stick with Python-based models (faster-whisper, distil-whisper) rather than complex frameworks (NeMo, ONNX) to avoid dependency conflicts.
