import { config } from "dotenv";
config();
import { app, ipcMain, dialog } from "electron";
import { getMainWindow, getOverlayBid, getOverlayItemDetails, getOverlayTimers } from "./windowManager.js";
import { createOverlayBids, createItemDetailsWindow, createOverlayTimers } from "./window.js";
import { createHash } from "crypto";
import database from "./firebaseConfig.js";
import { ref, push, getDatabase } from "firebase/database";
import Store from "electron-store";
import textToSpeech from "@google-cloud/text-to-speech";
const store = new Store();
import path from "path";
import fs from "fs";
import { promises as fsPromises, watchFile, createReadStream } from "fs";
const { writeFile, readdir, access: exists } = fsPromises;
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NUM_LINES_TO_READ = 3;
const tts = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, "./vgina-412004-91343028ed0c.json"),
});

let fileWatcher = null;

function setupIpcHandlers() {
  ipcMain.on("minimize-app", () => getMainWindow().minimize());
  ipcMain.on("close-app", () => getMainWindow().close());
  ipcMain.on("file-name", (event, fileName) => event.sender.send("file-name", fileName));
  ipcMain.on("storeSet", (event, key, value) => store.set({ [key]: value }));
  ipcMain.on("set-last-tab", (event, tabPath) => store.set("lastActiveTab", tabPath));
  ipcMain.handle("storeGet", (event, key) => store.get(key));
  ipcMain.handle("get-last-tab", async () => store.get("lastActiveTab"));
  ipcMain.handle("get-rolls", async (event) => store.get("rolls", []));

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

  ipcMain.handle("get-sound-path", async (event, soundFileName) => {
    let soundFilePath;

    if (app.isPackaged) {
      const userDataPath = app.getPath("userData");
      soundFilePath = path.join(userDataPath, "sounds", soundFileName);
    } else {
      soundFilePath = path.join(__dirname, "sounds", soundFileName);
    }
    const normalizedSoundFilePath = path.normalize(soundFilePath);
    const soundFileUrl = new URL(`file://${normalizedSoundFilePath}`).toString();

    return soundFileUrl;
  });

  ipcMain.on("get-sound-files", async (event) => {
    try {
      const soundsPath = path.join(app.getPath("userData"), "sounds");
      const files = await readdir(soundsPath);
      const mp3Files = files.filter((file) => file.endsWith(".mp3"));
      event.reply("sound-files", mp3Files);
    } catch (err) {
      console.error("Error fetching sound files:", err);
      event.reply("sound-files", []);
    }
  });

  ipcMain.on("enable-click-through", () => {
    const overlayBidWindow = getOverlayBid();
    if (overlayBidWindow && !overlayBidWindow.isDestroyed()) {
      overlayBidWindow.setIgnoreMouseEvents(true, { forward: true });
      overlayBidWindow.webContents.executeJavaScript(`document.body.classList.add("no-drag")`, true);
    }
  });

  ipcMain.on("disable-click-through", () => {
    const overlayBidWindow = getOverlayBid();
    if (overlayBidWindow && !overlayBidWindow.isDestroyed()) {
      overlayBidWindow.setIgnoreMouseEvents(false);
      overlayBidWindow.webContents.executeJavaScript(`document.body.classList.remove("no-drag")`, true);
    }
  });

  ipcMain.on("enable-only-click-through", () => {
    const overlayBidWindow = getOverlayBid();
    if (overlayBidWindow && !overlayBidWindow.isDestroyed()) overlayBidWindow.setIgnoreMouseEvents(true, { forward: true });
  });

  ipcMain.on("disable-only-click-through", () => {
    const overlayBidWindow = getOverlayBid();
    if (overlayBidWindow && !overlayBidWindow.isDestroyed()) overlayBidWindow.setIgnoreMouseEvents(false);
  });

  ipcMain.handle("get-overlayBidLocked", async () => {
    return store.get("overlayBidLocked", false);
  });

  ipcMain.on("close-overlay-window", () => {
    const overlayBid = getOverlayBid();
    if (overlayBid && !overlayBid.isDestroyed()) {
      overlayBid.close();
    }
  });

  ipcMain.on("open-overlay-window", (event) => {
    createOverlayBids()
      .then((overlayBid) => {
        const locked = store.get("overlayBidLocked", false);
        const overlayBidWindow = getOverlayBid();
        overlayBidWindow.show();
        overlayBidWindow.setIgnoreMouseEvents(locked, { forward: true });
      })
      .catch((error) => {
        console.error("An error occurred while creating the overlay bids window:", error);
      });
  });

  ipcMain.handle("get-overlayTimersLocked", async () => {
    return store.get("overlayTimersLocked", false);
  });

  ipcMain.handle("get-activeTimers", async () => {
    return store.get("activeTimers", false);
  });

  ipcMain.on("remove-activeTimer", (event, timerId) => {
    const activeTimers = store.get("activeTimers", []);
    const updatedTimers = activeTimers.filter((timer) => timer.id !== timerId);
    store.set("activeTimers", updatedTimers);
  });

  ipcMain.on("open-overlay-timers", (event) => {
    createOverlayTimers()
      .then((overlayTimer) => {
        const locked = store.get("overlayTimersLocked", false);
        const overlayTimerWindow = getOverlayTimers();
        overlayTimerWindow.show();
        overlayTimerWindow.setIgnoreMouseEvents(locked, { forward: true });
      })
      .catch((error) => {
        console.error("An error occurred while creating the overlay timers window:", error);
      });
  });

  ipcMain.on("close-overlay-timers", () => {
    const overlayTimerWindow = getOverlayTimers();
    if (overlayTimerWindow) {
      overlayTimerWindow.hide();
    }
  });

  ipcMain.on("timersOverlay-resize", (event, { width, height }) => {
    const overlayTimerWindow = getOverlayTimers();
    if (overlayTimerWindow && !overlayTimerWindow.isDestroyed()) {
      const roundedWidth = Math.round(width);
      const roundedHeight = Math.round(height);

      overlayTimerWindow.setSize(roundedWidth + 4, roundedHeight + 4);
    }
  });

  ipcMain.on("lock-overlay-timers", () => {
    const overlayTimersWindow = getOverlayTimers();
    if (overlayTimersWindow && !overlayTimersWindow.isDestroyed()) {
      overlayTimersWindow.setIgnoreMouseEvents(true, { forward: true });
      overlayTimersWindow.webContents.executeJavaScript(`document.body.classList.add("no-drag")`, true);
    }
  });

  ipcMain.on("unlock-overlay-timers", () => {
    const overlayTimersWindow = getOverlayTimers();
    if (overlayTimersWindow && !overlayTimersWindow.isDestroyed()) {
      overlayTimersWindow.setIgnoreMouseEvents(false);
      overlayTimersWindow.webContents.executeJavaScript(`document.body.classList.remove("no-drag")`, true);
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
    const logFilePath = store.get("logFile", false);
    const nameMatch = logFilePath.match(/eqlog_(.+?)_pq.proj.txt/);
    const playerName = nameMatch ? nameMatch[1] : "Unknown";

    const timestamp = new Date().toISOString();
    const closedBid = { item: itemName, bidders, timestamp, bidTaker: playerName };
    const db = getDatabase();
    const closedBidsRef = ref(database, "closedBids");
    push(closedBidsRef, closedBid);

    const activeBids = store.get("activeBids", []).filter((bid) => bid.item !== itemName);
    store.set("activeBids", activeBids);

    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("bids-updated");
    }

    const locked = store.get("overlayBidLocked", false);

    const overlayBidWindow = getOverlayBid();
    if (overlayBidWindow && !overlayBidWindow.isDestroyed()) {
      overlayBidWindow.setIgnoreMouseEvents(locked);
      if (locked) overlayBidWindow.webContents.executeJavaScript(`document.body.classList.add("no-drag")`, true);
    }

    return true;
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

  ipcMain.handle("read-itemsData", async (event) => {
    const jsonPath = path.join(__dirname, "itemsData.json"); // Adjust the path as necessary
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

  store.onDidChange("activeBids", (newValue, oldValue) => {
    const mainWindow = getMainWindow();
    const overlayBid = getOverlayBid();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("bids-updated");
    }

    if (overlayBid && !overlayBid.isDestroyed()) {
      overlayBid.webContents.send("bids-updated");
    }

    mainWindow.webContents.send("overlayBidLocked-updated", newValue);
  });

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
      console.log("No match found for line:", line);
    }
  }

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
    let matchFound = false;
    if (useRegex) {
      const regex = new RegExp(search);
      matchFound = regex.test(lastLine);
    } else {
      matchFound = lastLine.includes(search);
    }

    if (!matchFound) return;

    if (matchFound) {
      let settings = null;
      if (settingKey !== null) {
        settings = store.get(settingKey);
      }

      return settings || settingKey === "";
    }

    return false;
  }

  async function processSpeakAction(lastLine, settingKey, search, sound, useRegex) {
    const actionRequired = await processCommonActions(lastLine, settingKey, search, useRegex);
    if (actionRequired) {
      const userDataPath = app.getPath("userData");
      const soundFilePath = path.join(userDataPath, `./sounds/${sanitizeFilename(sound)}.mp3`);

      try {
        await exists(soundFilePath, fs.constants.F_OK);
      } catch (error) {
        const request = {
          input: { text: sound },
          voice: {
            languageCode: "en-US",
            name: "en-US-Studio-O",
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1,
            effectsProfileId: ["large-home-entertainment-class-device"],
          },
        };

        const [response] = await tts.synthesizeSpeech(request);
        await fsPromises.mkdir(path.dirname(soundFilePath), { recursive: true });
        await writeFile(soundFilePath, response.audioContent, "binary");
      }

      const mainWindow = getMainWindow();
      mainWindow && mainWindow.webContents.send("play-sound", soundFilePath);
    }
  }

  async function processSoundAction(lastLine, settingKey, search, sound, useRegex) {
    const actionRequired = await processCommonActions(lastLine, settingKey, search, useRegex);
    if (actionRequired) {
      const userDataPath = app.getPath("userData");
      const soundFilePath = path.join(userDataPath, `./sounds/${sound}.mp3`);
      const mainWindow = getMainWindow();
      mainWindow && mainWindow.webContents.send("play-sound", soundFilePath);
    }
  }

  async function processTimerAction(lastLine, settingKey, search, useRegex, triggerName, timerHours, timerMinutes, timerSeconds) {
    const actionRequired = await processCommonActions(lastLine, settingKey, search, useRegex);
    if (actionRequired) {
      const activeTimers = store.get("activeTimers", []);
      const uniqueId = `timer-${Date.now()}`;
      const newTimer = {
        id: uniqueId,
        triggerName,
        timerHours,
        timerMinutes,
        timerSeconds,
      };
      activeTimers.push(newTimer);
      store.set("activeTimers", activeTimers);

      const overlayTimerWindow = getOverlayTimers();
      if (overlayTimerWindow && !overlayTimerWindow.isDestroyed()) {
        overlayTimerWindow.webContents.send("updateActiveTimers");
      }
    }
  }

  let lastSize = 0; // Variable to store the last known size of the file
  let lastFiveHashes = []; // Initialize a fixed-size queue for the last five line hashes
  let debounceTimer;

  const debounce = (func, delay) => {
    return (...args) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  let lastLineCount = 0;

  ipcMain.on("start-file-watch", async () => {
    try {
      const filePath = store.get("logFile");
      if (!filePath) return;

      const initialContent = await fsPromises.readFile(filePath, "utf8");
      lastLineCount = (initialContent.match(/\n/g) || []).length;

      watchFile(filePath, { interval: 100 }, async (curr, prev) => {
        if (curr.mtimeMs > prev.mtimeMs) {
          const currentContent = await fsPromises.readFile(filePath, "utf8");
          const currentLines = currentContent.split("\n");
          const newLineCount = currentLines[currentLines.length - 1] === "" ? currentLines.length - 1 : currentLines.length;

          if (newLineCount > lastLineCount) {
            for (let i = lastLineCount; i < newLineCount; i++) {
              processNewLine(currentLines[i], i + 1);
            }
            lastLineCount = newLineCount;
          }
        }
      });
    } catch (err) {
      console.error("Error in start-file-watch handler:", err);
    }
  });

  const triggers = store.get("triggers");
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
    actions.forEach(({ actionType, key, search, sound, useRegex }) => {
      if (actionType === "speak") processSpeakAction(line, key, search, sound, useRegex, actionType);
      if (actionType === "sound") processSoundAction(line, key, search, sound, useRegex, actionType);
    });

    if (triggers && triggers.length > 0) {
      triggers.map((trigger, index) => {
        if (trigger.saySomething) processSpeakAction(line, "", trigger.searchText, trigger.speechText, trigger.searchRegex);
        if (trigger.playSound) processSoundAction(line, "", trigger.searchText, triggers[index].sound.replace(".mp3", ""), trigger.searchRegex);
        if (trigger.setTimer) processTimerAction(line, "", trigger.searchText, trigger.searchRegex, trigger.triggerName, trigger.timerHours, trigger.timerMinutes, trigger.timerSeconds);
      });
    }

    if (line.includes("**A Magic Die is rolled by") || line.includes("**It could have been any number from")) parseRolls(line);
    if (line.includes("tells you,")) parseLineForBid(line);
    if (line.includes("snared")) {
      store.set("latestLine", line);
      getMainWindow().webContents.send("new-line", line);
    }
  }

  function checkIfRaidDrop(line) {
    const filePath = path.join(__dirname, "./itemsList.txt");
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          console.error("Error reading the file:", err);
          reject(err);
        } else {
          const items = data.split("\n").map((item) => item.trim());
          const foundItem = items.find((item) => line.includes(item));
          resolve(foundItem);
        }
      });
    });
  }

  function updateActiveBids({ name, item, dkp, isAlt }) {
    let activeBids = store.get("activeBids", []);

    const itemIndex = activeBids.findIndex((bid) => bid.item === item);

    if (itemIndex !== -1) {
      const bidderIndex = activeBids[itemIndex].bidders.findIndex((bidder) => bidder.name === name);
      if (bidderIndex !== -1) {
        activeBids[itemIndex].bidders[bidderIndex].dkp = dkp;
        activeBids[itemIndex].bidders[bidderIndex].isAlt = isAlt;
      } else {
        activeBids[itemIndex].bidders.push({ name, dkp, isAlt });
      }
    } else {
      activeBids.push({
        item: item,
        bidders: [{ name, dkp, isAlt }],
      });
    }

    store.set("activeBids", activeBids);
  }

  let currentRoller = null;
  let lines = [];
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

  function sanitizeFilename(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "");
  }
}

export { setupIpcHandlers };
