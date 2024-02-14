import { config } from "dotenv";
config();
import { ipcMain } from "electron";
import { getOverlayItemDetails } from "./windowManager.js";
import { createItemDetailsWindow } from "./window.js";
import Store from "electron-store";
const store = new Store();
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getItemDetailsListeners = () => {
  ipcMain.handle("read-itemsData", async (event) => {
    const jsonPath = path.join(__dirname, "./../itemsData.json");
    const data = fs.readFileSync(jsonPath, "utf8");
    return JSON.parse(data);
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
