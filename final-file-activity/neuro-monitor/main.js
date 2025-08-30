const { app, BrowserWindow } = require("electron");
const path = require("path");
const FileMonitor = require("./fileMonitor");

let mainWindow;

// Initialize file monitoring
function initializeFileMonitoring() {
  const watchPath = process.env.WATCH_PATH || "C:/SensitiveDocs";
  
  // Ensure the watch path exists
  const fs = require('fs');
  if (!fs.existsSync(watchPath)) {
    fs.mkdirSync(watchPath, { recursive: true });
    console.log(`Created monitoring directory: ${watchPath}`);
  }
  
  console.log(`Initializing file monitoring for: ${watchPath}`);
  new FileMonitor(watchPath);
}

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile("index.html");
  
  // Start file monitoring
  initializeFileMonitoring();
  
  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
