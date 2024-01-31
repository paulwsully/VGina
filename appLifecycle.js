const { app, globalShortcut } = require("electron");
const clipboard = require("electron").clipboard;
const { createWindow } = require("./window");
const ks = require("node-key-sender");
const fs = require("fs");
const util = require("util");
const readdir = util.promisify(fs.readdir);
const copyFile = util.promisify(fs.copyFile);
const path = require("path");

function setupAppLifecycle() {
  async function copyPackagedSoundsToUserData() {
    const sourceDir = path.join(__dirname, "sounds");
    const targetDir = path.join(app.getPath("userData"), "sounds");

    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const files = await readdir(sourceDir);

      for (const file of files) {
        const sourceFile = path.join(sourceDir, file);
        const targetFile = path.join(targetDir, file);
        await copyFile(sourceFile, targetFile);
      }
    } catch (err) {
      console.error("Error copying sound files:", err);
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  app.whenReady().then(() => {
    copyPackagedSoundsToUserData();
    createWindow();
    globalShortcut.register("CommandOrControl+Alt+Z", async () => {
      await sleep(500);
      const text = clipboard.readText();
      await ks.sendText(text);
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

module.exports = { setupAppLifecycle };
