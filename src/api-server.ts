/**
 * api-server.ts
 *
 * REST API server for Listen
 * Allows other applications to use Listen's transcription capabilities
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { ModularTranscriptionService } from './transcription-router';
import { RoutingPreferences } from './models/ModelRouter';

export interface APIServerConfig {
  port: number;
  host: string;
  enableCORS: boolean;
  maxFileSize: number;  // in bytes
}

export class APIServer {
  private server: http.Server | null = null;
  private transcriptionService: ModularTranscriptionService;
  private config: APIServerConfig;

  constructor(config: Partial<APIServerConfig> = {}) {
    this.config = {
      port: config.port || 8765,
      host: config.host || '127.0.0.1',
      enableCORS: config.enableCORS !== false,
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024  // 100MB default
    };

    this.transcriptionService = new ModularTranscriptionService();
  }

  async start(): Promise<void> {
    // Initialize transcription service
    await this.transcriptionService.initialize();

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    return new Promise((resolve, reject) => {
      this.server!.listen(this.config.port, this.config.host, () => {
        console.log(`API Server listening on http://${this.config.host}:${this.config.port}`);
        resolve();
      });

      this.server!.on('error', reject);
    });
  }

  stop(): Promise<void> {
    if (!this.server) return Promise.resolve();

    return new Promise((resolve) => {
      this.server!.close(() => {
        console.log('API Server stopped');
        resolve();
      });
    });
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    // Enable CORS if configured
    if (this.config.enableCORS) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    // Handle OPTIONS (preflight) requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    // Route handling
    if (req.method === 'GET' && url.pathname === '/') {
      this.handleRoot(req, res);
    } else if (req.method === 'GET' && url.pathname === '/health') {
      this.handleHealth(req, res);
    } else if (req.method === 'GET' && url.pathname === '/models') {
      this.handleModels(req, res);
    } else if (req.method === 'POST' && url.pathname === '/transcribe') {
      this.handleTranscribe(req, res);
    } else if (req.method === 'POST' && url.pathname === '/transcribe-file') {
      this.handleTranscribeFile(req, res);
    } else {
      this.sendJSON(res, 404, { error: 'Not found' });
    }
  }

  private handleRoot(req: http.IncomingMessage, res: http.ServerResponse) {
    const docs = {
      name: 'Listen API Server',
      version: '1.0.0',
      endpoints: {
        'GET /': 'API documentation',
        'GET /health': 'Health check',
        'GET /models': 'List available models',
        'POST /transcribe': 'Transcribe audio from base64',
        'POST /transcribe-file': 'Transcribe audio file from path'
      },
      examples: {
        transcribe: {
          method: 'POST',
          url: '/transcribe',
          body: {
            audio: 'base64_encoded_audio_data',
            preferences: {
              priority: 'speed',
              language: 'en'
            }
          }
        },
        transcribeFile: {
          method: 'POST',
          url: '/transcribe-file',
          body: {
            path: '/path/to/audio.wav',
            preferences: {
              priority: 'accuracy'
            }
          }
        }
      }
    };

    this.sendJSON(res, 200, docs);
  }

  private handleHealth(req: http.IncomingMessage, res: http.ServerResponse) {
    this.sendJSON(res, 200, {
      status: 'ok',
      uptime: process.uptime(),
      models: this.transcriptionService.getAvailableModels().length
    });
  }

  private handleModels(req: http.IncomingMessage, res: http.ServerResponse) {
    const models = this.transcriptionService.getAvailableModels();
    this.sendJSON(res, 200, { models });
  }

  private async handleTranscribe(req: http.IncomingMessage, res: http.ServerResponse) {
    try {
      const body = await this.readBody(req);
      const data = JSON.parse(body);

      if (!data.audio) {
        this.sendJSON(res, 400, { error: 'Missing "audio" field (base64)' });
        return;
      }

      // Decode base64 audio
      const audioBuffer = Buffer.from(data.audio, 'base64');

      // Save to temporary file
      const tempPath = path.join('/tmp', `listen_api_${Date.now()}.wav`);
      fs.writeFileSync(tempPath, audioBuffer);

      try {
        // Transcribe
        const preferences = data.preferences as RoutingPreferences | undefined;
        const text = await this.transcriptionService.transcribe(tempPath, {
          routingPreferences: preferences
        });

        this.sendJSON(res, 200, {
          text,
          wordCount: text.split(/\s+/).length,
          characterCount: text.length
        });
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    } catch (error) {
      this.sendJSON(res, 500, {
        error: error instanceof Error ? error.message : 'Transcription failed'
      });
    }
  }

  private async handleTranscribeFile(req: http.IncomingMessage, res: http.ServerResponse) {
    try {
      const body = await this.readBody(req);
      const data = JSON.parse(body);

      if (!data.path) {
        this.sendJSON(res, 400, { error: 'Missing "path" field' });
        return;
      }

      if (!fs.existsSync(data.path)) {
        this.sendJSON(res, 404, { error: 'Audio file not found' });
        return;
      }

      // Transcribe
      const preferences = data.preferences as RoutingPreferences | undefined;
      const text = await this.transcriptionService.transcribe(data.path, {
        routingPreferences: preferences
      });

      this.sendJSON(res, 200, {
        text,
        wordCount: text.split(/\s+/).length,
        characterCount: text.length
      });
    } catch (error) {
      this.sendJSON(res, 500, {
        error: error instanceof Error ? error.message : 'Transcription failed'
      });
    }
  }

  private readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      let size = 0;

      req.on('data', (chunk) => {
        size += chunk.length;

        if (size > this.config.maxFileSize) {
          reject(new Error('Request body too large'));
          return;
        }

        body += chunk.toString();
      });

      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  }

  private sendJSON(res: http.ServerResponse, status: number, data: any) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }
}

// Example usage:
/*
const server = new APIServer({ port: 8765 });
await server.start();

// Test with curl:
// curl -X POST http://localhost:8765/transcribe-file \
//   -H "Content-Type: application/json" \
//   -d '{"path": "/path/to/audio.wav", "preferences": {"priority": "speed"}}'
*/
