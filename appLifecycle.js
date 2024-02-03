import { app, globalShortcut, clipboard } from "electron";
import { createWindow, createOverlayBids } from "./window.js";
import { getOverlayBid } from "./windowManager.js"; // Adjust path as necessary
import Store from "electron-store";
const store = new Store();
import ks from "node-key-sender";
import fs from "fs";
import { promises as fsPromises } from "fs";
const { readdir, copyFile } = fsPromises;
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
    const sourcePath = path.join(__dirname, "sounds");
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
    copyPackagedSoundsToUserData();
    createWindow();
    const store = new Store();
    const showBidsOverlay = store.get("showBidsOverlay", false);
    const overlayBidLocked = store.get("overlayBidLocked", false);
    if (showBidsOverlay) {
      createOverlayBids()
        .then(() => {
          const overlayBidWindow = getOverlayBid();
          overlayBidWindow.setIgnoreMouseEvents(overlayBidLocked, { forward: true });
          overlayBidWindow.webContents.executeJavaScript(`document.body.classList.add("${overlayBidLocked ? "no-drag" : "drag"}")`, true);
        })
        .catch((err) => console.log(err));
    }
    globalShortcut.register("CommandOrControl+Alt+Z", async () => {
      await sleep(500);
      const text = clipboard.readText();
      await ks.sendText(text);
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

export { setupAppLifecycle };
