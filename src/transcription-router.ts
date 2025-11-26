/**
 * transcription-router.ts
 *
 * Modern transcription service using the modular model router
 * Replaces the old monolithic transcription.ts
 */

import { ModelRouter, RoutingPreferences } from './models/ModelRouter';
import { TranscriptionOptions, TranscriptionResult } from './models/ModelInterface';

export class ModularTranscriptionService {
  private router: ModelRouter;
  private initialized: boolean = false;

  constructor() {
    this.router = new ModelRouter();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.router.initialize();
    this.initialized = true;
  }

  /**
   * Transcribe audio with automatic model selection
   */
  async transcribe(
    audioFilePath: string,
    options?: {
      transcriptionOptions?: TranscriptionOptions;
      routingPreferences?: RoutingPreferences;
    }
  ): Promise<TranscriptionResult & { modelUsed: string }> {
    if (!this.initialized) {
      console.log('📌 Service not initialized, initializing now...');
      await this.initialize();
    }

    try {
      console.log('🎯 Stage 1.1: Selecting best model...');
      const startTime = Date.now();

      const result = await this.router.transcribe(
        audioFilePath,
        options?.transcriptionOptions,
        options?.routingPreferences
      );

      const serviceTime = Date.now() - startTime;
      console.log(`✓ Stage 1.2: Model selected and used for transcription`);
      console.log(`  Model: ${result.modelUsed}`);
      console.log(`  Text length: ${result.text.length} characters`);
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`  Service duration: ${serviceTime}ms`);

      return result;
    } catch (error) {
      console.error('❌ Transcription error:', error);
      throw error;
    }
  }

  /**
   * Get list of available models
   */
  getAvailableModels() {
    return this.router.getAvailableModels();
  }

  /**
   * Transcribe with specific model
   */
  async transcribeWithModel(
    audioFilePath: string,
    modelName: string,
    options?: TranscriptionOptions
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const model = this.router.getModelByName(modelName);
    if (!model) {
      throw new Error(`Model not found: ${modelName}`);
    }

    const result = await model.transcribe(audioFilePath, options);
    console.log(`Transcribed with ${modelName} in ${result.duration}ms`);

    return result.text;
  }
}

// Example usage:
/*
const service = new ModularTranscriptionService();
await service.initialize();

// Auto-select model (fastest available)
const text1 = await service.transcribe('audio.wav', {
  routingPreferences: { priority: 'speed' }
});

// Auto-select for English desktop use
const text2 = await service.transcribe('audio.wav', {
  routingPreferences: {
    priority: 'balance',
    language: 'en',
    platform: 'desktop'
  }
});

// Use specific model
const text3 = await service.transcribeWithModel('audio.wav', 'Moonshine tiny');

// List available models
const models = service.getAvailableModels();
console.log('Available models:', models);
*/
