import { config } from "dotenv";
config();
import { ipcMain, dialog } from "electron";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ginaListeners = () => {
  ipcMain.handle("gina-open-file-dialog", async () => {
    const { filePaths } = await dialog.showOpenDialog({ properties: ["openFile"] });
    if (filePaths && filePaths.length > 0) {
      try {
        const content = await fs.readFile(filePaths[0], "utf8");
        return content;
      } catch (error) {
        console.error("Error reading file:", error);
        throw error;
      }
    }
  });

  ipcMain.on("save-data", (event, data) => {
    const defaultPath = path.join(__dirname, "exportedData.json");
    dialog
      .showSaveDialog({
        title: "Save Data",
        defaultPath,
        filters: [{ name: "JSON Files", extensions: ["json"] }],
      })
      .then((saveResult) => {
        if (!saveResult.canceled && saveResult.filePath) {
          fs.writeFile(saveResult.filePath, JSON.stringify(data, null, 2), "utf-8", (err) => {
            if (err) {
              console.error("Failed to save file", err);
            } else {
            }
          });
        }
      })
      .catch((err) => {
        console.error("Failed to show save dialog", err);
      });
  });
};
