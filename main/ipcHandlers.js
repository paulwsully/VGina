import { config } from "dotenv";
config();
import { app, ipcMain, clipboard } from "electron";
import { getMainWindow, getOverlayTimers, getOverlayTracker } from "./windowManager.js";
import { ref, get, set, update, push } from "firebase/database";
import { getFunctions, httpsCallable } from "firebase/functions";
import { promises as fsPromises, watchFile, unwatchFile } from "fs";
import { sanitizeFilename } from "./util.js";
import { v4 as uuidv4 } from "uuid";
import { itemsData } from "./itemsData.js";
import Store from "electron-store";
import database from "./../firebaseConfig.js";
import path from "path";
const store = new Store();

function setupIpcHandlers() {
  let lastSize = 0;
  let lastLineCount = 0;
  let currentRoller = null;
  let lines = [];

  let currentWatcher = null;
  let lastFile = "";

  const startWatching = async (directoryPath) => {
    console.log("Looking for new log file to watch");
    try {
      const files = await fsPromises.readdir(directoryPath);
      const logFiles = files.filter((file) => file.match(/eqlog_(.*?)_pq\.proj\.txt$/));
      let latestFile = "";
      let latestMtime = new Date(0);
      let characters = store.get("characters", []);

      for (const file of logFiles) {
        const characterName = file.match(/eqlog_(.*?)_pq\.proj\.txt$/)[1];
        if (!characters.includes(characterName)) {
          characters.push(characterName);
        }

        const filePath = path.join(directoryPath, file);
        const stats = await fsPromises.stat(filePath);
        if (stats.mtime > latestMtime) {
          latestMtime = stats.mtime;
          latestFile = file;
          store.set("watchedCharacter", characterName);
        }
      }

      store.set("characters", characters);

      const fullPath = latestFile ? path.join(directoryPath, latestFile).replace(/\\/g, "/") : "";
      if (fullPath && fullPath !== lastFile) {
        if (currentWatcher) {
          unwatchFile(lastFile);
          console.log("Stopped watching file:", lastFile);
        }

        lastSize = (await fsPromises.stat(fullPath)).size;
        lastFile = fullPath;

        console.log("Now watching file:", fullPath);

        currentWatcher = watchFile(fullPath, { interval: 100 }, async (curr) => {
          if (curr.size > lastSize) {
            const fd = await fsPromises.open(fullPath, "r");
            const bufferSize = curr.size - lastSize;
            const buffer = Buffer.alloc(bufferSize);
            await fd.read(buffer, 0, bufferSize, lastSize);
            await fd.close();
            const newContent = buffer.toString("utf8");
            const newLines = newContent.split("\n").filter((line) => line !== "");
            debouncedProcessNewLines(newLines);
            lastSize = curr.size;
          }
        });
      }
    } catch (err) {
      console.error("Error in file watching logic:", err);
    }
  };

  let fileWatchInterval;

  ipcMain.on("start-file-watch", () => {
    const logDirectory = store.get("logDirectory").replace(/\\/g, "/");
    if (fileWatchInterval) clearInterval(fileWatchInterval);
    fileWatchInterval = setInterval(() => startWatching(logDirectory), 2500);
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

  async function processCommonActions(lastLine, settingKey, search, useRegex) {
    try {
      let matchFound = false;
      if (useRegex) {
        const regex = new RegExp(search);
        matchFound = regex.test(lastLine);
      } else {
        matchFound = lastLine.includes(search);
      }

      if (!matchFound) return;

      let settings = null;
      if (settingKey !== null) {
        settings = store.get(settingKey);
      }

      return settings || settingKey === "";
    } catch (error) {
      console.error("Error in processCommonActions:", error);
      return false;
    }
  }

  async function processSpeakAction(lastLine, settingKey, search, sound, useRegex) {
    const actionRequired = await processCommonActions(lastLine, settingKey, search, useRegex);
    if (actionRequired) {
      const userDataPath = app.getPath("userData");
      const soundFilePath = path.join(userDataPath, `./sounds/${sanitizeFilename(sound)}.mp3`);
      const mainWindow = getMainWindow();

      try {
        await fsPromises.access(soundFilePath, fs.constants.F_OK);
      } catch (error) {
        const functions = getFunctions();
        const speech = httpsCallable(functions, "processSpeakAction");

        speech(sound)
          .then((result) => {
            const audioBuffer = Buffer.from(result.data.audioContent, "base64");

            fsPromises.mkdir(path.dirname(soundFilePath), { recursive: true });
            fsPromises.writeFile(soundFilePath, audioBuffer);
            mainWindow && mainWindow.webContents.send("play-sound", soundFilePath);
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }
      mainWindow && mainWindow.webContents.send("play-sound", soundFilePath);
    }
  }

  async function processSoundAction(lastLine, settingKey, search, sound, useRegex) {
    try {
      const actionRequired = await processCommonActions(lastLine, settingKey, search, useRegex);
      if (actionRequired) {
        const userDataPath = app.getPath("userData");
        const soundFilePath = path.join(userDataPath, `./sounds/${sound}.mp3`);
        const mainWindow = getMainWindow();
        mainWindow && mainWindow.webContents.send("play-sound", soundFilePath);
      }
    } catch (error) {
      console.error("Error in processSoundAction:", error);
    }
  }

  async function processTimerAction(lastLine, settingKey, search, useRegex, timer) {
    try {
      const actionRequired = await processCommonActions(lastLine, settingKey, search, useRegex);
      if (actionRequired) {
        const activeTimers = store.get("activeTimers", []);
        const uniqueId = `timer-${Date.now()}`;
        timer.id = uniqueId;
        const newTimer = { ...timer };
        activeTimers.push(newTimer);
        store.set("activeTimers", activeTimers);

        const overlayTimerWindow = getOverlayTimers();
        if (overlayTimerWindow && !overlayTimerWindow.isDestroyed()) {
          overlayTimerWindow.webContents.send("updateActiveTimers");
        }
      }
    } catch (error) {
      console.error("Error in processTimerAction:", error);
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedProcessNewLines = debounce((newLines) => {
    newLines.forEach((line) => {
      if (line !== "") {
        processNewLine(line, lastLineCount + 1);
        lastLineCount++;
      }
    });
  }, 2);

  const actions = [
    { actionType: "speak", key: "rootBroke", search: "Roots spell has worn off", sound: "Root fell off", useRegex: false },
    { actionType: "speak", key: "feignDeath", search: "has fallen to the ground", sound: "Failed feign", useRegex: false },
    { actionType: "speak", key: "resisted", search: "Your target resisted", sound: "Resisted", useRegex: false },
    { actionType: "speak", key: "invisFading", search: "You feel yourself starting to appear", sound: "You're starting to appear", useRegex: false },
    { actionType: "speak", key: "groupInvite", search: "invites you to join a group", sound: "You've been invited to a group", useRegex: false },
    { actionType: "speak", key: "raidInvite", search: "invites you to join a raid", sound: "You've been invited to a raid", useRegex: false },
    { actionType: "speak", key: "mobEnrage", search: "has become ENRAGED", sound: "Mob is enraged", useRegex: false },
    { actionType: "sound", key: "tell", search: "\\[.*?\\] (\\S+) tells you,", sound: "tell", useRegex: true },
  ];

  function removeTimestamps(text) {
    return text
      .split("\n")
      .map((line) => line.replace(/\[\w+ \w+ \d+ \d+:\d+:\d+ \d+\] /, ""))
      .join("\n");
  }

  function processNewLine(line) {
    const lineOnly = removeTimestamps(line);
    if (line) {
      const triggers = store.get("triggers");
      actions.forEach(({ actionType, key, search, sound, useRegex }) => {
        if (actionType === "speak") processSpeakAction(lineOnly, key, search, sound, useRegex, actionType);
        if (actionType === "sound") processSoundAction(lineOnly, key, search, sound, useRegex, actionType);
      });

      if (triggers && triggers.length > 0) {
        triggers.map((trigger, index) => {
          if (trigger.saySomething) processSpeakAction(lineOnly, "", trigger.searchText, trigger.speechText, trigger.searchRegex);
          if (trigger.playSound) {
            const soundFile = typeof triggers[index]?.sound === "string" ? triggers[index].sound.replace(".mp3", "") : undefined;
            processSoundAction(lineOnly, "", trigger.searchText, soundFile, trigger.searchRegex);
          }
          if (trigger.setTimer) processTimerAction(lineOnly, "", trigger.searchText, trigger.searchRegex, trigger);
        });
      }

      if (line.includes("**A Magic Die is rolled by") || line.includes("**It could have been any number from")) parseRolls(line);
      if (line.includes("tells you,")) parseLineForBid(line, true);

      handleAlerts(line);
      handleCommands(line);
      handleTriggers(line);
      handleTracker(line);
    }
  }

  function handleAlerts(line) {
    actions.forEach(({ actionType, key, search, sound, useRegex }) => {
      if (actionType === "speak") processSpeakAction(line, key, search, sound, useRegex, actionType);
      if (actionType === "sound") processSoundAction(line, key, search, sound, useRegex, actionType);
    });
  }

  function handleCommands(line) {
    let logFilePath = `${store.get("logDirectory")}/eqlog_${store.get("watchedCharacter")}_pq.proj.txt`;
    logFilePath = logFilePath.replace(/\\/g, "/");
    const playerName = store.get("watchedCharacter");
    const regex = new RegExp(`\\[(.*?)\\] ${playerName} (\\w+) (.*)|You say to your guild, 'bid (.*)`);
    const match = line.match(regex);

    if (match) {
      const command = match[2] || "bid";
      const argument = match[3] || match[4];

      if (command === "bid") parseLineForBid(argument, false);
      if (command === "report") reportMissingItem(argument);
    }
  }

  function handleTriggers(line) {
    const triggers = store.get("triggers");
    if (triggers && triggers.length > 0) {
      triggers.map((trigger, index) => {
        if (trigger.saySomething) processSpeakAction(line, "", trigger.searchText, trigger.speechText, trigger.searchRegex);
        if (trigger.playSound) {
          const soundFile = typeof triggers[index]?.sound === "string" ? triggers[index].sound.replace(".mp3", "") : undefined;
          processSoundAction(line, "", trigger.searchText, soundFile, trigger.searchRegex);
        }
        if (trigger.setTimer) processTimerAction(line, "", trigger.searchText, trigger.searchRegex, trigger);
      });
    }
  }

  function handleTracker(line) {
    if (getOverlayTracker()) {
      if (line.includes(" is ahead and to the left")) getOverlayTracker().webContents.send("send-tracker-direction", "aheadLeft");
      if (line.includes(" is straight ahead")) getOverlayTracker().webContents.send("send-tracker-direction", "ahead");
      if (line.includes(" is ahead and to the right")) getOverlayTracker().webContents.send("send-tracker-direction", "aheadRight");
      if (line.includes(" is to the right")) getOverlayTracker().webContents.send("send-tracker-direction", "right");
      if (line.includes(" is behind and to the right")) getOverlayTracker().webContents.send("send-tracker-direction", "behindRight");
      if (line.includes(" is behind you")) getOverlayTracker().webContents.send("send-tracker-direction", "behind");
      if (line.includes(" is behind and to the left")) getOverlayTracker().webContents.send("send-tracker-direction", "behindLeft");
      if (line.includes(" is to the left")) getOverlayTracker().webContents.send("send-tracker-direction", "left");
    }
  }

  function reportMissingItem(item) {
    const missingItemsRef = ref(database, "missingItems");
    const newItemRef = push(missingItemsRef);
    set(newItemRef, { itemName: item })
      .then(() => console.log("New missing item reported:", item))
      .catch((error) => console.error("Error reporting missing item:", error));
  }

  async function parseLineForBid(item, isPrivate) {
    if (isPrivate) {
      const dkpRemoved = item.replace(/dkp/gi, "");
      const regex = /\[\w+ \w+ \d+ \d+:\d+:\d+ \d+\] (\w+) tells you, '([^']+?)'/;
      const match = dkpRemoved.match(regex);

      if (match) {
        const name = match[1];
        const messageWithoutDKP = match[2];
        const dkpMatch = messageWithoutDKP.match(/(\d+)/);
        const dkp = dkpMatch ? parseInt(dkpMatch[1], 10) : null;
        const isAlt = /(?:^|\s)alt(?:\s|$)/i.test(match);
        try {
          if (name && item) {
            updateActiveBids(name, checkIfRaidDrop(item), dkp, isAlt);
          }
        } catch (err) {
          console.error("Error in parseLineForBid:", err);
        }
      }
    } else {
      if (checkIfRaidDrop(item)) {
        const logFilePath = store.get("logFile", false);
        const nameMatch = logFilePath.match(/eqlog_(.+?)_pq.proj.txt/);
        const playerName = nameMatch ? nameMatch[1] : "Unknown";

        const timestamp = new Date().toISOString();
        const bidId = uuidv4();
        const currentBid = { item: checkIfRaidDrop(item), timestamp, bidTaker: playerName, id: bidId, bidders: [] };
        const currentBidRef = ref(database, `currentBids/${bidId}`);

        set(currentBidRef, currentBid)
          .then(() => {
            console.log("Bid added successfully");
            clipboard.writeText(`/gu ${item} Bids to me`);
          })
          .catch((error) => console.error("Failed to add bid:", error));
      }
    }
  }

  function checkIfRaidDrop(line) {
    const cleanLine = line.replace(/[\W_]+/g, "").toLowerCase();

    const item = itemsData.find((item) => {
      const cleanItemName = item.ItemName.replace(/[\W_]+/g, "").toLowerCase();
      return cleanLine.includes(cleanItemName);
    });

    return item ? item.ItemName : undefined;
  }

  async function updateActiveBids(newName, newItem, newAmt, newIsAlt) {
    const bidsRef = ref(database, "currentBids");
    try {
      const snapshot = await get(bidsRef);
      if (snapshot.exists()) {
        const bids = snapshot.val();

        let matchingBidKey = null;
        Object.entries(bids).forEach(([key, bid]) => {
          if (bid.item === newItem) {
            matchingBidKey = key;
          }
        });

        if (matchingBidKey) {
          const bidToUpdateRef = ref(database, `currentBids/${matchingBidKey}`);
          let bidders = bids[matchingBidKey].bidders ? [...bids[matchingBidKey].bidders] : [];

          if (newAmt > 0) {
            const index = bidders.findIndex((bidder) => bidder.name === newName);
            if (index !== -1) {
              bidders[index] = { name: newName, amt: newAmt, isAlt: newIsAlt };
            } else {
              bidders.push({ name: newName, amt: newAmt, isAlt: newIsAlt });
            }
          } else {
            bidders = bidders.filter((bidder) => bidder.name !== newName);
          }

          const updates = {};
          updates[`/bidders`] = bidders;

          await update(bidToUpdateRef, updates);
        } else {
          console.log("No matching bid found for item:", newItem);
        }
      } else {
        console.log("No current bids found.");
      }
    } catch (error) {
      console.error("Failed to update active bids:", error);
    }
  }

  ipcMain.handle("update-bid", async (event, bidData) => {
    updateActiveBids(bidData.name, bidData.item, bidData.amt, bidData.isAlt, bidData.id);
  });

  function parseRolls(newLine) {
    lines.push(newLine);
    const index = lines.length - 1;

    if (newLine && typeof newLine === "string") {
      if (newLine.includes("**A Magic Die is rolled by")) {
        currentRoller = newLine.split(" ").pop().slice(0, -2);
      } else if (newLine.includes("**It could have been any number from") && currentRoller) {
        const previousLine = lines[index - 1];
        if (previousLine && previousLine.includes("**A Magic Die is rolled by")) {
          const parts = newLine.match(/(\d+) to (\d+), but this time it turned up a (\d+)/);
          if (parts) {
            const rollMax = parseInt(parts[2], 10);
            const roll = parseInt(parts[3], 10);
            addRoll(rollMax, currentRoller, roll);
            currentRoller = null;
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
      rollEntry = { rollMax, rollers: [] };
      rolls.push(rollEntry);
    }

    const hasRolled = rollEntry.rollers.some((roller) => roller.name === rollerName);

    if (!hasRolled) {
      rollEntry.rollers.push({ name: rollerName, roll });
      store.set("rolls", rolls);
    }
    updateRolls();
  }
}

export { setupIpcHandlers };
