import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TranscriptionService {
  private modelPath: string;
  private whisperExecutable: string;

  constructor() {
    // Path to whisper.cpp executable and model
    this.modelPath = path.join(process.cwd(), 'models', 'ggml-base.bin');
    this.whisperExecutable = 'whisper-cpp'; // System-installed or bundled
  }

  async transcribe(audioFilePath: string): Promise<string> {
    try {
      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error('Audio file not found');
      }

      // Check file size
      const stats = fs.statSync(audioFilePath);
      if (stats.size === 0) {
        throw new Error('Audio file is empty');
      }

      // Try different whisper implementations in order of preference
      let transcription = '';

      // 1. Try whisper.cpp if available
      try {
        transcription = await this.transcribeWithWhisperCpp(audioFilePath);
        return transcription.trim();
      } catch (error) {
        console.log('whisper.cpp not available, trying Python whisper...');
      }

      // 2. Try Python whisper if available
      try {
        transcription = await this.transcribeWithPythonWhisper(audioFilePath);
        return transcription.trim();
      } catch (error) {
        console.log('Python whisper not available, trying faster-whisper...');
      }

      // 3. Try faster-whisper if available
      try {
        transcription = await this.transcribeWithFasterWhisper(audioFilePath);
        return transcription.trim();
      } catch (error) {
        throw new Error(
          'No Whisper implementation found. Please install whisper.cpp, Python whisper, or faster-whisper.\n' +
          'Visit: https://github.com/ggerganov/whisper.cpp'
        );
      }
    } catch (error) {
      console.error('Transcription error:', error);

      if (error instanceof Error) {
        throw new Error(`Transcription failed: ${error.message}`);
      }

      throw new Error('Transcription failed with unknown error');
    }
  }

  private async transcribeWithWhisperCpp(audioFilePath: string): Promise<string> {
    // Try to use whisper.cpp (main executable)
    try {
      const { stdout } = await execAsync(
        `whisper-cpp -m ${this.modelPath} -f ${audioFilePath} -nt -l en`
      );
      return this.cleanTranscription(stdout);
    } catch (error) {
      // Try alternative executable name
      const { stdout } = await execAsync(
        `main -m ${this.modelPath} -f ${audioFilePath} -nt -l en`
      );
      return this.cleanTranscription(stdout);
    }
  }

  private async transcribeWithPythonWhisper(audioFilePath: string): Promise<string> {
    // Use Python's whisper package with tiny or base model for speed
    const { stdout } = await execAsync(
      `whisper "${audioFilePath}" --model base --language en --output_format txt --output_dir /tmp`
    );

    // Read the output file
    const outputFile = audioFilePath.replace('.wav', '.txt');
    const txtFile = path.join('/tmp', path.basename(outputFile));

    if (fs.existsSync(txtFile)) {
      const text = fs.readFileSync(txtFile, 'utf-8');
      fs.unlinkSync(txtFile); // Clean up
      return text;
    }

    return this.cleanTranscription(stdout);
  }

  private async transcribeWithFasterWhisper(audioFilePath: string): Promise<string> {
    // Use faster-whisper (optimized Python implementation)
    const scriptPath = path.join(__dirname, 'faster_whisper_transcribe.py');

    // Create a simple Python script if it doesn't exist
    if (!fs.existsSync(scriptPath)) {
      const script = `#!/usr/bin/env python3
import sys
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu", compute_type="int8")
segments, info = model.transcribe(sys.argv[1], language="en")
text = " ".join([segment.text for segment in segments])
print(text)
`;
      fs.writeFileSync(scriptPath, script);
      fs.chmodSync(scriptPath, '755');
    }

    const { stdout } = await execAsync(`python3 ${scriptPath} "${audioFilePath}"`);
    return this.cleanTranscription(stdout);
  }

  private cleanTranscription(text: string): string {
    // Remove common whisper.cpp output artifacts
    return text
      .replace(/\[.*?\]/g, '') // Remove timestamps
      .replace(/\n+/g, ' ')     // Replace newlines with spaces
      .trim();
  }
}
