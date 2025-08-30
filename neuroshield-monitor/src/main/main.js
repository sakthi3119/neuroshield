const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');
const logger = require('../shared/logger');
const config = require('../config');
const { autoUpdater } = require('electron-updater');

// Single instance lock
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Global references
let mainWindow = null;
let splashWindow = null;
let tray = null;

// Initialize the application
async function initialize() {
  try {
    logger.info('Initializing NeuroShield Monitor...');
    
    // Set application name for Windows notifications
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.neuroshield.monitor');
    }
    
    // Create windows
    createSplashWindow();
    
    // Set up application menu
    createApplicationMenu();
    
    // Set up auto-updater in production
    if (!config.isDev) {
      require('./updater')(mainWindow);
    }
    
    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Create splash window
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#1a1a2e',
    show: false,
    skipTaskbar: true
  });

  splashWindow.loadFile(path.join(__dirname, '../renderer/splash.html'));
  
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
    // Show main window after a short delay
    setTimeout(createMainWindow, 2000);
  });
}

// Create main application window
function createMainWindow() {
  const { WIDTH, HEIGHT, MIN_WIDTH, MIN_HEIGHT } = config.WINDOW;
  
  mainWindow = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: !config.isDev,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icons/icon.png'),
    backgroundColor: '#f5f7fa'
  });
  
  // Load the app
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  // Open dev tools in development
  if (config.isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
  
  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    mainWindow.show();
  });
  
  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create application menu
function createApplicationMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(initialize);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Handle second instance
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Handle before quit
app.on('before-quit', () => {
  app.quitting = true;
});
