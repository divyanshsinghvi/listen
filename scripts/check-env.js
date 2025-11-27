#!/usr/bin/env node
/**
 * Environment check script
 * Verifies required dependencies and audio setup before app starts
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Listen environment...\n');

let hasErrors = false;

// Check Python
try {
  const pythonVersion = execSync('python --version', { encoding: 'utf8' });
  console.log(`✓ Python: ${pythonVersion.trim()}`);
} catch (e) {
  console.error('✗ Python not found. Please install Python 3.8+');
  hasErrors = true;
}

// Check PyAudioWPatch (Windows only)
if (process.platform === 'win32') {
  try {
    execSync('python -c "import pyaudiowpatch; print(pyaudiowpatch.__version__)"', { encoding: 'utf8', stdio: 'pipe' });
    console.log('✓ PyAudioWPatch: installed');
  } catch (e) {
    console.warn('⚠ PyAudioWPatch not found. Audio recording may fail.');
    console.warn('  Install with: pip install PyAudioWPatch');
    // Don't fail on this, user might have alternative setup
  }
}

// Check FFmpeg
try {
  execSync('ffmpeg -version', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✓ FFmpeg: installed');
} catch (e) {
  console.warn('⚠ FFmpeg not found (optional)');
}

// Check Parakeet model script exists
const parakeetScript = path.join(__dirname, '..', 'parakeet-server.py');
if (fs.existsSync(parakeetScript)) {
  console.log('✓ Parakeet server script: found');
} else {
  console.warn('⚠ Parakeet server script not found');
}

// Check audio recording script exists
const audioScript = path.join(__dirname, 'record_audio_windows.py');
if (fs.existsSync(audioScript)) {
  console.log('✓ Audio recording script: found');
} else {
  console.error('✗ Audio recording script not found');
  hasErrors = true;
}

console.log();
if (hasErrors) {
  console.error('❌ Environment check failed. Please fix the issues above.\n');
  process.exit(1);
} else {
  console.log('✅ Environment check passed! Starting app...\n');
}
