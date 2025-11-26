import { app, BrowserWindow, globalShortcut, ipcMain, clipboard, screen } from 'electron';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { RecordingManager } from './recording';
import { ModularTranscriptionService } from './transcription-router';
import { DatasetManager } from './dataset';

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;
let recordingManager: RecordingManager | null = null;
let transcriptionService: ModularTranscriptionService | null = null;
let isRecording = false;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    x: Math.floor((width - 400) / 2),
    y: Math.floor((height - 200) / 2),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../assets/index.html'));

  // Prevent window from showing on launch
  mainWindow.on('ready-to-show', () => {
    // Don't show automatically
  });
}

async function toggleRecording() {
  if (!mainWindow) return;

  if (!isRecording) {
    // Start recording
    isRecording = true;
    const recordingStartTime = Date.now();
    console.log('\n' + '='.repeat(60));
    console.log('🎙️ RECORDING STARTED');
    console.log(`⏱️  [${new Date().toLocaleTimeString()}]`);
    console.log('='.repeat(60));

    mainWindow.show();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.webContents.send('recording-state', { state: 'recording' });

    if (!recordingManager) {
      recordingManager = new RecordingManager();
    }

    try {
      await recordingManager.startRecording();
      console.log('✓ Audio stream initialized');
    } catch (error) {
      console.error('❌ Recording start error:', error);
      isRecording = false;
    }
  } else {
    // Stop recording
    isRecording = false;
    const pipelineStart = Date.now();
    console.log('\n' + '='.repeat(60));
    console.log('⏹️ RECORDING STOPPED');
    console.log('='.repeat(60));

    mainWindow.webContents.send('recording-state', { state: 'processing' });

    if (recordingManager) {
      try {
        const recordStop = Date.now();
        const audioFilePath = await recordingManager.stopRecording();
        const recordTime = Date.now() - recordStop;
        console.log(`✓ Recording finalized (${recordTime}ms)`);

        // Check if file exists and has size
        const fs = require('fs');
        if (fs.existsSync(audioFilePath)) {
          const size = fs.statSync(audioFilePath).size;
          console.log(`📁 Audio file: ${audioFilePath}`);
          console.log(`   Size: ${(size / 1024).toFixed(2)} KB`);
          console.log(`   Duration: ${(size / 32000).toFixed(1)}s (approx)`);
        } else {
          throw new Error(`Audio file not found: ${audioFilePath}`);
        }

        console.log(`\n⏱️  [Stage: File Ready] +${Date.now() - pipelineStart}ms`);

        // Transcription service already initialized on app startup
        if (!transcriptionService) {
          console.error('❌ Transcription service not available');
          throw new Error('Transcription service failed to initialize');
        }

        try {
          console.log(`\n⏱️  [Stage: Starting Transcription] +${Date.now() - pipelineStart}ms`);

          const transcribeStart = Date.now();
          // Auto-select best model for desktop
          const result = await transcriptionService.transcribe(audioFilePath, {
            routingPreferences: {
              priority: 'balance',
              platform: 'desktop',
              language: 'en'
            }
          });

          const transcribeTime = Date.now() - transcribeStart;
          console.log(`\n⏱️  [Stage: Transcription Complete] +${Date.now() - pipelineStart}ms (took ${transcribeTime}ms)`);

          console.log(`\n📊 TRANSCRIPTION RESULTS:`);
          console.log(`  ✓ Text: "${result.text}"`);
          console.log(`  ✓ Model: ${result.modelUsed}`);
          console.log(`  ✓ Confidence: ${result.confidence ? (result.confidence * 100).toFixed(1) : 'N/A'}%`);
          console.log(`  ℹ️ Model inference: ${result.duration}ms`);

          // Save to dataset for training
          try {
            const datasetManager = new DatasetManager();
            const fs = require('fs');
            const fileSize = fs.existsSync(audioFilePath) ? fs.statSync(audioFilePath).size : 0;

            // Calculate recording duration from file size
            // WAV format: 16kHz, mono, 16-bit = 32,000 bytes per second
            // Subtract 44 bytes for WAV header
            const recordingDuration = fileSize > 44 ? Math.round(((fileSize - 44) / 32000) * 1000) : 0;

            await datasetManager.saveEntry(audioFilePath, {
              transcription: result.text,
              confidence: result.confidence ?? 0,
              model: result.modelUsed,
              language: 'en',
              duration: recordingDuration,
              fileSize: fileSize
            });
          } catch (datasetError) {
            console.error('⚠️ Warning: Failed to save dataset entry:', datasetError);
          }

          // Copy to clipboard
          const clipboardStart = Date.now();
          clipboard.writeText(result.text);
          const clipboardTime = Date.now() - clipboardStart;
          console.log(`\n⏱️  [Stage: Clipboard] +${Date.now() - pipelineStart}ms (took ${clipboardTime}ms)`);
          console.log(`  📋 Text copied to clipboard`);

          // Hide window immediately
          mainWindow?.hide();

          // Auto-paste using Ctrl+V
          console.log(`\n⏱️  [Stage: Auto-Paste] +${Date.now() - pipelineStart}ms`);
          console.log(`  📝 Attempting to paste at cursor position...`);

          // Small delay to ensure window focus is released
          setTimeout(async () => {
            const pasteStart = Date.now();
            try {
              // Use Python to simulate Ctrl+V paste
              await execAsync('python -c "import pyautogui; pyautogui.hotkey(\'ctrl\', \'v\')"');
              const pasteTime = Date.now() - pasteStart;
              const totalTime = Date.now() - pipelineStart;

              console.log(`  ✓ Text pasted successfully (${pasteTime}ms)`);
              console.log(`\n${'='.repeat(60)}`);
              console.log(`✅ PIPELINE COMPLETE - Total time: ${totalTime}ms`);
              console.log(`   Recording: N/A`);
              console.log(`   Transcription: ${transcribeTime}ms`);
              console.log(`   Clipboard: ${clipboardTime}ms`);
              console.log(`   Paste: ${pasteTime}ms`);
              console.log(`${'='.repeat(60)}\n`);
            } catch (error) {
              console.error(`  ❌ Error pasting text:`, error);
              console.log(`  ℹ️ Text is in clipboard - paste manually with Ctrl+V`);
              console.log(`\n${'='.repeat(60)}`);
              console.log(`⚠️ PIPELINE COMPLETE (manual paste needed) - Total time: ${Date.now() - pipelineStart}ms`);
              console.log(`${'='.repeat(60)}\n`);
            }
          }, 100);
        } catch (transcriptionError) {
          console.error('❌ Transcription error:', transcriptionError);
          mainWindow.webContents.send('recording-state', {
            state: 'error',
            error: transcriptionError instanceof Error ? transcriptionError.message : 'Transcription failed'
          });
          setTimeout(() => {
            mainWindow?.hide();
          }, 2000);
        }
      } catch (recordingError) {
        console.error('❌ Recording stop error:', recordingError);
        mainWindow.webContents.send('recording-state', {
          state: 'error',
          error: recordingError instanceof Error ? recordingError.message : 'Recording failed'
        });
        setTimeout(() => {
          mainWindow?.hide();
        }, 2000);
      }
    }
  }
}

function registerShortcuts() {
  // Global hotkey: Ctrl+Shift+Space
  const ret = globalShortcut.register('CommandOrControl+Shift+Space', () => {
    toggleRecording();
  });

  if (!ret) {
    console.error('Global shortcut registration failed');
  }

  // ESC to cancel
  globalShortcut.register('Escape', () => {
    if (mainWindow?.isVisible()) {
      if (isRecording && recordingManager) {
        recordingManager.cancelRecording();
        isRecording = false;
      }
      mainWindow.hide();
      mainWindow.webContents.send('recording-state', { state: 'idle' });
    }
  });
}

app.whenReady().then(async () => {
  createWindow();
  registerShortcuts();

  // Load transcription service and model on startup
  console.log('🚀 Initializing transcription service...');
  transcriptionService = new ModularTranscriptionService();

  try {
    await transcriptionService.initialize();
    console.log('✓ Model loaded successfully - ready for transcription!');
  } catch (error) {
    console.error('❌ Failed to load model:', error);
  }

  // Signal UI that app is ready
  if (mainWindow) {
    mainWindow.webContents.send('app-ready');
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC handlers
ipcMain.on('cancel-recording', () => {
  if (isRecording && recordingManager) {
    recordingManager.cancelRecording();
    isRecording = false;
  }
  mainWindow?.hide();
});
