import { app, BrowserWindow, globalShortcut, ipcMain, clipboard, screen } from 'electron';
import * as path from 'path';
import { RecordingManager } from './recording';
import { TranscriptionService } from './transcription';

let mainWindow: BrowserWindow | null = null;
let recordingManager: RecordingManager | null = null;
let transcriptionService: TranscriptionService | null = null;
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
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.webContents.send('recording-state', { state: 'recording' });

    if (!recordingManager) {
      recordingManager = new RecordingManager();
    }

    await recordingManager.startRecording();
  } else {
    // Stop recording
    isRecording = false;
    mainWindow.webContents.send('recording-state', { state: 'processing' });

    if (recordingManager) {
      const audioFilePath = await recordingManager.stopRecording();

      // Transcribe
      if (!transcriptionService) {
        transcriptionService = new TranscriptionService();
      }

      try {
        const transcription = await transcriptionService.transcribe(audioFilePath);

        // Copy to clipboard
        clipboard.writeText(transcription);

        mainWindow.webContents.send('recording-state', {
          state: 'completed',
          text: transcription
        });

        // Hide window after a short delay
        setTimeout(() => {
          mainWindow?.hide();
        }, 1500);
      } catch (error) {
        console.error('Transcription error:', error);
        mainWindow.webContents.send('recording-state', {
          state: 'error',
          error: error instanceof Error ? error.message : 'Transcription failed'
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
