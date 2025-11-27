import { app, BrowserWindow, globalShortcut, ipcMain, clipboard, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { RecordingManager } from './recording';
import { ModularTranscriptionService } from './transcription-router';
import { DatasetManager } from './dataset';

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;
let floatingButtonWindow: BrowserWindow | null = null;
let recordingManager: RecordingManager | null = null;
let transcriptionService: ModularTranscriptionService | null = null;
let isRecording = false;
let previousWindowFocus: any = null;

/**
 * Capture the currently focused window so we can restore focus later
 */
async function captureWindowFocus(): Promise<any> {
  try {
    const { stdout } = await execAsync('python3 ' + path.join(__dirname, '..', 'window_focus.py') + ' get');
    const windowInfo = JSON.parse(stdout.trim());
    if (windowInfo.handle) {
      console.log(`[OK] Captured focus: ${windowInfo.title || 'Unknown'}`);
      return windowInfo;
    }
  } catch (error) {
    console.log(`[WARN] Could not capture window focus: ${error}`);
  }
  return null;
}

/**
 * Restore focus to the previously captured window
 */
async function restoreWindowFocus(windowInfo: any): Promise<boolean> {
  if (!windowInfo || !windowInfo.handle) return false;

  try {
    const { stdout } = await execAsync(`python3 ${path.join(__dirname, '..', 'window_focus.py')} restore '${JSON.stringify(windowInfo).replace(/'/g, "'\\''")}'`);
    const result = JSON.parse(stdout.trim());
    if (result.success) {
      console.log(`[OK] Restored focus to: ${windowInfo.title || 'previous window'}`);
    }
    return result.success;
  } catch (error) {
    console.log(`[WARN] Could not restore window focus: ${error}`);
  }
  return false;
}

// Floating button position persistence
const buttonPositionFile = path.join(app.getPath('userData'), 'button-position.json');

interface ButtonPosition {
  x: number;
  y: number;
}

function loadButtonPosition(): ButtonPosition {
  try {
    if (fs.existsSync(buttonPositionFile)) {
      const data = fs.readFileSync(buttonPositionFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Could not load button position, using default');
  }

  // Default position: bottom-right
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return {
    x: width - 100,
    y: height - 100
  };
}

function saveButtonPosition(position: ButtonPosition) {
  try {
    const dir = path.dirname(buttonPositionFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(buttonPositionFile, JSON.stringify(position, null, 2));
  } catch (error) {
    console.error('Could not save button position:', error);
  }
}

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

function createFloatingButtonWindow() {
  const position = loadButtonPosition();

  floatingButtonWindow = new BrowserWindow({
    width: 60,
    height: 60,
    x: position.x,
    y: position.y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false, // Don't steal focus when interacting with button
    webPreferences: {
      preload: path.join(__dirname, 'preload-floating-button.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  floatingButtonWindow.loadFile(path.join(__dirname, '../assets/floating-button.html'));

  // Handle window closed
  floatingButtonWindow.on('closed', () => {
    floatingButtonWindow = null;
  });

  // Send initial state
  floatingButtonWindow.webContents.on('did-finish-load', () => {
    updateFloatingButtonState(isRecording ? 'recording' : 'idle');
  });
}

function updateFloatingButtonState(state: string) {
  if (floatingButtonWindow && !floatingButtonWindow.isDestroyed()) {
    floatingButtonWindow.webContents.send('floating-button-state', { state });
  }
}

async function toggleRecording() {
  if (!mainWindow) return;

  if (!isRecording) {
    // Start recording - capture current window focus first
    previousWindowFocus = await captureWindowFocus();

    isRecording = true;
    const recordingStartTime = Date.now();
    console.log('\n' + '='.repeat(60));
    console.log('[MIC] RECORDING STARTED');
    console.log(`[TIME] [${new Date().toLocaleTimeString()}]`);
    console.log('='.repeat(60));

    // Show window without stealing focus from user's app
    mainWindow.showInactive();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.webContents.send('recording-state', { state: 'recording' });
    updateFloatingButtonState('recording');

    if (!recordingManager) {
      recordingManager = new RecordingManager();
    }

    try {
      await recordingManager.startRecording();
      console.log('[OK] Audio stream initialized');
    } catch (error) {
      console.error('[ERROR] Recording start error:', error);
      isRecording = false;
    }
  } else {
    // Stop recording
    isRecording = false;
    const pipelineStart = Date.now();
    console.log('\n' + '='.repeat(60));
    console.log('[STOP] RECORDING STOPPED');
    console.log('='.repeat(60));

    mainWindow.webContents.send('recording-state', { state: 'processing' });
    updateFloatingButtonState('processing');

    if (recordingManager) {
      try {
        const recordStop = Date.now();
        const audioFilePath = await recordingManager.stopRecording();
        const recordTime = Date.now() - recordStop;
        console.log(`[OK] Recording finalized (${recordTime}ms)`);

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

        console.log(`\n[TIME] [Stage: File Ready] +${Date.now() - pipelineStart}ms`);

        // Transcription service already initialized on app startup
        if (!transcriptionService) {
          console.error('[ERROR] Transcription service not available');
          throw new Error('Transcription service failed to initialize');
        }

        try {
          console.log(`\n[TIME] [Stage: Starting Transcription] +${Date.now() - pipelineStart}ms`);

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
          console.log(`\n[TIME] [Stage: Transcription Complete] +${Date.now() - pipelineStart}ms (took ${transcribeTime}ms)`);

          console.log(`\n[RESULTS] TRANSCRIPTION RESULTS:`);
          console.log(`  [OK] Text: "${result.text}"`);
          console.log(`  [OK] Model: ${result.modelUsed}`);
          console.log(`  [OK] Confidence: ${result.confidence ? (result.confidence * 100).toFixed(1) : 'N/A'}%`);
          console.log(`  [INFO] Model inference: ${result.duration}ms`);

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
            console.error('[WARN] Failed to save dataset entry:', datasetError);
          }

          // Copy to clipboard
          const clipboardStart = Date.now();
          clipboard.writeText(result.text);
          const clipboardTime = Date.now() - clipboardStart;
          console.log(`\n[TIME] [Stage: Clipboard] +${Date.now() - pipelineStart}ms (took ${clipboardTime}ms)`);
          console.log(`  [OK] Text copied to clipboard`);

          updateFloatingButtonState('idle');

          // Hide window immediately
          mainWindow?.hide();

          // Auto-paste using Ctrl+V
          console.log(`\n[TIME] [Stage: Auto-Paste] +${Date.now() - pipelineStart}ms`);
          console.log(`  [NOTE] Text copied to clipboard`);
          console.log(`  [INFO] Restoring focus to original window...`);

          // Restore focus to original window and paste
          setTimeout(async () => {
            const pasteStart = Date.now();
            try {
              // Restore focus to the original window
              const focusRestored = await restoreWindowFocus(previousWindowFocus);
              if (focusRestored) {
                console.log(`  [OK] Focus restored`);
              } else {
                console.log(`  [WARN] Could not restore focus, attempting paste anyway`);
              }

              // Small delay to ensure window is ready to receive input
              await new Promise(resolve => setTimeout(resolve, 100));

              // Use Python to simulate Ctrl+V paste
              await execAsync('python3 -c "import pyautogui; pyautogui.hotkey(\'ctrl\', \'v\')"');
              const pasteTime = Date.now() - pasteStart;
              const totalTime = Date.now() - pipelineStart;

              console.log(`\n  [OK] Text pasted successfully (${pasteTime}ms)`);
              console.log(`${'='.repeat(60)}`);
              console.log(`[DONE] PIPELINE COMPLETE - Total time: ${totalTime}ms`);
              console.log(`   Recording: N/A`);
              console.log(`   Transcription: ${transcribeTime}ms`);
              console.log(`   Clipboard: ${clipboardTime}ms`);
              console.log(`   Paste: ${pasteTime}ms`);
              console.log(`${'='.repeat(60)}\n`);
            } catch (error) {
              console.error(`  [ERROR] Error pasting text:`, error);
              console.log(`  [INFO] Text is in clipboard - paste manually with Ctrl+V`);
              console.log(`\n${'='.repeat(60)}`);
              console.log(`[WARN] PIPELINE COMPLETE (manual paste needed) - Total time: ${Date.now() - pipelineStart}ms`);
              console.log(`${'='.repeat(60)}\n`);
            }
          }, 100);
        } catch (transcriptionError) {
          console.error('[ERROR] Transcription error:', transcriptionError);
          mainWindow.webContents.send('recording-state', {
            state: 'error',
            error: transcriptionError instanceof Error ? transcriptionError.message : 'Transcription failed'
          });
          setTimeout(() => {
            mainWindow?.hide();
          }, 2000);
        }
      } catch (recordingError) {
        console.error('[ERROR] Recording stop error:', recordingError);
        mainWindow.webContents.send('recording-state', {
          state: 'error',
          error: recordingError instanceof Error ? recordingError.message : 'Recording failed'
        });
        updateFloatingButtonState('idle');
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
  createFloatingButtonWindow();
  registerShortcuts();

  // Load transcription service and model on startup
  console.log('[INIT] Initializing transcription service...');
  transcriptionService = new ModularTranscriptionService();

  try {
    await transcriptionService.initialize();
    console.log('[OK] Model loaded successfully - ready for transcription!');
  } catch (error) {
    console.error('[ERROR] Failed to load model:', error);
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
  if (floatingButtonWindow && !floatingButtonWindow.isDestroyed()) {
    floatingButtonWindow.destroy();
  }
});

// IPC handlers
ipcMain.on('cancel-recording', () => {
  if (isRecording && recordingManager) {
    recordingManager.cancelRecording();
    isRecording = false;
  }
  mainWindow?.hide();
});

// Floating button IPC handlers
ipcMain.on('floating-button-click', () => {
  toggleRecording();
});

ipcMain.on('floating-button-drag', (event, { deltaX, deltaY }) => {
  if (floatingButtonWindow && !floatingButtonWindow.isDestroyed()) {
    const [x, y] = floatingButtonWindow.getPosition();
    floatingButtonWindow.setPosition(x + deltaX, y + deltaY);
  }
});

ipcMain.on('floating-button-drag-end', () => {
  if (floatingButtonWindow && !floatingButtonWindow.isDestroyed()) {
    const [x, y] = floatingButtonWindow.getPosition();
    saveButtonPosition({ x, y });
  }
});

ipcMain.on('floating-button-ready', () => {
  updateFloatingButtonState(isRecording ? 'recording' : 'idle');
});
