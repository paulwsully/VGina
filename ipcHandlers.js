import { app, ipcMain, dialog, screen } from "electron";
import { getMainWindow, getOverlayBid, getOverlayItemDetails } from "./windowManager.js";
import { createOverlayBids, createItemDetailsWindow } from "./window.js";
import database from "./firebaseConfig.js";
import { ref, push, getDatabase } from "firebase/database";
import Store from "electron-store";
const store = new Store();
import textToSpeech from "@google-cloud/text-to-speech";
import readLastLines from "read-last-lines";
import path from "path";
import fs from "fs";
import { promises as fsPromises, readFileSync } from "fs";
const { writeFile, mkdir, readdir, access: exists } = fsPromises;
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NUM_LINES_TO_READ = 5;
const tts = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, "./vgina-412004-91343028ed0c.json"),
});

let fileWatcher = null;
let lastFiveLines = [];

function setupIpcHandlers() {
  ipcMain.on("minimize-app", () => getMainWindow().minimize());
  ipcMain.on("close-app", () => getMainWindow().close());
  ipcMain.on("file-name", (event, fileName) => event.sender.send("file-name", fileName));
  ipcMain.on("storeSet", (event, key, value) => store.set({ [key]: value }));
  ipcMain.on("set-last-tab", (event, tabPath) => store.set("lastActiveTab", tabPath));
  ipcMain.handle("storeGet", (event, key) => store.get(key));
  ipcMain.handle("get-last-tab", async () => store.get("lastActiveTab"));
  ipcMain.handle("get-rolls", async (event) => store.get("rolls", []));

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

      itemDetailsWindow.setSize(roundedWidth + 2, roundedHeight + 2);
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

  async function processAction(lastLine, settingKey = null, search, sound, useRegex, actionType) {
    let matchFound = false;
    if (useRegex) {
      const regex = new RegExp(search);
      matchFound = regex.test(lastLine);
    } else {
      matchFound = lastLine.includes(search);
    }

    if (matchFound) {
      try {
        let settings = null;
        if (settingKey !== null) {
          settings = store.get(settingKey);
        }

        if (settings || settingKey === "") {
          const userDataPath = app.getPath("userData");
          let soundFilePath;
          if (actionType === "speak") soundFilePath = path.join(userDataPath, `./sounds/${sanitizeFilename(sound)}.mp3`);
          if (actionType === "sound") soundFilePath = path.join(userDataPath, `./sounds/${sound}.mp3`);

          try {
            await exists(soundFilePath, fs.constants.F_OK);
          } catch (error) {
            if (actionType === "speak") {
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
          }

          const mainWindow = getMainWindow();
          mainWindow && mainWindow.webContents.send("play-sound", soundFilePath);
        }
      } catch (err) {
        console.error("Error:", err);
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

  function processNewLine(line) {
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

    actions.forEach(({ actionType, key, search, sound, useRegex }) => {
      processAction(line, key, search, sound, useRegex, actionType);
    });

    triggers.map((trigger, index) => {
      if (trigger.saySomething) processAction(line, "", trigger.searchText, trigger.speechText, trigger.searchRegex, "speak");
      if (trigger.playSound) processAction(line, "", trigger.searchText, triggers[index].sound.replace(".mp3", ""), trigger.searchRegex, "sound");
    });

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
