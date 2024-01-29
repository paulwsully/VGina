const { ipcMain, dialog } = require("electron");
const Store = require("electron-store");
const { getMainWindow } = require("./windowManager");
const store = new Store();
const readLastLines = require("read-last-lines");
const fs = require("fs");

function setupIpcHandlers() {
  ipcMain.on("minimize-app", () => getMainWindow().minimize());

  ipcMain.on("maximize-app", () => {
    const mainWindow = getMainWindow();
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  });

  ipcMain.on("close-app", () => getMainWindow().close());

  ipcMain.handle("open-file-dialog", async () => {
    try {
      const result = await dialog.showOpenDialog(getMainWindow(), { properties: ["openFile"] });
      return result;
    } catch (err) {
      console.error("Error in open-file-dialog handler:", err);
    }
  });

  ipcMain.on("file-name", (event, fileName) => {
    event.sender.send("file-name", fileName);
  });

  ipcMain.on("storeSet", (event, key, value) => {
    store.set({ [key]: value });
  });

  ipcMain.handle("storeGet", (event, key) => {
    return store.get(key);
  });

  ipcMain.on("set-last-tab", (event, tabPath) => {
    store.set("lastActiveTab", tabPath);
  });

  ipcMain.handle("get-last-tab", async () => {
    return store.get("lastActiveTab");
  });

  let fileWatcher = null;
  let lastFiveLines = [];
  const NUM_LINES_TO_READ = 5;

  const updateFileWatch = async (filePath) => {
    const currentLines = (await readLastLines.read(filePath, NUM_LINES_TO_READ)).split("\n").slice(0, -1);
    const newLines = [];

    for (let i = currentLines.length - 1; i >= 0; i--) {
      if (!lastFiveLines.includes(currentLines[i])) {
        newLines.unshift(currentLines[i]);
      }
    }

    newLines.slice(0, 5).forEach((line) => processNewLine(line));
    lastFiveLines = currentLines.slice(-5);
  };

  ipcMain.on("start-file-watch", async () => {
    try {
      const filePath = store.get("logFile");
      if (filePath) {
        lastFiveLines = (await readLastLines.read(filePath, NUM_LINES_TO_READ)).split("\n").slice(0, -1);

        fileWatcher = fs.watch(filePath, async (eventType, filename) => {
          try {
            if (filename) {
              await updateFileWatch(filePath);
            }
          } catch (watchErr) {
            console.error("Error in file watch:", watchErr);
          }
        });
      }
    } catch (err) {
      console.error("Error in start-file-watch handler:", err);
    }
  });

  ipcMain.on("stop-file-watch", () => {
    if (fileWatcher) {
      fileWatcher.close();
      fileWatcher = null;
    }
  });

  ipcMain.on("request-bids", async (event) => {
    const activeBids = store.get("activeBids", []);
    console.log(activeBids);
    event.reply("bids-updated", activeBids);
  });

  ipcMain.handle("get-bids", async (event) => {
    try {
      const activeBids = store.get("activeBids", []);
      return activeBids;
    } catch (err) {
      console.error("Error in get-bids handler:", err);
    }
  });

  ipcMain.handle("close-bid", async (event, { itemName, bidders }) => {
    const timestamp = new Date().toISOString();
    const closedBids = store.get("closedBids", []);
    closedBids.push({ item: itemName, bidders, timestamp });
    store.set("closedBids", closedBids);
    const activeBids = store.get("activeBids", []).filter((bid) => bid.item !== itemName);
    store.set("activeBids", activeBids);
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("bids-updated");
    }

    return true;
  });

  ipcMain.handle("get-rolls", async (event) => {
    return store.get("rolls", []);
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

  store.onDidChange("activeBids", (newValue, oldValue) => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("bids-updated");
    }
  });

  function updateRolls() {
    const updatedRolls = store.get("rolls", []);
    if (Array.isArray(updatedRolls)) {
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("rolls-updated");
      }
    } else {
      console.error("Invalid rolls data:", updatedRolls);
    }
  }

  function processNewLine(line) {
    if (line.includes("**A Magic Die is rolled by") || line.includes("**It could have been any number from")) {
      parseRolls(line);
    }

    if (line.includes("tells you,")) {
      parseLineForBid(line);
    }
    if (line.includes("snared")) {
      store.set("latestLine", line);
      getMainWindow().webContents.send("new-line", line);
    }
  }

  function parseLineForBid(line) {
    const regex = /\[\w+ \w+ \d+ \d+:\d+:\d+ \d+\] (\w+) tells you, '([^']+?) (\d+)'/;
    const match = line.match(regex);

    if (match) {
      const name = match[1];
      const item = match[2];
      const dkp = parseInt(match[3], 10);

      if (name && item && !isNaN(dkp)) {
        updateActiveBids({ name, item, dkp });
      }
    } else {
      console.log("No match found for line:", line);
    }
  }

  function updateActiveBids({ name, item, dkp }) {
    let activeBids = store.get("activeBids", []);

    const itemIndex = activeBids.findIndex((bid) => bid.item === item);

    if (itemIndex !== -1) {
      const bidderIndex = activeBids[itemIndex].bidders.findIndex((bidder) => bidder.name === name);

      if (bidderIndex !== -1) {
        activeBids[itemIndex].bidders[bidderIndex].dkp = dkp;
      } else {
        activeBids[itemIndex].bidders.push({ name, dkp });
      }
    } else {
      activeBids.push({
        item: item,
        bidders: [{ name, dkp }],
      });
    }

    store.set("activeBids", activeBids);
  }

  let currentRoller = null; // For keeping track of the current roller
  let lines = []; // For storing all lines

  function parseRolls(newLine) {
    lines.push(newLine); // Add the new line to the lines array
    const index = lines.length - 1; // Index of the new line

    if (newLine && typeof newLine === "string") {
      if (newLine.includes("**A Magic Die is rolled by")) {
        currentRoller = newLine.split(" ").pop().slice(0, -2); // Removes the period
      } else if (newLine.includes("**It could have been any number from") && currentRoller) {
        const previousLine = lines[index - 1];
        if (previousLine && previousLine.includes("**A Magic Die is rolled by")) {
          const parts = newLine.match(/(\d+) to (\d+), but this time it turned up a (\d+)/);
          if (parts) {
            const rollMax = parseInt(parts[2], 10);
            const roll = parseInt(parts[3], 10);
            addRoll(rollMax, currentRoller, roll);
            currentRoller = null; // Reset for the next roll
            lines = [];
          }
        }
      }
    }
  }

  function addRoll(rollMax, rollerName, roll) {
    const rolls = store.get("rolls", []);
    let rollEntry = rolls.find((entry) => entry.rollMax === rollMax);

    if (!rollEntry) {
      // If no rollEntry for this rollMax, create a new one
      rollEntry = { rollMax, rollers: [] };
      rolls.push(rollEntry);
    }

    // Check if this roller has already rolled for this rollMax
    const hasRolled = rollEntry.rollers.some((roller) => roller.name === rollerName);

    if (!hasRolled) {
      // Add the roll if the roller hasn't rolled yet
      rollEntry.rollers.push({ name: rollerName, roll });
      store.set("rolls", rolls);
    }
    updateRolls();
  }
}

module.exports = { setupIpcHandlers };
