import { config } from "dotenv";
config();
import { ipcMain } from "electron";
import { getOverlayItemDetails } from "./windowManager.js";
import { createItemDetailsWindow } from "./window.js";
import Store from "electron-store";
const store = new Store();
import { itemsData } from "./itemsData.js";

export const getItemDetailsListeners = () => {
  ipcMain.handle("read-itemsData", async (event) => {
    return itemsData;
  });

  ipcMain.handle("set-foundItem", async (event, itemData) => {
    store.set("foundItem", itemData);
  });

  ipcMain.handle("get-foundItem", async (event) => {
    return store.get("foundItem");
  });

  ipcMain.handle("open-itemDetailsWindow", async (event, position) => {
    const itemDetailsWindow = getOverlayItemDetails();
    if (itemDetailsWindow && !itemDetailsWindow.isDestroyed()) {
      itemDetailsWindow.close();
    }
    createItemDetailsWindow();
  });

  ipcMain.on("itemDetailsWindow-resize", (event, { width, height }) => {
    const itemDetailsWindow = getOverlayItemDetails();
    if (itemDetailsWindow && !itemDetailsWindow.isDestroyed()) {
      const roundedWidth = Math.round(width);
      const roundedHeight = Math.round(height);

      itemDetailsWindow.setSize(roundedWidth + 4, roundedHeight + 4);
    }
  });

  ipcMain.handle("close-itemDetailsWindow", (event) => {
    const itemDetailsWindow = getOverlayItemDetails();
    if (itemDetailsWindow && !itemDetailsWindow.isDestroyed()) {
      itemDetailsWindow.close();
    }
  });
};
