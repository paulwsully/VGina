const { app } = require("electron");
const { createWindow } = require("./window");

function setupAppLifecycle() {
  app.whenReady().then(createWindow);

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

module.exports = { setupAppLifecycle };
