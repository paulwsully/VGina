import { ipcMain } from "electron";
import { getOverlayTracker } from "./windowManager.js";
import { createTrackerWindow } from "./window.js";
import Store from "electron-store";

const store = new Store();

export const getTrackerListeners = () => {
  ipcMain.on("open-tracker-overlay-window", (event) => {
    createTrackerWindow()
      .then((overlayBid) => {
        const locked = store.get("trackerOverlayLock", false);
        const overlayTrackerWindow = getOverlayTracker();
        overlayTrackerWindow.show();
        overlayTrackerWindow.setIgnoreMouseEvents(locked, { forward: true });
      })
      .catch((error) => {
        console.error("An error occurred while creating the overlay bids window:", error);
      });
  });

  ipcMain.on("close-tracker-overlay-window", () => {
    const overlayTrackerWindow = getOverlayTracker();
    if (overlayTrackerWindow && !overlayTrackerWindow.isDestroyed()) {
      overlayTrackerWindow.close();
    }
  });

  ipcMain.on("lock-overlay-tracker", () => {
    const overlayTrackerWindow = getOverlayTracker();
    if (overlayTrackerWindow && !overlayTrackerWindow.isDestroyed()) {
      overlayTrackerWindow.setIgnoreMouseEvents(true, { forward: true });
      overlayTrackerWindow.webContents.executeJavaScript(`document.body.classList.add("no-drag")`, true);
    }
  });

  ipcMain.on("unlock-overlay-tracker", () => {
    const overlayTrackerWindow = getOverlayTracker();
    if (overlayTrackerWindow && !overlayTrackerWindow.isDestroyed()) {
      overlayTrackerWindow.setIgnoreMouseEvents(false);
      overlayTrackerWindow.webContents.executeJavaScript(`document.body.classList.remove("no-drag")`, true);
    }
  });
};
