// Importing your own modules with named imports
import { setupIpcHandlers } from "./ipcHandlers.js"; // Adjust the path and extension as necessary
import { setupAppLifecycle } from "./appLifecycle.js"; // Adjust the path and extension as necessary

setupIpcHandlers();
setupAppLifecycle();
