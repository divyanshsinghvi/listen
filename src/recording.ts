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
        const { spawn } = require('child_process');

        // Use PyAudioWPatch for fast, reliable Windows audio recording
        const scriptPath = path.join(__dirname, '..', '..', 'record_audio_fast.py');

        // Create optimized PyAudioWPatch recording script if it doesn't exist
        if (!fs.existsSync(scriptPath)) {
          const script = `#!/usr/bin/env python3
"""
Fast Windows Audio Recording using PyAudioWPatch
Uses native WASAPI for direct hardware access
Writes proper WAV format with correct headers
"""
import pyaudiowpatch as pyaudio
import wave
import sys
import signal
import threading

is_recording = True
audio_stream = None
wf = None

def signal_handler(sig, frame):
    global is_recording
    is_recording = False
    print("Stopping recording...", flush=True)

def record_audio(output_path):
    """Record audio from microphone using PyAudioWPatch"""
    global is_recording, audio_stream, wf

    sample_rate = 16000
    channels = 1
    chunk_size = 4096
    sample_width = 2  # 16-bit

    print(f"Recording to {output_path}...", flush=True)

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    try:
        # Initialize PyAudio (WASAPI on Windows)
        p = pyaudio.PyAudio()

        # Open audio stream
        audio_stream = p.open(
            format=pyaudio.paInt16,
            channels=channels,
            rate=sample_rate,
            input=True,
            frames_per_buffer=chunk_size,
            input_device_index=None  # Auto-detect default microphone
        )

        # Open WAV file for writing
        wf = wave.open(output_path, 'wb')
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)

        print("Microphone active. Press Ctrl+C to stop.", flush=True)

        # Record until stopped
        while is_recording:
            try:
                data = audio_stream.read(chunk_size, exception_on_overflow=False)
                wf.writeframes(data)
            except Exception as e:
                print(f"Error reading audio: {e}", flush=True)
                break

    except Exception as e:
        print(f"Error: {e}", flush=True)
        sys.exit(1)
    finally:
        # Cleanup
        if audio_stream:
            audio_stream.stop_stream()
            audio_stream.close()
        if wf:
            wf.close()
        if 'p' in locals():
            p.terminate()
        print(f"Recording saved to {output_path}", flush=True)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        output_path = sys.argv[1]
        record_audio(output_path)
    else:
        print("Usage: python record_audio_fast.py <output_path>")
`;
          fs.writeFileSync(scriptPath, script);
        }

        // Spawn Python process for recording
        this.recordingProcess = spawn('python', [scriptPath, this.audioFilePath]);

        this.recordingProcess.stdout?.on('data', (data: any) => {
          console.log(`🎤 ${data.toString().trim()}`);
        });

        this.recordingProcess.stderr?.on('data', (data: any) => {
          console.error(`Recording error: ${data.toString().trim()}`);
        });

        this.recordingProcess.on('error', (error: Error) => {
          console.error('Recording process error:', error);
          reject(error);
        });

        // Start recording immediately
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
