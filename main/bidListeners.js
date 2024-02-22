import { ipcMain, app } from "electron";
import { getMainWindow, getOverlayBid } from "./windowManager.js";
import { createOverlayBids } from "./window.js";
import { ref, push } from "firebase/database";
import database from "./../firebaseConfig.js";
import Store from "electron-store";

const store = new Store();

export const getBidsListeners = () => {
  ipcMain.handle("get-bids", async (event) => {
    try {
      const activeBids = store.get("activeBids", []);
      return activeBids;
    } catch (err) {
      console.error("Error in get-bids handler:", err);
    }
  });

  ipcMain.handle("close-bid", async (event, { itemName, bidders }) => {
    const logFilePath = store.get("logFile", false);
    const nameMatch = logFilePath.match(/eqlog_(.+?)_pq.proj.txt/);
    const playerName = nameMatch ? nameMatch[1] : "Unknown";

    const timestamp = new Date().toISOString();
    const closedBid = { item: itemName, bidders, timestamp, bidTaker: playerName };
    const closedBidsRef = ref(database, "closedBids");
    if (app.isPackaged) {
      push(closedBidsRef, closedBid);
    }

    const activeBids = store.get("activeBids", []).filter((bid) => bid.item !== itemName);
    store.set("activeBids", activeBids);

    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("activeBids-updated");
    }

    const locked = store.get("lockOverlayBids", false);

    const overlayBidWindow = getOverlayBid();
    if (overlayBidWindow && !overlayBidWindow.isDestroyed()) {
      overlayBidWindow.webContents.send("activeBids-updated");
      overlayBidWindow.setIgnoreMouseEvents(locked);
      if (locked) overlayBidWindow.webContents.executeJavaScript(`document.body.classList.add("no-drag")`, true);
    }

    return true;
  });

  ipcMain.on("request-bids", async (event) => {
    const activeBids = store.get("activeBids", []);
    event.reply("bids-updated", activeBids);
  });

  ipcMain.handle("get-lockOverlayBids", async () => {
    return store.get("lockOverlayBids", false);
  });
};
