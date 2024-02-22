import { config } from "dotenv";
config();
import { ipcMain } from "electron";
import { getOverlayTimers } from "./windowManager.js";
import Store from "electron-store";

const store = new Store();

export const getTimerListeners = () => {
  ipcMain.handle("get-lockOverlayTimers", async () => {
    return store.get("lockOverlayTimers", false);
  });

  ipcMain.handle("get-activeTimers", async () => {
    return store.get("activeTimers", false);
  });

  ipcMain.on("remove-activeTimer", (event, timerId) => {
    const activeTimers = store.get("activeTimers", []);
    const updatedTimers = activeTimers.filter((timer) => timer.id !== timerId);
    store.set("activeTimers", updatedTimers);
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
