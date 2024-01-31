const { app, ipcMain, dialog } = require("electron");
const { getMainWindow, getBidOverlay } = require("./windowManager");
const Store = require("electron-store");
const textToSpeech = require("@google-cloud/text-to-speech");
const store = new Store();
const readLastLines = require("read-last-lines");
const fs = require("fs");
const util = require("util");
const writeFile = util.promisify(fs.writeFile);
const readdir = util.promisify(fs.readdir);
const exists = util.promisify(fs.exists);
const path = require("path");

const tts = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, "./vgina-412004-91343028ed0c.json"),
});

function setupIpcHandlers() {
  ipcMain.on("minimize-app", () => getMainWindow().minimize());
  ipcMain.on("close-app", () => getMainWindow().close());
  ipcMain.on("file-name", (event, fileName) => event.sender.send("file-name", fileName));
  ipcMain.on("storeSet", (event, key, value) => store.set({ [key]: value }));
  ipcMain.handle("storeGet", (event, key) => store.get(key));
  ipcMain.on("set-last-tab", (event, tabPath) => store.set("lastActiveTab", tabPath));
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

  ipcMain.handle("close-roll", async (event, rollMax) => {
    const rolls = store.get("rolls", []);
    const updatedRolls = rolls.filter((roll) => roll.rollMax !== rollMax);
    store.set("rolls", updatedRolls);

    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("rolls-updated");
    }
  });

  ipcMain.on("get-sound-files", async (event) => {
    try {
      const soundsPath = path.join(__dirname, "./sounds");
      const files = await readdir(soundsPath);
      const mp3Files = files.filter((file) => file.endsWith(".mp3"));
      event.reply("sound-files", mp3Files);
    } catch (err) {
      console.error("Error fetching sound files:", err);
      event.reply("sound-files", []);
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

          if (actionType === "speak") {
            const sanitizedSoundName = sanitizeFilename(sound);
            soundFilePath = path.join(userDataPath, `sounds/${sanitizedSoundName}.mp3`);
          } else {
            soundFilePath = path.join(userDataPath, `sounds/${sanitizeFilename(sound)}.mp3`);
          }

          if (actionType === "speak" && !(await exists(soundFilePath))) {
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

            if (!(await exists(path.dirname(soundFilePath)))) {
              fs.mkdirSync(path.dirname(soundFilePath), { recursive: true });
            }

            await writeFile(soundFilePath, response.audioContent, "binary");
          }

          const mainWindow = getMainWindow();
          mainWindow && mainWindow.webContents.send("play-sound", soundFilePath);
        }
      } catch (err) {
        console.error("Error:", err);
      }
    }
  }

  function processNewLine(line) {
    const actions = [
      { actionType: "speak", key: "mobUnrooted", search: "Roots spell has worn off", sound: "Root fell off", useRegex: false },
      { actionType: "speak", key: "failedFeign", search: "has fallen to the ground", sound: "Failed feign", useRegex: false },
      { actionType: "speak", key: "mobResisted", search: "Your target resisted", sound: "Resisted", useRegex: false },
      { actionType: "speak", key: "invisibilityFading", search: "You feel yourself starting to appear", sound: "You're starting to appear", useRegex: false },
      { actionType: "speak", key: "groupInvite", search: "invites you to join a group", sound: "You've been invited to a group", useRegex: false },
      { actionType: "speak", key: "raidInvite", search: "invites you to join a raid", sound: "You've been invited to a raid", useRegex: false },
      { actionType: "speak", key: "mobEnrage", search: "has become ENRAGED", sound: "Mob is enraged", useRegex: false },
      { actionType: "sound", key: "tells", search: "\\[.*?\\] (\\S+) tells you,", sound: "tell", useRegex: true },
    ];

    actions.forEach(({ actionType, key, search, sound, useRegex }) => {
      processAction(line, key, search, sound, useRegex, actionType);
    });

    if (line.includes("**A Magic Die is rolled by") || line.includes("**It could have been any number from")) parseRolls(line);
    if (line.includes("tells you,")) parseLineForBid(line);
    if (line.includes("snared")) {
      store.set("latestLine", line);
      getMainWindow().webContents.send("new-line", line);
    }
  }

  function checkIfRaidDrop(item) {
    const filePath = path.join(__dirname, "./itemsList.txt");
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          console.error("Error reading the file:", err);
          reject(err);
        } else {
          resolve(data.includes(item));
        }
      });
    });
  }

  async function parseLineForBid(line) {
    const regex = /\[\w+ \w+ \d+ \d+:\d+:\d+ \d+\] (\w+) tells you, '([^']+?) (\d+)'/;
    const match = line.match(regex);

    if (match) {
      const name = match[1];
      const item = match[2];
      const dkp = parseInt(match[3], 10);

      try {
        const isRaidDrop = await checkIfRaidDrop(item);
        if (name && item && !isNaN(dkp) && isRaidDrop) {
          console.log({ name, item, dkp });
          updateActiveBids({ name, item, dkp });
        }
      } catch (err) {
        console.error("Error in parseLineForBid:", err);
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

  function generateUniqueId() {
    return Date.now();
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

module.exports = { setupIpcHandlers };
