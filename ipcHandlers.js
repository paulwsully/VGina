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
    const result = await dialog.showOpenDialog(getMainWindow(), { properties: ["openFile"] });
    return result;
  });

  ipcMain.on("file-name", (event, fileName) => {
    event.sender.send("file-name", fileName);
  });

  ipcMain.on("storeSet", (event, key, value) => {
    store.set(key, value);
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
    const filePath = store.get("logFile");
    if (filePath) {
      lastFiveLines = (await readLastLines.read(filePath, NUM_LINES_TO_READ)).split("\n").slice(0, -1);

      fileWatcher = fs.watch(filePath, async (eventType, filename) => {
        if (filename) {
          await updateFileWatch(filePath);
        }
      });
    }
  });

  ipcMain.on("stop-file-watch", () => {
    if (fileWatcher) {
      fileWatcher.close();
      fileWatcher = null;
    }
  });

  function processNewLine(line) {
    if (line.includes("snared")) {
      console.log("Mob snared");
      store.set("latestLine", line);
      getMainWindow().webContents.send("new-line", line);
    }
  }
}

module.exports = { setupIpcHandlers };
