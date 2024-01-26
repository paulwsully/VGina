const { ipcMain, dialog } = require("electron");
const Store = require("electron-store");
const { getMainWindow } = require("./windowManager");
const store = new Store();

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
}

module.exports = { setupIpcHandlers };
