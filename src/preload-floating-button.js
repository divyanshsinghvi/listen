const { contextBridge, ipcRenderer } = require('electron');

// Safely expose only the IPC methods needed by the floating button
contextBridge.exposeInMainWorld('electronAPI', {
  // Send IPC messages to main process
  send: (channel, data) => {
    // Whitelist allowed channels
    const allowedChannels = [
      'floating-button-click',
      'floating-button-drag',
      'floating-button-drag-end',
      'floating-button-ready'
    ];
    if (allowedChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Listen for IPC messages from main process
  on: (channel, func) => {
    // Whitelist allowed channels
    const allowedChannels = [
      'floating-button-state'
    ];
    if (allowedChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});
