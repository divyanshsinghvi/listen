/**
 * PythonWhisperModel.ts
 *
 * Python Whisper model implementation
 * Standard OpenAI Whisper (fallback option)
 */

import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { STTModel, TranscriptionOptions, TranscriptionResult, ModelInfo } from './ModelInterface';

const execAsync = promisify(exec);

export class PythonWhisperModel extends STTModel {
  private modelVariant: string;

  constructor(modelVariant: string = 'base') {
    super('python-whisper', undefined);
    this.modelVariant = modelVariant;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('python3 -c "import whisper"');
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
    const language = options?.language || 'en';

    const { stdout } = await execAsync(
      `whisper "${audioFilePath}" --model ${this.modelVariant} --language ${language} --output_format txt --output_dir /tmp`
    );

    const duration = Date.now() - startTime;

    // Read output file
    const outputFile = audioFilePath.replace('.wav', '.txt');
    const txtFile = path.join('/tmp', path.basename(outputFile));

    const fs = require('fs');
    let text = '';

    if (fs.existsSync(txtFile)) {
      text = fs.readFileSync(txtFile, 'utf-8');
      fs.unlinkSync(txtFile);
    }

    return {
      text: text.trim(),
      duration,
    };
  }

  getInfo(): ModelInfo {
    return {
      name: `Python Whisper ${this.modelVariant}`,
      type: 'whisper',
      speed: 'slow',
      accuracy: 'good',
      sizeCategory: 'small',
      languages: ['multilingual'],
      requiresGPU: false,
      estimatedMemory: '150MB',
      rtfSpeed: 1,
    };
  }

  async cleanup(): Promise<void> {}
}
