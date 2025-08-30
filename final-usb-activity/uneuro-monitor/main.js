const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadFile("index.html");

  // Start monitoring employee activities
  require("./usb_monitor.js");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
