import { app, BrowserWindow, globalShortcut, ipcMain, clipboard, screen } from 'electron';
import * as path from 'path';
import { RecordingManager } from './recording';
import { ModularTranscriptionService } from './transcription-router';
import * as robot from 'robotjs';

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
    console.log('🎙️ Starting recording...');
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.webContents.send('recording-state', { state: 'recording' });

    if (!recordingManager) {
      recordingManager = new RecordingManager();
    }

    try {
      await recordingManager.startRecording();
      console.log('✓ Recording started successfully');
    } catch (error) {
      console.error('❌ Recording start error:', error);
      isRecording = false;
    }
  } else {
    // Stop recording
    isRecording = false;
    console.log('⏹️ Stopping recording...');
    mainWindow.webContents.send('recording-state', { state: 'processing' });

    if (recordingManager) {
      try {
        const audioFilePath = await recordingManager.stopRecording();
        console.log(`✓ Recording stopped. Audio file: ${audioFilePath}`);

        // Check if file exists and has size
        const fs = require('fs');
        if (fs.existsSync(audioFilePath)) {
          const size = fs.statSync(audioFilePath).size;
          console.log(`📁 Audio file size: ${size} bytes`);
        } else {
          throw new Error(`Audio file not found: ${audioFilePath}`);
        }

        // Initialize transcription service
        if (!transcriptionService) {
          console.log('🚀 Initializing transcription service...');
          transcriptionService = new ModularTranscriptionService();
          await transcriptionService.initialize();
          console.log('✓ Transcription service initialized');
        }

        try {
          console.log('🔄 Starting transcription...');
          // Auto-select best model for desktop
          const result = await transcriptionService.transcribe(audioFilePath, {
            routingPreferences: {
              priority: 'balance',
              platform: 'desktop',
              language: 'en'
            }
          });

          console.log(`✓ Transcription complete: "${result.text}" (${result.modelUsed})`);

          // Also copy to clipboard as backup
          clipboard.writeText(result.text);

          // Hide window immediately
          mainWindow?.hide();

          // Type the text at current cursor position
          console.log(`📝 Typing transcribed text: "${result.text}"`);

          // Small delay to ensure window focus is released
          setTimeout(() => {
            try {
              // Type the transcribed text character by character
              robot.typeString(result.text);
              console.log('✓ Text typed successfully');
            } catch (error) {
              console.error('❌ Error typing text:', error);
              // Fallback: user can paste from clipboard
              clipboard.writeText(result.text);
              console.log('ℹ️ Text copied to clipboard as fallback');
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

app.whenReady().then(() => {
  createWindow();
  registerShortcuts();

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
