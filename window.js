const { app, BrowserWindow } = require("electron");
const Store = require("electron-store");
const path = require("path");
const store = new Store();
const { setMainWindow } = require("./windowManager");

function createWindow() {
  let { width, height, x, y } = store.get("windowBounds", { width: 800, height: 600 });
  console.log(__dirname);

  const mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;
  const url = isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "dist/index.html")}`;

  mainWindow.loadURL(url);

  mainWindow.on("resize", () => {
    let { width, height } = mainWindow.getBounds();
    store.set("windowBounds", { width, height, x, y });
  });

  mainWindow.on("move", () => {
    let { x, y } = mainWindow.getBounds();
    store.set("windowBounds", { width, height, x, y });
  });

  setMainWindow(mainWindow);

  return mainWindow;
}

module.exports = { createWindow };
