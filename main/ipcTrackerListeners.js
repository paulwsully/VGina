import { ipcMain } from "electron";
import Store from "electron-store";

const store = new Store();

export const getTrackerListeners = () => {
  ipcMain.handle("get-lockOverlayTracker", async () => {
    return store.get("lockOverlayTracker", false);
  });

  ipcMain.handle("get-activeTracker", async () => {
    return store.get("activeTracker", false);
  });
};
