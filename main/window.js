import { app, BrowserWindow } from "electron";
import throttle from "lodash.throttle";
import { setMainWindow, setOverlayBid, setOverlayCurrentBid, setOverlayTimers, setOverlayItemDetails, setOverlayTracker } from "./windowManager.js";
import { fileURLToPath } from "url";
import Store from "electron-store";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();
const isDev = !app.isPackaged;

function createMainWindow() {
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
      resolve(overlayBid);
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

function createOverlayCurrentBids() {
  return new Promise((resolve, reject) => {
    let { width, height, x, y } = store.get("overlayCurrentBidBounds", { width: 800, height: 300 });
    const overlayCurrentBid = new BrowserWindow({
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

    const componentPath = "/dkp-and-loot/overlay/current-bids";

    overlayCurrentBid.loadURL(isDev ? `http://localhost:3000${componentPath}` : `file://${path.join(__dirname, `../dist/index.html#${componentPath}`).replace(/\\/g, "/")}`);

    overlayCurrentBid.webContents.once("did-finish-load", () => {
      resolve(overlayCurrentBid);
    });

    overlayCurrentBid.on(
      "resize",
      throttle(() => {
        let bounds = store.get("overlayCurrentBidBounds", { width: 1000, height: 1000, x: 0, y: 0 });
        let { width, height } = overlayCurrentBid.getBounds();
        store.set("overlayCurrentBidBounds", { ...bounds, width, height });
      }, 500)
    );

    overlayCurrentBid.on(
      "move",
      throttle(() => {
        let bounds = store.get("overlayCurrentBidBounds", { width: 1000, height: 1000, x: 0, y: 0 });
        let { x, y } = overlayCurrentBid.getBounds();
        store.set("overlayCurrentBidBounds", { ...bounds, x, y });
      }, 500)
    );

    overlayCurrentBid.on("closed", () => {
      reject(new Error("OverlayCurrentBid window was closed before it could finish loading."));
    });

    setOverlayCurrentBid(overlayCurrentBid);
    // overlayCurrentBid.webContents.openDevTools();
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

    overlayItemDetails.loadURL(isDev ? "http://localhost:3000/dkp-and-loot/overlay/item-details" : `file://${path.join(__dirname, "../dist/index.html#/dkp-and-loot/overlay/item-details").replace(/\\/g, "/")}`);

    overlayItemDetails.webContents.once("did-finish-load", () => {
      resolve(overlayItemDetails);
    });

    setOverlayItemDetails(overlayItemDetails);

    overlayItemDetails.on(
      "move",
      throttle(() => {
        let bounds = store.get("overlayItemDetailsBounds", { width: 1000, height: 1000, x: 0, y: 0 });
        let { x, y } = overlayItemDetails.getBounds();
        store.set("overlayItemDetailsBounds", { ...bounds, x, y });
      }, 500)
    );
    // overlayItemDetails.webContents.openDevTools();
  });
}

function createOverlayTracker() {
  return new Promise((resolve, reject) => {
    let { width, height, x, y } = store.get("trackerWindowBounds", { width: 300, height: 300 });
    const overlayTracker = new BrowserWindow({
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

    overlayTracker.loadURL(isDev ? "http://localhost:3000/dkp-and-loot/overlay/tracker" : `file://${path.join(__dirname, "../dist/index.html#/dkp-and-loot/overlay/tracker").replace(/\\/g, "/")}`);

    overlayTracker.webContents.once("did-finish-load", () => {
      resolve(overlayTracker);
    });

    overlayTracker.webContents.once("did-finish-load", () => {
      resolve(overlayTracker);
    });

    overlayTracker.on(
      "move",
      throttle(() => {
        let bounds = store.get("trackerWindowBounds", { width: 1000, height: 1000, x: 0, y: 0 });
        let { x, y } = overlayTracker.getBounds();
        store.set("trackerWindowBounds", { ...bounds, x, y });
      }, 500)
    );

    overlayTracker.on("closed", () => {
      reject(new Error("trackerWindow window was closed before it could finish loading."));
    });

    setOverlayTracker(overlayTracker);
    // trackerWindow.webContents.openDevTools();
  });
}

export { createMainWindow, createOverlayBids, createOverlayCurrentBids, createOverlayTimers, createItemDetailsWindow, createOverlayTracker };
