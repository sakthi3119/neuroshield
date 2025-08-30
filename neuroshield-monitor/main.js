const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const Store = new (require('electron-store'))();

// Ensure single instance
if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

let mainWindow;
let splashWindow;

// Paths to your monitoring folders
const monitoringPaths = {
    hardware: path.join(__dirname, '../hardware_monitoring/monitor.py'),
    activity: path.join(__dirname, '../neuro-monitor/monitor.js'),
    usb: path.join(__dirname, '../final-usb-activity/uneuro-monitor/usb_monitor.js'),
    file: path.join(__dirname, '../final-file-activity/fileMonitor.js')
};

const WINDOW_DIMENSIONS = {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600
};

function createSplashWindow() {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    
    splashWindow = new BrowserWindow({
        width: screenWidth,
        height: screenHeight,
        frame: false,
        transparent: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        backgroundColor: '#000000'
    });

    splashWindow.loadFile(path.join(__dirname, 'src/renderer/splash.html'));
    splashWindow.setFullScreen(true);

    setTimeout(() => {
        createMainWindow();
        setTimeout(() => {
            splashWindow.close();
            mainWindow.show();
        }, 4500);
    }, 500);
}

function createMainWindow() {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'src/main/preload.js'),
            webSecurity: true,
            allowRunningInsecureContent: false
        },
        backgroundColor: '#111827',
        show: false,
        x: Math.floor((screenWidth - 1200) / 2),
        y: Math.floor((screenHeight - 800) / 2)
    });

    mainWindow.loadFile(path.join(__dirname, 'src/renderer/index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.webContents.executeJavaScript(`
            document.documentElement.classList.add('dark-theme');
            document.body.style.opacity = '0';
            setTimeout(() => {
                document.body.style.transition = 'opacity 0.5s ease-in-out';
                document.body.style.opacity = '1';
            }, 100);
        `);
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Check if terms were previously accepted
    if (Store.get('termsAccepted')) {
        startAllMonitoring();
        mainWindow.webContents.send('terms-already-accepted');
    }
}

// Handle second instance
app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

// Start all monitoring services
function startAllMonitoring() {
    try {
        // Set environment variable to prevent window creation in child processes
        process.env.DISABLE_ELECTRON_WINDOW = 'true';

        // Start hardware monitoring (Python script)
        const hardwareMonitor = spawn('python', [monitoringPaths.hardware], {
            env: { ...process.env, DISABLE_ELECTRON_WINDOW: 'true' }
        });
        hardwareMonitor.on('error', (err) => {
            console.error('Hardware monitoring error:', err);
        });

        // Start other monitors directly
        require(monitoringPaths.activity);
        require(monitoringPaths.usb);
        require(monitoringPaths.file);

        console.log('All monitoring services started');
    } catch (error) {
        console.error('Error starting monitors:', error);
    }
}

// Handle terms acceptance
ipcMain.on('accept-terms', () => {
    Store.set('termsAccepted', true);
    startAllMonitoring();
    mainWindow.webContents.send('monitoring-started');
});

// Handle window controls
ipcMain.on('window-control', (_, command) => {
    if (!mainWindow) return;
    
    switch(command) {
        case 'minimize':
            mainWindow.minimize();
            break;
        case 'maximize':
            mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
            break;
        case 'close':
            mainWindow.close();
            break;
    }
});

app.whenReady().then(createSplashWindow);

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