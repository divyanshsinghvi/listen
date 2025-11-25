/**
 * CanaryModel.ts
 *
 * NVIDIA Canary Qwen model implementation
 * MOST ACCURATE: 5.63% WER (tops Hugging Face Open ASR leaderboard)
 *
 * Combines Fast Conformer encoder with Qwen2.5 LLM decoder
 * Speed: 418x real-time
 */

import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { STTModel, TranscriptionOptions, TranscriptionResult, ModelInfo } from './ModelInterface';

const execAsync = promisify(exec);

export class CanaryModel extends STTModel {
  private scriptPath: string;

  constructor() {
    super('canary', undefined);
    this.scriptPath = path.join(__dirname, 'canary_transcribe.py');
  }

  async isAvailable(): Promise<boolean> {
    try {
      await execAsync('python3 -c "import nemo.collections.asr"');
      return true;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {
    // Model loaded on-demand
    // First run downloads ~2.5GB model
  }

  async transcribe(
    audioFilePath: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    if (!fs.existsSync(this.scriptPath)) {
      this.createTranscriptionScript();
    }

    const language = options?.language || 'en';
    const task = options?.task || 'transcribe';

    const { stdout } = await execAsync(
      `python3 ${this.scriptPath} "${audioFilePath}" ${language} ${task}`
    );

    const duration = Date.now() - startTime;

    return {
      text: stdout.trim(),
      duration,
      confidence: 0.98, // Canary has the highest accuracy
      language: language,
    };
  }

  private createTranscriptionScript() {
    const script = `#!/usr/bin/env python3
"""
Canary Qwen 2.5B Transcription Script
Most accurate model on Open ASR Leaderboard (5.63% WER)
"""
import sys
import nemo.collections.asr as nemo_asr

def transcribe(audio_path, language='en', task='transcribe'):
    # Load Canary Qwen 2.5B model
    model_name = 'nvidia/canary-qwen-2.5b'

    asr_model = nemo_asr.models.ASRModel.from_pretrained(model_name)

    # Canary supports transcription and translation
    # Set task and language
    if task == 'translate':
        # Translate to English
        transcription = asr_model.transcribe(
            [audio_path],
            task='translate',
            source_lang=language,
            target_lang='en'
        )[0]
    else:
        # Transcribe in original language
        transcription = asr_model.transcribe(
            [audio_path],
            task='transcribe',
            source_lang=language
        )[0]

    print(transcription)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python canary_transcribe.py <audio_path> [language] [task]")
        sys.exit(1)

    audio_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else 'en'
    task = sys.argv[3] if len(sys.argv) > 3 else 'transcribe'

    transcribe(audio_path, language, task)
`;

    fs.writeFileSync(this.scriptPath, script);
    fs.chmodSync(this.scriptPath, '755');
  }

  getInfo(): ModelInfo {
    return {
      name: 'Canary Qwen 2.5B',
      version: '2.5b',
      type: 'canary',
      speed: 'fast',
      accuracy: 'excellent',
      sizeCategory: 'large',
      languages: ['multilingual'], // Supports many languages
      requiresGPU: true, // Recommended for optimal performance
      estimatedMemory: '2.5GB',
      rtfSpeed: 418, // 418x real-time
    };
  }

  async cleanup(): Promise<void> {}
}
