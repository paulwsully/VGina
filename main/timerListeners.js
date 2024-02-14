import { config } from "dotenv";
config();
import { ipcMain } from "electron";
import { getOverlayTimers } from "./windowManager.js";
import { createOverlayTimers } from "./window.js";
import Store from "electron-store";

const store = new Store();

export const getTimerListeners = () => {
  ipcMain.handle("get-overlayTimersLocked", async () => {
    return store.get("overlayTimersLocked", false);
  });

  ipcMain.handle("get-activeTimers", async () => {
    return store.get("activeTimers", false);
  });

  ipcMain.on("remove-activeTimer", (event, timerId) => {
    const activeTimers = store.get("activeTimers", []);
    const updatedTimers = activeTimers.filter((timer) => timer.id !== timerId);
    store.set("activeTimers", updatedTimers);
  });

  ipcMain.on("open-overlay-timers", (event) => {
    const overlayTimerWindow = getOverlayTimers();
    if (overlayTimerWindow && !overlayTimerWindow.isDestroyed()) return;
    createOverlayTimers()
      .then((overlayTimer) => {
        const locked = store.get("overlayTimersLocked", false);
        const overlayTimerWindow = getOverlayTimers();
        overlayTimerWindow.setIgnoreMouseEvents(locked, { forward: true });
      })
      .catch((error) => {
        console.error("An error occurred while creating the overlay timers window:", error);
      });
  });

  ipcMain.on("close-overlay-timers", () => {
    const overlayTimerWindow = getOverlayTimers();
    if (overlayTimerWindow && !overlayTimerWindow.isDestroyed()) {
      overlayTimerWindow.close();
    }
  });

  ipcMain.on("lock-overlay-timers", () => {
    const overlayTimersWindow = getOverlayTimers();
    if (overlayTimersWindow && !overlayTimersWindow.isDestroyed()) {
      overlayTimersWindow.setIgnoreMouseEvents(true, { forward: true });
      overlayTimersWindow.webContents.executeJavaScript(`document.body.classList.add("no-drag")`, true);
    }
  });

  ipcMain.on("unlock-overlay-timers", () => {
    const overlayTimersWindow = getOverlayTimers();
    if (overlayTimersWindow && !overlayTimersWindow.isDestroyed()) {
      overlayTimersWindow.setIgnoreMouseEvents(false);
      overlayTimersWindow.webContents.executeJavaScript(`document.body.classList.remove("no-drag")`, true);
    }
  });

  ipcMain.on("timersOverlay-resize", (event, { width, height }) => {
    const overlayTimerWindow = getOverlayTimers();
    if (overlayTimerWindow && !overlayTimerWindow.isDestroyed()) {
      const roundedWidth = Math.round(width);
      const roundedHeight = Math.round(height);

      overlayTimerWindow.setSize(roundedWidth, roundedHeight);
    }
  });
};
