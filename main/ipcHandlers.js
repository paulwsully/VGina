import { config } from "dotenv";
config();
import { app, ipcMain } from "electron";
import { getMainWindow, getOverlayTimers } from "./windowManager.js";
import Store from "electron-store";
import textToSpeech from "@google-cloud/text-to-speech";
const store = new Store();
import path from "path";
import fs from "fs";
import { promises as fsPromises, watchFile } from "fs";
const { writeFile, access: exists } = fsPromises;
import { fileURLToPath } from "url";
import { sanitizeFilename } from "./util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tts = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, "./../vgina-412004-91343028ed0c.json"),
});

function setupIpcHandlers() {
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
        const newTimer = {
          id: uniqueId,
          ...timer,
        };
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

  let lastSize = 0;
  let lastLineCount = 0;

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
          if (trigger.playSound) processSoundAction(line, "", trigger.searchText, triggers[index].sound.replace(".mp3", ""), trigger.searchRegex);
          if (trigger.setTimer) processTimerAction(line, "", trigger.searchText, trigger.searchRegex, trigger);
        });
      }

      if (line.includes("**A Magic Die is rolled by") || line.includes("**It could have been any number from")) parseRolls(line);
      if (line.includes("tells you,")) parseLineForBid(line);
      if (line.includes("snared")) {
        store.set("latestLine", line);
        getMainWindow().webContents.send("new-line", line);
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
      // console.log(dkpMatch);
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
    const itemsData = JSON.parse(fs.readFileSync("./itemsData.json", "utf8"));
    const item = itemsData.find((item) => line.includes(item.ItemName));
    return item ? item.ItemName : undefined;
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
}

export { setupIpcHandlers };
