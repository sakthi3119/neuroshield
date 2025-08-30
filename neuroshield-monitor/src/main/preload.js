const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Window controls
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
    isMaximized: () => ipcRenderer.invoke('is-window-maximized'),
    
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // System info
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    
    // Monitoring controls
    startMonitoring: () => ipcRenderer.invoke('start-monitoring'),
    stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
    getMonitoringStatus: () => ipcRenderer.invoke('get-monitoring-status'),
    
    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
    
    // Alerts
    getAlerts: (limit = 50) => ipcRenderer.invoke('get-alerts', limit),
    
    // Listeners
    onWindowStateChange: (callback) => {
      ipcRenderer.on('window-state-changed', (event, isMaximized) => {
        callback(isMaximized);
      });
    },
    
    onAlert: (callback) => {
      ipcRenderer.on('new-alert', (event, alert) => {
        callback(alert);
      });
    },
    
    // Remove all listeners
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    }
  }
);

// Handle window controls
ipcRenderer.on('window-maximized', () => {
  window.dispatchEvent(new Event('window-maximized'));
});

ipcRenderer.on('window-unmaximized', () => {
  window.dispatchEvent(new Event('window-unmaximized'));
});
