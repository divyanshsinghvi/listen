#!/usr/bin/env python3
"""
Direct test of Parakeet model
"""
import sys
import os

# Create a test audio file (5 seconds of silence)
import numpy as np
import soundfile as sf

print("Creating test audio file...")
sample_rate = 16000
duration = 5
audio_data = np.zeros((sample_rate * duration,), dtype=np.int16)
test_audio = '/tmp/test_audio.wav'
sf.write(test_audio, audio_data, sample_rate)
print(f"✓ Created test audio: {test_audio}")

# Test Parakeet
print("\n🔄 Testing Parakeet model...")
try:
    import nemo.collections.asr as nemo_asr

    print("Loading Parakeet model...")
    model = nemo_asr.models.ASRModel.from_pretrained('nvidia/parakeet-tdt-0.6b-v3')
    print("✓ Model loaded")

    print(f"Transcribing {test_audio}...")
    result = model.transcribe([test_audio])[0]
    print(f"\n✓ Transcription result:")
    print(f"  Type: {type(result)}")
    print(f"  Value: {result}")
    print(f"  Repr: {repr(result)}")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
