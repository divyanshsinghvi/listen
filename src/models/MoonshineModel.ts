/**
 * MoonshineModel.ts
 *
 * Moonshine STT model implementation
 * Optimized for edge devices, 5-15x faster than Whisper
 */

import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { STTModel, TranscriptionOptions, TranscriptionResult, ModelInfo } from './ModelInterface';

const execAsync = promisify(exec);

export class MoonshineModel extends STTModel {
  private scriptPath: string;
  private modelVariant: 'tiny' | 'base';

  constructor(modelVariant: 'tiny' | 'base' = 'tiny') {
    super('moonshine', undefined);
    this.modelVariant = modelVariant;
    this.scriptPath = path.join(__dirname, 'moonshine_transcribe.py');
  }

  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('python3 -c "import moonshine_onnx"');
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
      confidence: 0.9, // Moonshine typically has good confidence
    };
  }

  getInfo(): ModelInfo {
    return {
      name: `Moonshine ${this.modelVariant}`,
      type: 'moonshine',
      speed: 'ultra-fast',
      accuracy: this.modelVariant === 'base' ? 'good' : 'fair',
      sizeCategory: this.modelVariant,
      languages: ['en', 'multilingual'],
      requiresGPU: false,
      estimatedMemory: this.modelVariant === 'tiny' ? '40MB' : '200MB',
      rtfSpeed: 10, // Average 5-15x
    };
  }

  async cleanup(): Promise<void> {
    // No persistent resources to clean
  }
}
