import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

export class RecordingManager {
  private audioFilePath: string;
  private recordingProcess: any = null;
  private recordingStream: any = null;
  private tempDir: string;
  private platform: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    this.audioFilePath = path.join(this.tempDir, `recording_${Date.now()}.wav`);
    this.platform = os.platform();
  }

  async startRecording(): Promise<void> {
    if (this.platform === 'win32') {
      return this.recordWithWindowsAudio();
    } else {
      return this.recordWithLinuxAudio();
    }
  }

  private recordWithWindowsAudio(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const record = require('node-record-lpcm16');
        const file = fs.createWriteStream(this.audioFilePath);

        // Start recording
        this.recordingStream = record.record({
          sampleRate: 16000,
          channels: 1,
          audioType: 'wav'
        });

        this.recordingStream.pipe(file);

        this.recordingStream.on('error', (error: Error) => {
          console.error('Recording error:', error);
          reject(error);
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private recordWithLinuxAudio(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if arecord is available (Linux)
        exec('which arecord', (error) => {
          if (error) {
            // Fallback to sox if available
            exec('which rec', (soxError) => {
              if (soxError) {
                reject(new Error('No audio recording tool found. Please install alsa-utils or sox.'));
                return;
              }
              // Use sox
              this.recordWithSox();
              resolve();
            });
          } else {
            // Use arecord
            this.recordWithArecord();
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private recordWithArecord(): void {
    const { spawn } = require('child_process');

    // Record with arecord: 16kHz, mono, 16-bit
    this.recordingProcess = spawn('arecord', [
      '-f', 'cd',           // CD quality
      '-t', 'wav',          // WAV format
      '-D', 'default',      // Default device
      '-r', '16000',        // 16kHz sample rate (optimal for Whisper)
      '-c', '1',            // Mono
      this.audioFilePath
    ]);

    this.recordingProcess.on('error', (error: Error) => {
      console.error('Recording error:', error);
    });
  }

  private recordWithSox(): void {
    const { spawn } = require('child_process');

    // Record with sox
    this.recordingProcess = spawn('rec', [
      '-r', '16000',        // 16kHz sample rate
      '-c', '1',            // Mono
      '-b', '16',           // 16-bit
      this.audioFilePath
    ]);

    this.recordingProcess.on('error', (error: Error) => {
      console.error('Recording error:', error);
    });
  }

  async stopRecording(): Promise<string> {
    return new Promise((resolve) => {
      if (this.platform === 'win32' && this.recordingStream) {
        // Stop Windows recording
        this.recordingStream.stop();

        // Wait for file to be written
        setTimeout(() => {
          resolve(this.audioFilePath);
        }, 500);
      } else if (this.recordingProcess) {
        this.recordingProcess.on('close', () => {
          resolve(this.audioFilePath);
        });

        // Send SIGINT to stop recording gracefully
        this.recordingProcess.kill('SIGINT');
      } else {
        resolve(this.audioFilePath);
      }
    });
  }

  cancelRecording(): void {
    if (this.platform === 'win32' && this.recordingStream) {
      this.recordingStream.stop();
      this.recordingStream = null;
    } else if (this.recordingProcess) {
      this.recordingProcess.kill('SIGKILL');
      this.recordingProcess = null;
    }

    // Delete the file if it exists
    if (fs.existsSync(this.audioFilePath)) {
      fs.unlinkSync(this.audioFilePath);
    }
  }

  cleanup(): void {
    // Clean up old recordings (keep only last 5)
    try {
      const files = fs.readdirSync(this.tempDir)
        .filter(f => f.startsWith('recording_') && f.endsWith('.wav'))
        .map(f => ({
          name: f,
          path: path.join(this.tempDir, f),
          time: fs.statSync(path.join(this.tempDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // Keep only 5 most recent
      files.slice(5).forEach(f => {
        fs.unlinkSync(f.path);
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}
