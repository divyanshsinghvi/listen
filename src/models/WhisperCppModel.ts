/**
 * WhisperCppModel.ts
 *
 * Whisper.cpp model implementation
 * Fast C++ implementation of Whisper
 */

import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { STTModel, TranscriptionOptions, TranscriptionResult, ModelInfo } from './ModelInterface';

const execAsync = promisify(exec);

export class WhisperCppModel extends STTModel {
  constructor(modelVariant: string = 'base') {
    const modelPath = path.join(process.cwd(), 'models', `ggml-${modelVariant}.bin`);
    super('whisper-cpp', modelPath);
  }

  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('which whisper-cpp');
      return fs.existsSync(this.modelPath!);
    } catch {
      try {
        await execAsync('which main');
        return fs.existsSync(this.modelPath!);
      } catch {
        return false;
      }
    }
  }

  async initialize(): Promise<void> {}

  async transcribe(
    audioFilePath: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    const language = options?.language || 'en';

    try {
      const { stdout } = await execAsync(
        `whisper-cpp -m ${this.modelPath} -f ${audioFilePath} -nt -l ${language}`
      );

      const duration = Date.now() - startTime;
      const text = this.cleanTranscription(stdout);

      return { text, duration };
    } catch {
      // Try alternative executable name
      const { stdout } = await execAsync(
        `main -m ${this.modelPath} -f ${audioFilePath} -nt -l ${language}`
      );

      const duration = Date.now() - startTime;
      const text = this.cleanTranscription(stdout);

      return { text, duration };
    }
  }

  private cleanTranscription(text: string): string {
    return text
      .replace(/\[.*?\]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  }

  getInfo(): ModelInfo {
    return {
      name: 'Whisper.cpp Base',
      type: 'whisper-cpp',
      speed: 'medium',
      accuracy: 'good',
      sizeCategory: 'small',
      languages: ['multilingual'],
      requiresGPU: false,
      estimatedMemory: '150MB',
      rtfSpeed: 2,
    };
  }

  async cleanup(): Promise<void> {}
}
