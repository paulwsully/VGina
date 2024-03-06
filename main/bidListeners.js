import { ipcMain } from "electron";
import { ref, get, remove, update } from "firebase/database";
import database from "./../firebaseConfig.js";
import Store from "electron-store";

const store = new Store();

export const getBidsListeners = () => {
  ipcMain.handle("close-bid", async (event, bidId) => {
    if (!bidId) return false;

    const bidRef = ref(database, `currentBids/${bidId}`);
    const closedBidsRef = ref(database, "closedBids");

    try {
      const snapshot = await get(bidRef);
      if (snapshot.exists()) {
        const bidData = snapshot.val();
        const closedBidUpdate = {};
        closedBidUpdate[`${bidId}`] = bidData;
        await update(closedBidsRef, closedBidUpdate);
        await remove(bidRef);
        return true;
      } else {
        console.log("No matching bid found for ID:", bidId);
        return false;
      }
    } catch (error) {
      console.error("Failed to close bid:", error);
      return false;
    }
  });

  ipcMain.on("request-bids", async (event) => {
    const activeBids = store.get("activeBids", []);
    event.reply("bids-updated", activeBids);
  });

  ipcMain.handle("get-lockOverlayBids", async () => {
    return store.get("lockOverlayBids", false);
  });
};
