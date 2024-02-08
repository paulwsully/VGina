import { app, BrowserWindow } from "electron";
import { setMainWindow, setOverlayBid, setOverlayTimers, setOverlayItemDetails } from "./windowManager.js";
import { fileURLToPath } from "url";
import Store from "electron-store";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();
const isDev = !app.isPackaged;
const url = isDev;

function createWindow() {
  let { width, height, x, y } = store.get("windowBounds", { width: 800, height: 1000 });
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

  mainWindow.loadURL(isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "dist/index.html")}`);

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

function createOverlayBids() {
  return new Promise((resolve, reject) => {
    let { width, height, x, y } = store.get("overlayBidBounds", { width: 800, height: 300 });
    const overlayBid = new BrowserWindow({
      x,
      y,
      width,
      height: 172 + 16,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
      },
    });

    overlayBid.loadURL(isDev ? "http://localhost:3000/dkp-and-loot/overlay/bids" : `file://${__dirname.replace(/\\/g, "/")}/dist/index.html#/dkp-and-loot/overlay/bids`);

    overlayBid.webContents.once("did-finish-load", () => {
      resolve(overlayBid); // Resolve the promise with the overlayBid window
    });

    overlayBid.on("resize", () => {
      let { width, height } = overlayBid.getBounds();
      store.set("overlayBidBounds", { width, height, x, y });
    });

    overlayBid.on("move", () => {
      let { x, y } = overlayBid.getBounds();
      store.set("overlayBidBounds", { width, height, x, y });
    });

    overlayBid.on("closed", () => {
      reject(new Error("OverlayBid window was closed before it could finish loading."));
    });

    setOverlayBid(overlayBid);
    // overlayBid.webContents.openDevTools();
  });
}

function createOverlayTimers() {
  return new Promise((resolve, reject) => {
    let { width, height, x, y } = store.get("overlayTimersBounds", { width: 800, height: 300 });
    const overlayTimers = new BrowserWindow({
      x,
      y,
      width,
      height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
      },
    });

    overlayTimers.loadURL(isDev ? "http://localhost:3000/dkp-and-loot/overlay/timers" : `file://${__dirname.replace(/\\/g, "/")}/dist/index.html#/dkp-and-loot/overlay/timers`);

    overlayTimers.webContents.once("did-finish-load", () => {
      resolve(overlayTimers);
    });

    overlayTimers.on("resize", () => {
      let { width, height } = overlayTimers.getBounds();
      store.set("overlayTimersBounds", { width, height, x, y });
    });

    overlayTimers.on("move", () => {
      let { x, y } = overlayTimers.getBounds();
      store.set("overlayTimersBounds", { width, height, x, y });
    });

    overlayTimers.on("closed", () => {
      reject(new Error("OverlayTimers window was closed before it could finish loading."));
    });

    setOverlayTimers(overlayTimers);
    // overlayTimers.webContents.openDevTools();
  });
}

function createItemDetailsWindow() {
  return new Promise((resolve, reject) => {
    const bounds = store.get("overlayItemDetailsBounds", { x: 100, y: 100 });
    const { x, y } = bounds;
    let overlayItemDetails = new BrowserWindow({
      x,
      y,
      width: 100,
      height: 100,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
      },
    });

    overlayItemDetails.loadURL(isDev ? "http://localhost:3000/dkp-and-loot/overlay/item-details" : `file://${__dirname.replace(/\\/g, "/")}/dist/index.html#/dkp-and-loot/overlay/item-details`);

    overlayItemDetails.webContents.once("did-finish-load", () => {
      resolve(overlayItemDetails);
    });

    setOverlayItemDetails(overlayItemDetails);

    overlayItemDetails.on("move", () => {
      let { x, y } = overlayItemDetails.getBounds();
      store.set("overlayItemDetailsBounds", { x, y });
    });
    // overlayItemDetails.webContents.openDevTools();
  });
}

export { createWindow, createOverlayBids, createOverlayTimers, createItemDetailsWindow };
