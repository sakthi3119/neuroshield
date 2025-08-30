const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    acceptTerms: () => ipcRenderer.send('accept-terms'),
    onMonitoringStarted: (callback) => ipcRenderer.on('monitoring-started', callback)
});