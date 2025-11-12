/**
 * DistilWhisperModel.ts
 *
 * Distil-Whisper STT model implementation
 * 6x faster than Whisper, 49% smaller, within 1% WER
 */

import * as path from 'path';
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
