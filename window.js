import { app, BrowserWindow } from "electron";
import { setMainWindow, setOverlayBid } from "./windowManager.js";
import { fileURLToPath } from "url";
import Store from "electron-store";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let bidOverlay;

const store = new Store();

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

    const isDev = !app.isPackaged;
    const url = isDev ? "http://localhost:3000/dkp-and-loot/overlay/bids" : `file://${__dirname.replace(/\\/g, "/")}/dist/index.html#/dkp-and-loot/overlay/bids`;
    overlayBid.loadURL(url);

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

export { createWindow, createOverlayBids };
