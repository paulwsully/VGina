import { ipcMain, app } from "electron";
import { getMainWindow, getOverlayBid } from "./windowManager.js";
import { ref, get, remove, update } from "firebase/database";
import database from "./../firebaseConfig.js";
import Store from "electron-store";

const store = new Store();

export const getBidsListeners = () => {
  ipcMain.handle("close-bid", async (event, bidId) => {
    console.log("Received bidId for closing:", bidId);
    if (!bidId) {
      console.error("No bid ID provided");
      return false;
    }

    const bidRef = ref(database, `currentBids/${bidId}`);
    const closedBidsRef = ref(database, "closedBids");

    try {
      // Retrieve the bid to be closed
      const snapshot = await get(bidRef);
      if (snapshot.exists()) {
        const bidData = snapshot.val();
        console.log("Matching bid object to close:", bidData);

        const closedBidUpdate = {};
        closedBidUpdate[`${bidId}`] = bidData; // Use same bidId for consistency
        await update(closedBidsRef, closedBidUpdate);
        await remove(bidRef);

        console.log("Bid successfully moved to closedBids:", bidId);
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
