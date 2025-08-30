const { autoUpdater } = require('electron-updater');
const logger = require('../shared/logger');
const { dialog } = require('electron');

let mainWindow;

function initializeUpdater(win) {
  mainWindow = win;
  
  // Configure autoUpdater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;
  autoUpdater.fullChangelog = true;
  
  // Set logger
  autoUpdater.logger = logger;
  
  // Check for updates
  autoUpdater.checkForUpdates();
  
  // Check for updates every 6 hours
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 6 * 60 * 60 * 1000);
  
  // Event listeners
  autoUpdater.on('checking-for-update', () => {
    logger.info('Checking for updates...');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'checking' });
    }
  });
  
  autoUpdater.on('update-available', (info) => {
    logger.info(`Update available: ${info.version}`);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'available',
        version: info.version,
        releaseNotes: info.releaseNotes
      });
    }
    
    // Show notification
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available. Downloading now...`,
      buttons: ['OK']
    });
  });
  
  autoUpdater.on('update-not-available', (info) => {
    logger.info('No updates available');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', { status: 'not-available' });
    }
  });
  
  autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
    logMessage = `${logMessage} - Downloaded ${progressObj.percent}%`;
    logMessage = `${logMessage} (${progressObj.transferred}/${progressObj.total})`;
    logger.info(logMessage);
    
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });
  
  autoUpdater.on('update-downloaded', (info) => {
    logger.info('Update downloaded, will install on quit');
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'downloaded',
        version: info.version
      });
      
      // Ask user to restart the app
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded. Restart the application to apply the updates.`,
        buttons: ['Restart Now', 'Later']
      }).then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    }
  });
  
  autoUpdater.on('error', (err) => {
    logger.error('Error in auto-updater:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'error',
        error: err.message || 'Unknown error'
      });
    }
  });
}

// Manual check for updates
function checkForUpdates() {
  return autoUpdater.checkForUpdates();
}

// Download update
function downloadUpdate() {
  return autoUpdater.downloadUpdate();
}

// Install update
function installUpdate() {
  return autoUpdater.quitAndInstall();
}

module.exports = (win) => {
  if (win) {
    initializeUpdater(win);
  }
  
  return {
    checkForUpdates,
    downloadUpdate,
    installUpdate
  };
};
