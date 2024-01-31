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
      webSecurity: false,
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

function createBidOverlay() {
  if (bidOverlay) return;

  let bidOverlayState = store.get("bidOverlayState", {
    width: 800,
    height: 152,
    x: null,
    y: null,
  });

  bidOverlay = new BrowserWindow({
    opacity: 1,
    width: bidOverlayState.width,
    height: bidOverlayState.height,
    x: bidOverlayState.x,
    y: bidOverlayState.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      webSecurity: false,
      contextIsolation: true,
      preload: path.join(__dirname, "./preload.js"),
    },
  });

  const startUrl = app.isPackaged
    ? url.format({
        pathname: path.join(__dirname, "./index.html"),
        protocol: "file:",
        slashes: true,
        hash: "/bids/overlay",
      })
    : "http://localhost:3000/bids/overlay";

  bidOverlay.loadURL(startUrl);

  // bidOverlay.webContents.openDevTools();

  bidOverlay &&
    bidOverlay.webContents.on("did-finish-load", async () => {
      const contentHeight = await bidOverlay.webContents.executeJavaScript("document.body.scrollHeight");
      bidOverlay.setSize(800, contentHeight);
    });

  bidOverlay && bidOverlay.setIgnoreMouseEvents(false);

  bidOverlay &&
    bidOverlay.on("closed", () => {
      bidOverlay = null;
    });

  bidOverlay.on("close", saveBidOverlayState);
  bidOverlay.on("resize", saveBidOverlayState);
  bidOverlay.on("move", saveBidOverlayState);

  ipcMain.on("closeBidOverlay", (event) => {
    if (bidOverlay && !bidOverlay.isDestroyed()) {
      saveSettings(bidOverlay, "bidOverlay");
    }
    bidOverlay.close();
  });

  setBidOverlay(bidOverlayState);
  return bidOverlayState;
}

module.exports = { createWindow, createBidOverlay };
