/**
 * DistilWhisperModel.ts
 *
 * Distil-Whisper STT model implementation
 * 6x faster than Whisper, 49% smaller, within 1% WER
 */

import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { STTModel, TranscriptionOptions, TranscriptionResult, ModelInfo } from './ModelInterface';

const execAsync = promisify(exec);

export class DistilWhisperModel extends STTModel {
  private scriptPath: string;
  private modelVariant: 'small' | 'medium' | 'large-v3';

  constructor(modelVariant: 'small' | 'medium' | 'large-v3' = 'small') {
    super('distil-whisper', undefined);
    this.modelVariant = modelVariant;
    this.scriptPath = path.join(__dirname, 'distil_whisper_transcribe.py');
  }

  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('python3 -c "from transformers import pipeline; import torch"');
      return true;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {
    // Model is loaded on-demand by the Python script
  }

  async transcribe(
    audioFilePath: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    // Create Python script if it doesn't exist
    if (!fs.existsSync(this.scriptPath)) {
      this.createTranscriptionScript();
    }

    const { stdout } = await execAsync(
      `python3 ${this.scriptPath} "${audioFilePath}" ${this.modelVariant}`
    );

    const duration = Date.now() - startTime;

    return {
      text: stdout.trim(),
      duration,
      confidence: 0.95, // Distil-Whisper has excellent accuracy
      language: 'en', // Currently English-only
    };
  }

  private createTranscriptionScript() {
    const script = `#!/usr/bin/env python3
"""
Distil-Whisper Transcription Script
6x faster than Whisper, 49% smaller
"""
import sys
from transformers import pipeline
import torch

# Use CUDA if available
device = 0 if torch.cuda.is_available() else -1

model_sizes = {
    'small': 'distil-whisper/distil-small.en',
    'medium': 'distil-whisper/distil-medium.en',
    'large-v3': 'distil-whisper/distil-large-v3'
}

audio_path = sys.argv[1]
model_variant = sys.argv[2] if len(sys.argv) > 2 else 'small'

model_id = model_sizes.get(model_variant, 'distil-whisper/distil-small.en')

try:
    pipe = pipeline('automatic-speech-recognition',
                    model=model_id,
                    device=device)

    result = pipe(audio_path)
    print(result['text'])
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
`;

    fs.writeFileSync(this.scriptPath, script);
    fs.chmodSync(this.scriptPath, '755');
  }

  getInfo(): ModelInfo {
    const sizeMap = {
      'small': 'small' as const,
      'medium': 'medium' as const,
      'large-v3': 'large' as const,
    };

    const memoryMap = {
      'small': '250MB',
      'medium': '750MB',
      'large-v3': '1.5GB',
    };

    return {
      name: `Distil-Whisper ${this.modelVariant}`,
      type: 'distil-whisper',
      speed: 'fast',
      accuracy: 'excellent',
      sizeCategory: sizeMap[this.modelVariant],
      languages: ['en'], // English only for now
      requiresGPU: false,
      estimatedMemory: memoryMap[this.modelVariant],
      rtfSpeed: 6,
    };
  }

  async cleanup(): Promise<void> {
    // No persistent resources to clean
  }
}
