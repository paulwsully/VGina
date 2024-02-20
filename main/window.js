import { app, BrowserWindow } from "electron";
import throttle from "lodash.throttle";
import { setMainWindow, setOverlayBid, setOverlayTimers, setOverlayItemDetails, setOverlayTracker } from "./windowManager.js";
import { fileURLToPath } from "url";
import Store from "electron-store";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();
const isDev = !app.isPackaged;

function createWindow() {
  let { width, height, x, y } = store.get("windowBounds", { width: 1000, height: 1000 });
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

  mainWindow.loadURL(isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../dist/index.html")}`);

  mainWindow.on(
    "resize",
    throttle(() => {
      let bounds = store.get("windowBounds", { width: 1000, height: 1000, x: 0, y: 0 });
      let { width, height } = mainWindow.getBounds();
      store.set("windowBounds", { ...bounds, width, height });
    }, 500)
  );

  mainWindow.on(
    "move",
    throttle(() => {
      let bounds = store.get("windowBounds", { width: 1000, height: 1000, x: 0, y: 0 });
      let { x, y } = mainWindow.getBounds();
      store.set("windowBounds", { ...bounds, x, y });
    }, 500)
  );

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

    overlayBid.loadURL(isDev ? "http://localhost:3000/dkp-and-loot/overlay/bids" : `file://${path.join(__dirname, "../dist/index.html#/dkp-and-loot/overlay/bids").replace(/\\/g, "/")}`);

    overlayBid.webContents.once("did-finish-load", () => {
      resolve(overlayBid); // Resolve the promise with the overlayBid window
    });

    overlayBid.on(
      "resize",
      throttle(() => {
        let bounds = store.get("overlayBidBounds", { width: 1000, height: 1000, x: 0, y: 0 });
        let { width, height } = overlayBid.getBounds();
        store.set("overlayBidBounds", { ...bounds, width, height });
      }, 500)
    );

    overlayBid.on(
      "move",
      throttle(() => {
        let bounds = store.get("overlayBidBounds", { width: 1000, height: 1000, x: 0, y: 0 });
        let { x, y } = overlayBid.getBounds();
        store.set("overlayBidBounds", { ...bounds, x, y });
      }, 500)
    );

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

    overlayTimers.loadURL(isDev ? "http://localhost:3000/dkp-and-loot/overlay/timers" : `file://${path.join(__dirname, "../dist/index.html#/dkp-and-loot/overlay/timers").replace(/\\/g, "/")}`);

    overlayTimers.webContents.once("did-finish-load", () => {
      resolve(overlayTimers);
    });

    overlayTimers.on(
      "resize",
      throttle(() => {
        let bounds = store.get("overlayTimersBounds", { width: 1000, height: 1000, x: 0, y: 0 });
        let { width, height } = overlayTimers.getBounds();
        store.set("overlayTimersBounds", { ...bounds, width, height });
      }, 500)
    );

    overlayTimers.on(
      "move",
      throttle(() => {
        let bounds = store.get("overlayTimersBounds", { width: 1000, height: 1000, x: 0, y: 0 });
        let { x, y } = overlayTimers.getBounds();
        store.set("overlayTimersBounds", { ...bounds, x, y });
      }, 500)
    );

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

    overlayItemDetails.loadURL(
      isDev ? "http://localhost:3000/dkp-and-loot/overlay/item-details" : `file://${path.join(__dirname, "../dist/index.html#/dkp-and-loot/overlay/item-details").replace(/\\/g, "/")}`
    );

    overlayItemDetails.webContents.once("did-finish-load", () => {
      resolve(overlayItemDetails);
    });

    setOverlayItemDetails(overlayItemDetails);

    overlayItemDetails.on(
      "move",
      throttle(() => {
        let bounds = store.get("overlayItemDetailsBounds", { width: 1000, height: 1000, x: 0, y: 0 });
        let { x, y } = overlayTimers.getBounds();
        store.set("overlayItemDetailsBounds", { ...bounds, x, y });
      }, 500)
    );
    // overlayItemDetails.webContents.openDevTools();
  });
}

function createTrackerWindow() {
  return new Promise((resolve, reject) => {
    let { width, height, x, y } = store.get("trackerWindowBounds", { width: 300, height: 300 });
    const trackerWindow = new BrowserWindow({
      x,
      y,
      width,
      height,
      x,
      y,
      width: 300,
      height: 300,
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

    trackerWindow.loadURL(isDev ? "http://localhost:3000/dkp-and-loot/overlay/tracker" : `file://${path.join(__dirname, "../dist/index.html#/dkp-and-loot/overlay/tracker").replace(/\\/g, "/")}`);

    trackerWindow.webContents.once("did-finish-load", () => {
      resolve(trackerWindow);
    });

    trackerWindow.webContents.once("did-finish-load", () => {
      resolve(trackerWindow);
    });

    trackerWindow.on(
      "move",
      throttle(() => {
        let bounds = store.get("trackerWindowBounds", { width: 1000, height: 1000, x: 0, y: 0 });
        let { x, y } = trackerWindow.getBounds();
        store.set("trackerWindowBounds", { ...bounds, x, y });
      }, 500)
    );

    trackerWindow.on("closed", () => {
      reject(new Error("trackerWindow window was closed before it could finish loading."));
    });

    setOverlayTracker(trackerWindow);
    // trackerWindow.webContents.openDevTools();
  });
}

export { createWindow, createOverlayBids, createOverlayTimers, createItemDetailsWindow, createTrackerWindow };
