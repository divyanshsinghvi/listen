/**
 * tray.ts
 *
 * System tray integration for Listen
 * Provides quick access to settings, history, and controls
 */

import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import * as path from 'path';

export class TrayManager {
  private tray: Tray | null = null;
  private settingsWindow: BrowserWindow | null = null;

  createTray() {
    // Create tray icon (you'll need to add an icon file)
    const iconPath = path.join(__dirname, '../assets/tray-icon.png');

    // Fallback: create a simple icon if file doesn't exist
    const icon = nativeImage.createEmpty();
    icon.addRepresentation({
      scaleFactor: 1.0,
      width: 16,
      height: 16,
      buffer: Buffer.from(
        // Simple 16x16 microphone icon in base64
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz' +
        'AAAB2AAAAdgB+lymcgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAD0SURB' +
        'VDiNpdIxSsNQGMDx/5d8SRMaEBx0EBwcXFzFxVVwcXJ1cHJwEVxd3MRBcBMHJ0EQHBRBcBAEQRDU',
        'base64'
      )
    });

    this.tray = new Tray(icon);

    this.updateContextMenu();

    this.tray.setToolTip('Listen - Voice to Text');

    // Double-click to show main window
    this.tray.on('double-click', () => {
      this.showSettings();
    });
  }

  updateContextMenu(isRecording = false, availableModels: string[] = []) {
    if (!this.tray) return;

    const modelMenu = availableModels.length > 0
      ? availableModels.map(model => ({
          label: model,
          type: 'radio' as const,
          checked: false, // TODO: Track selected model
          click: () => {
            // TODO: Switch model
            console.log(`Switching to ${model}`);
          }
        }))
      : [{ label: 'No models available', enabled: false }];

    const contextMenu = Menu.buildFromTemplate([
      {
        label: isRecording ? 'Recording...' : 'Listen',
        icon: nativeImage.createEmpty(),
        enabled: false
      },
      { type: 'separator' },
      {
        label: isRecording ? 'Stop Recording' : 'Start Recording',
        accelerator: 'CommandOrControl+Shift+Space',
        click: () => {
          // TODO: Trigger recording toggle
          console.log('Toggle recording');
        }
      },
      { type: 'separator' },
      {
        label: 'Models',
        submenu: modelMenu
      },
      {
        label: 'Settings',
        accelerator: 'CommandOrControl+,',
        click: () => this.showSettings()
      },
      {
        label: 'History',
        accelerator: 'CommandOrControl+H',
        click: () => this.showHistory()
      },
      { type: 'separator' },
      {
        label: 'Statistics',
        click: () => this.showStatistics()
      },
      { type: 'separator' },
      {
        label: 'About',
        click: () => {
          // TODO: Show about dialog
        }
      },
      {
        label: 'Quit',
        accelerator: 'CommandOrControl+Q',
        click: () => {
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  setRecordingState(isRecording: boolean) {
    if (!this.tray) return;

    // Update tooltip
    this.tray.setToolTip(
      isRecording ? 'Listen - Recording...' : 'Listen - Voice to Text'
    );

    // Update menu
    this.updateContextMenu(isRecording);

    // Flash icon when recording (optional)
    if (isRecording) {
      // TODO: Animate tray icon
    }
  }

  showSettings() {
    if (this.settingsWindow) {
      this.settingsWindow.show();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 600,
      height: 700,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      title: 'Listen Settings',
      autoHideMenuBar: true
    });

    this.settingsWindow.loadFile(path.join(__dirname, '../assets/settings.html'));

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
  }

  showHistory() {
    const historyWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      title: 'Transcription History',
      autoHideMenuBar: true
    });

    historyWindow.loadFile(path.join(__dirname, '../assets/history.html'));
  }

  showStatistics() {
    const statsWindow = new BrowserWindow({
      width: 700,
      height: 500,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      },
      title: 'Usage Statistics',
      autoHideMenuBar: true
    });

    statsWindow.loadFile(path.join(__dirname, '../assets/statistics.html'));
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
