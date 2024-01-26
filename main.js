const { setupIpcHandlers } = require("./ipcHandlers");
const { setupAppLifecycle } = require("./appLifecycle");

setupIpcHandlers();
setupAppLifecycle();
