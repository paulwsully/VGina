import { config } from "dotenv";
config();
import { ipcMain } from "electron";
import { getOverlayTimers, getOverlayBid, getOverlayCurrentBid, getOverlayTracker } from "./windowManager.js";
import { createOverlayBids, createOverlayCurrentBids, createOverlayTimers, createOverlayTracker } from "./window.js";
import Store from "electron-store";

const store = new Store();

const handleOverlay = (overlayKey, getOverlay, createOverlay, eventOnShow, eventOnClose, eventOnLock, eventOnUnlock) => {
  ipcMain.on(eventOnShow, (event) => {
    const window = getOverlay();
    if (window && !window.isDestroyed()) {
      window.show();
    } else {
      createOverlay()
        .then(() => {
          const window = getOverlay();
          window.show();
          const locked = store.get(overlayKey, false);
          window.setIgnoreMouseEvents(locked, { forward: true });
        })
        .catch((error) => {
          console.error(`An error occurred while creating the overlay window: ${overlayKey}`, error);
        });
    }
  });

  ipcMain.on(eventOnClose, () => {
    const window = getOverlay();
    if (window && !window.isDestroyed()) {
      window.close();
    }
  });

  ipcMain.on(eventOnLock, () => {
    const window = getOverlay();
    if (window && !window.isDestroyed()) {
      window.setIgnoreMouseEvents(true, { forward: true });
      window.webContents.executeJavaScript(`document.body.classList.add("no-drag")`, true);
    }
  });

  ipcMain.on(eventOnUnlock, () => {
    const window = getOverlay();
    if (window && !window.isDestroyed()) {
      window.setIgnoreMouseEvents(false);
      window.webContents.executeJavaScript(`document.body.classList.remove("no-drag")`, true);
    }
  });
};

export const getWindowListeners = () => {
  handleOverlay("overlayTimers", getOverlayTimers, createOverlayTimers, "open-showOverlayTimers-window", "close-showOverlayTimers-window", "lock-lockOverlayTimers-window", "unlock-lockOverlayTimers-window");
  handleOverlay("overlayBids", getOverlayBid, createOverlayBids, "open-showOverlayBids-window", "close-showOverlayBids-window", "lock-lockOverlayBids-window", "unlock-lockOverlayBids-window");
  handleOverlay("overlayCurrentBids", getOverlayCurrentBid, createOverlayCurrentBids, "open-showOverlayCurrentBids-window", "close-showOverlayCurrentBids-window", "lock-lockOverlayCurrentBids-window", "unlock-lockOverlayCurrentBids-window");
  handleOverlay("overlayTracker", getOverlayTracker, createOverlayTracker, "open-showOverlayTracker-window", "close-showOverlayTracker-window", "lock-lockOverlayTracker-window", "unlock-lockOverlayTracker-window");
};
