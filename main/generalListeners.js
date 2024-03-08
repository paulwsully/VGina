import { config } from "dotenv";
config();
import { ipcMain, dialog } from "electron";
import { getMainWindow, getOverlayBid, getOverlayCurrentBid } from "./windowManager.js";
import Store from "electron-store";
const store = new Store();

let fileWatcher = null;

export const generalListeners = () => {
  ipcMain.on("minimize-app", () => getMainWindow().minimize());
  ipcMain.on("close-app", () => getMainWindow().close());
  ipcMain.on("file-name", (event, fileName) => event.sender.send("file-name", fileName));
  ipcMain.on("storeSet", (event, key, value) => store.set({ [key]: value }));
  ipcMain.on("set-last-tab", (event, tabPath) => store.set("lastActiveTab", tabPath));
  ipcMain.handle("storeGet", (event, key) => store.get(key));
  ipcMain.handle("get-last-tab", async () => store.get("lastActiveTab"));
  ipcMain.handle("get-rolls", async () => store.get("rolls", []));
  ipcMain.handle("get-triggers", async () => store.get("triggers", []));
  ipcMain.on("install-update", () => autoUpdater.quitAndInstall());

  ipcMain.handle("open-file-dialog", async () => {
    try {
      const result = await dialog.showOpenDialog(getMainWindow(), { properties: ["openFile"] });
      return result;
    } catch (err) {
      console.error("Error in open-file-dialog handler:", err);
    }
  });

  ipcMain.on("maximize-app", () => {
    const mainWindow = getMainWindow();
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  });

  ipcMain.on("enable-only-click-through", () => {
    const overlayBidWindow = getOverlayBid();
    const overlayCurrentBidWindow = getOverlayCurrentBid();
    if (overlayBidWindow && !overlayBidWindow.isDestroyed()) overlayBidWindow.setIgnoreMouseEvents(true, { forward: true });
    if (overlayCurrentBidWindow && !overlayCurrentBidWindow.isDestroyed()) overlayCurrentBidWindow.setIgnoreMouseEvents(true, { forward: true });
  });

  ipcMain.on("disable-only-click-through", () => {
    const overlayBidWindow = getOverlayBid();
    const overlayCurrentBidWindow = getOverlayCurrentBid();
    if (overlayBidWindow && !overlayBidWindow.isDestroyed()) overlayBidWindow.setIgnoreMouseEvents(false);
    if (overlayCurrentBidWindow && !overlayCurrentBidWindow.isDestroyed()) overlayCurrentBidWindow.setIgnoreMouseEvents(false);
  });

  ipcMain.once("stop-file-watch", () => {
    if (fileWatcher) {
      fileWatcher.close();
      fileWatcher = null;
    }
  });

  ipcMain.handle("close-roll", async (event, rollMax) => {
    const rolls = store.get("rolls", []);
    const updatedRolls = rolls.filter((roll) => roll.rollMax !== rollMax);
    store.set("rolls", updatedRolls);

    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("rolls-updated");
    }
  });
};
