/**
 * FasterWhisperModel.ts
 *
 * Faster-Whisper model implementation
 * 4x faster than standard Whisper using CTranslate2
 */

import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { STTModel, TranscriptionOptions, TranscriptionResult, ModelInfo } from './ModelInterface';

const execAsync = promisify(exec);

export class FasterWhisperModel extends STTModel {
  private scriptPath: string;
  private modelVariant: string;

  constructor(modelVariant: string = 'base') {
    super('faster-whisper', undefined);
    this.modelVariant = modelVariant;
    this.scriptPath = path.join(__dirname, '../faster_whisper_transcribe.py');
  }

  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('python3 -c "from faster_whisper import WhisperModel"');
      return true;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {}

  async transcribe(
    audioFilePath: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    const { stdout } = await execAsync(
      `python3 ${this.scriptPath} "${audioFilePath}"`
    );

    const duration = Date.now() - startTime;

    return {
      text: stdout.trim(),
      duration,
    };
  }

  getInfo(): ModelInfo {
    return {
      name: `Faster-Whisper ${this.modelVariant}`,
      type: 'faster-whisper',
      speed: 'fast',
      accuracy: 'good',
      sizeCategory: 'small',
      languages: ['multilingual'],
      requiresGPU: false,
      estimatedMemory: '150MB',
      rtfSpeed: 4,
    };
  }

  async cleanup(): Promise<void> {}
}
