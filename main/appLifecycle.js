import { app, globalShortcut, clipboard } from "electron";
import { createWindow, createOverlayBids, createOverlayTimers } from "./window.js";
import { getOverlayBid, getOverlayTimers } from "./windowManager.js";
import Store from "electron-store";
import pkg from "electron-updater";
const { autoUpdater } = pkg;
const store = new Store();
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
          console.log(`Directory copying not implemented for: ${file.name}`);
        }
      });
    });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  app.whenReady().then(() => {
    autoUpdater.checkForUpdatesAndNotify();
    copyPackagedSoundsToUserData();
    createWindow();
    const store = new Store();
    const showBidsOverlay = store.get("showBidsOverlay", false);
    const overlayBidLocked = store.get("overlayBidLocked", false);
    const showTimersOverlay = store.get("showTimersOverlay", false);
    const overlayTimersLocked = store.get("overlayTimersLocked", false);
    if (showBidsOverlay) {
      createOverlayBids()
        .then(() => {
          const overlayBidWindow = getOverlayBid();
          overlayBidWindow.setIgnoreMouseEvents(overlayBidLocked, { forward: true });
          overlayBidWindow.webContents.executeJavaScript(`document.body.classList.add("${overlayBidLocked ? "no-drag" : "drag"}")`, true);
        })
        .catch((err) => console.log(err));
    }
    if (showTimersOverlay) {
      createOverlayTimers()
        .then(() => {
          const overlayTimersWindow = getOverlayTimers();
          overlayTimersWindow.setIgnoreMouseEvents(overlayTimersLocked, { forward: true });
          overlayTimersWindow.webContents.executeJavaScript(`document.body.classList.add("${overlayTimersLocked ? "no-drag" : "drag"}")`, true);
        })
        .catch((err) => console.log(err));
    }
    globalShortcut.register("CommandOrControl+Alt+Z", async () => {
      await sleep(500);
      const text = clipboard.readText();
      await ks.sendText(text);
    });
    // globalShortcut.register("Escape", () => {
    //   const itemDetailsWindow = getOverlayItemDetails();
    //   if (itemDetailsWindow && !itemDetailsWindow.isDestroyed()) {
    //     itemDetailsWindow.close();
    //   }
    // });
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
    console.log(`Update error: ${error}`);
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
