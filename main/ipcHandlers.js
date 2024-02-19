import { config } from "dotenv";
config();
import { app, ipcMain } from "electron";
import { getMainWindow, getOverlayBid, getOverlayTimers, getOverlayTracker } from "./windowManager.js";
import Store from "electron-store";
import { getFunctions, httpsCallable } from "firebase/functions";
const store = new Store();
import path from "path";
import fs from "fs";
import { promises as fsPromises, watchFile, readFileSync } from "fs";
import { sanitizeFilename } from "./util.js";

function setupIpcHandlers() {
  let lastSize = 0;
  let lastLineCount = 0;
  let currentRoller = null;
  let lines = [];

  ipcMain.on("start-file-watch", async () => {
    try {
      const filePath = store.get("logFile");
      if (!filePath) return;

      const stats = await fsPromises.stat(filePath);
      lastSize = stats.size;

      watchFile(filePath, { interval: 100 }, async (curr) => {
        if (curr.size > lastSize) {
          const fd = await fsPromises.open(filePath, "r");
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
    } catch (err) {
      console.error("Error in start-file-watch handler:", err);
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

  function processNewLine(line) {
    if (line) {
      const triggers = store.get("triggers");
      actions.forEach(({ actionType, key, search, sound, useRegex }) => {
        if (actionType === "speak") processSpeakAction(line, key, search, sound, useRegex, actionType);
        if (actionType === "sound") processSoundAction(line, key, search, sound, useRegex, actionType);
      });

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

      if (line.includes("**A Magic Die is rolled by") || line.includes("**It could have been any number from")) parseRolls(line);
      if (line.includes("tells you,")) parseLineForBid(line);
      if (line.includes("snared")) {
        store.set("latestLine", line);
        getMainWindow().webContents.send("new-line", line);
      }

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
  }

  async function parseLineForBid(line) {
    const dkpRemoved = line.replace(/dkp/gi, "");
    const regex = /\[\w+ \w+ \d+ \d+:\d+:\d+ \d+\] (\w+) tells you, '([^']+?)'/;
    const match = dkpRemoved.match(regex);

    if (match) {
      const name = match[1];
      const messageWithoutDKP = match[2];
      const dkpMatch = messageWithoutDKP.match(/(\d+)/);
      const dkp = dkpMatch ? parseInt(dkpMatch[1], 10) : null;
      const isAlt = /(?:^|\s)alt(?:\s|$)/i.test(match);
      try {
        const item = await checkIfRaidDrop(dkpRemoved);
        if (name && item && dkp) {
          updateActiveBids({ name, item, dkp, isAlt });
        }
      } catch (err) {
        console.error("Error in parseLineForBid:", err);
      }
    } else {
    }
  }

  function checkIfRaidDrop(line) {
    const itemsData = JSON.parse(readFileSync("itemsData.json", "utf8"));
    const cleanLine = line.replace(/[\W_]+/g, "").toLowerCase();

    const item = itemsData.find((item) => {
      const cleanItemName = item.ItemName.replace(/[\W_]+/g, "").toLowerCase();
      return cleanLine.includes(cleanItemName);
    });

    return item ? item.ItemName : undefined;
  }

  function updateActiveBids({ name, item, dkp, isAlt }) {
    const activeBids = store.get("activeBids", []);
    let updated = false; // Flag to track if update is made

    const newActiveBids = activeBids.map((bid) => {
      if (bid.item === item) {
        const bidders = bid.bidders.map((bidder) => {
          if (bidder.name === name) {
            updated = true; // Mark as updated
            return { ...bidder, dkp, isAlt }; // Return updated bidder
          }
          return bidder; // Return unchanged bidder
        });

        if (!bidders.some((bidder) => bidder.name === name)) {
          updated = true; // Mark as updated
          bidders.push({ name, dkp, isAlt }); // Add new bidder
        }

        return { ...bid, bidders }; // Return updated bid
      }
      return bid; // Return unchanged bid
    });

    if (!updated) {
      newActiveBids.push({ item, bidders: [{ name, dkp, isAlt }] }); // Add new item bid
    }

    store.set("activeBids", newActiveBids); // Set with new reference
    const mainWindow = getMainWindow();
    const overlayBidWindow = getOverlayBid();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("activeBids-updated", newActiveBids);
    }
    if (overlayBidWindow && !overlayBidWindow.isDestroyed()) {
      overlayBidWindow.webContents.send("activeBids-updated", newActiveBids);
    }
  }

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
