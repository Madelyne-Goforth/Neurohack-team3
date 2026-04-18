process.env.ELECTRON_ENABLE_LOGGING = '1';
const { app, BrowserWindow } = require("electron");
const path = require("path");

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-http-cache');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: "#1e1e1e",
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile("index.html");
  win.webContents.openDevTools();

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });
}

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});