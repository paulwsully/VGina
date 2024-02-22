import { app, globalShortcut, clipboard } from "electron";
import { createMainWindow, createOverlayBids, createOverlayTimers, createOverlayTracker } from "./window.js";
import { getOverlayBid, getOverlayTimers, getOverlayTracker } from "./windowManager.js";
import Store from "electron-store";
import pkg from "electron-updater";
const { autoUpdater } = pkg;
import ks from "node-key-sender";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function setupAppLifecycle() {
  function copyPackagedSoundsToUserData() {
    const userDataPath = app.getPath("userData");
    const soundsDirPath = path.join(userDataPath, "sounds");

    if (!fs.existsSync(soundsDirPath)) {
      fs.mkdirSync(soundsDirPath, { recursive: true });
    }
    const sourcePath = path.join(__dirname, "../sounds");
    fs.readdir(sourcePath, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.error("Error reading sounds directory:", err);
        return;
      }
      files.forEach((file) => {
        const sourceFilePath = path.join(sourcePath, file.name);
        const destFilePath = path.join(soundsDirPath, file.name);
        if (file.isFile()) {
          fs.copyFileSync(sourceFilePath, destFilePath);
        } else if (file.isDirectory()) {
          console.error(`Directory copying not implemented for: ${file.name}`);
        }
      });
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  app.whenReady().then(async () => {
    autoUpdater.checkForUpdatesAndNotify();
    copyPackagedSoundsToUserData();
    createMainWindow();
    const store = new Store();

    const showOverlayBids = store.get("showOverlayBids", false);
    const lockOverlayBids = store.get("lockOverlayBids", false);

    const showOverlayTimers = store.get("showOverlayTimers", false);
    const lockOverlayTimers = store.get("lockOverlayTimers", false);

    const showOverlayTracker = store.get("showOverlayTracker", false);
    const lockOverlayTracker = store.get("lockOverlayTracker", false);

    if (showOverlayBids) {
      createOverlayBids()
        .then(() => {
          const overlayBidWindow = getOverlayBid();
          overlayBidWindow.setIgnoreMouseEvents(lockOverlayBids, { forward: true });
          overlayBidWindow.webContents.executeJavaScript(`document.body.classList.add("${lockOverlayBids ? "no-drag" : "drag"}")`, true);
        })
        .catch((err) => console.log(err));
    }
    if (showOverlayTimers) {
      createOverlayTimers()
        .then(() => {
          const overlayTimersWindow = getOverlayTimers();
          overlayTimersWindow.setIgnoreMouseEvents(lockOverlayTimers, { forward: true });
          overlayTimersWindow.webContents.executeJavaScript(`document.body.classList.add("${lockOverlayTimers ? "no-drag" : "drag"}")`, true);
        })
        .catch((err) => console.log(err));
    }
    if (showOverlayTracker) {
      createOverlayTracker()
        .then(() => {
          const overlayTrackerWindow = getOverlayTracker();
          overlayTrackerWindow.setIgnoreMouseEvents(lockOverlayTracker, { forward: true });
          overlayTrackerWindow.webContents.executeJavaScript(`document.body.classList.add("${lockOverlayTracker ? "no-drag" : "drag"}")`, true);
        })
        .catch((err) => console.log(err));
    }
    globalShortcut.register("CommandOrControl+Alt+Z", async () => {
      await sleep(500);
      const text = clipboard.readText();
      await ks.sendText(text);
    });
    autoUpdater.checkForUpdatesAndNotify();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
  });

  autoUpdater.on("error", (error) => {
    console.error(`Update error: ${error}`);
  });

  autoUpdater.on("update-available", () => {
    console.log("Update available");
  });

  autoUpdater.on("update-not-available", () => {
    console.log("Update not available");
  });

  autoUpdater.on("update-downloaded", () => {
    console.log("Update downloaded; will install now");
  });
}

export { setupAppLifecycle };
