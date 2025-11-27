/**
 * ModelInterface.ts
 *
 * Abstract interface for all STT models
 * Enables easy model swapping and routing
 */

export interface TranscriptionOptions {
  language?: string;
  task?: 'transcribe' | 'translate';
  temperature?: number;
  model?: string; // Model variant (tiny, base, small, medium, large)
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  duration?: number; // Processing time in ms
  language?: string;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

export abstract class STTModel {
  protected modelName: string;
  protected modelPath?: string;

  constructor(modelName: string, modelPath?: string) {
    this.modelName = modelName;
    this.modelPath = modelPath;
  }

  /**
   * Check if this model is available on the system
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Transcribe audio file
   */
  abstract transcribe(
    audioFilePath: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult>;

  /**
   * Get model information
   */
  abstract getInfo(): ModelInfo;

  /**
   * Initialize/load the model
   */
  abstract initialize(): Promise<void>;

  /**
   * Cleanup resources
   */
  abstract cleanup(): Promise<void>;
}

export interface ModelInfo {
  name: string;
  version?: string;
  type: 'moonshine' | 'distil-whisper' | 'whisper' | 'faster-whisper' | 'whisper-cpp' | 'sensevoice' | 'canary' | 'voxtral';
  speed: 'ultra-fast' | 'fast' | 'medium' | 'slow'; // Relative speed
  accuracy: 'excellent' | 'good' | 'fair'; // Relative accuracy
  sizeCategory: 'tiny' | 'small' | 'medium' | 'large';
  languages: string[]; // Supported languages
  requiresGPU: boolean;
  estimatedMemory: string; // e.g., "200MB", "1.5GB"
  rtfSpeed?: number; // Real-time factor (e.g., 5 means 5x faster than real-time)
}
