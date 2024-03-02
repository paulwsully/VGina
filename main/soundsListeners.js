import { config } from "dotenv";
config();
import { app, ipcMain } from "electron";
import { getMainWindow } from "./windowManager.js";
import { promises as fsPromises } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { getFunctions, httpsCallable } from "firebase/functions";
import { sanitizeFilename } from "./util.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getSoundsListeners = () => {
  ipcMain.handle("get-sound-path", async (event, soundFileName) => {
    try {
      let soundFilePath;
      if (app.isPackaged) {
        const userDataPath = app.getPath("userData");
        soundFilePath = path.join(userDataPath, "sounds", soundFileName);
      } else {
        soundFilePath = path.join(__dirname, "../sounds", soundFileName);
      }

      const normalizedSoundFilePath = path.normalize(soundFilePath);
      const soundFileUrl = new URL(`file://${normalizedSoundFilePath}`).toString();

      return soundFileUrl;
    } catch (error) {
      console.error("Error in get-sound-path:", error);
      return "Error retrieving sound file path";
    }
  });

  ipcMain.on("get-sound-files", async (event) => {
    try {
      const soundsPath = path.join(app.getPath("userData"), "sounds");
      const files = await fsPromises.readdir(soundsPath);
      const mp3Files = files.filter((file) => file.endsWith(".mp3"));
      event.reply("sound-files", mp3Files);
    } catch (err) {
      console.error("Error fetching sound files:", err);
      event.reply("sound-files", []);
    }
  });

  ipcMain.on("play-sound", (event, fileName) => {
    const userDataPath = app.getPath("userData");
    const fullPath = path.join(userDataPath, `sounds/${fileName}`);
    const mainWindow = getMainWindow();
    mainWindow && mainWindow.webContents.send("play-sound", fullPath);
  });

  ipcMain.on("speak", (event, speech) => {
    speak(speech);
  });

  async function speak(sound) {
    const userDataPath = app.getPath("userData");
    const soundFilePath = path.join(userDataPath, `./sounds/${sanitizeFilename(sound)}.mp3`);
    const mainWindow = getMainWindow();

    try {
      await fsPromises.access(soundFilePath, fs.constants.F_OK);
    } catch (error) {
      const functions = getFunctions();
      const speech = httpsCallable(functions, "processSpeakAction");
      speech(sound)
        .then((result) => {
          const audioBuffer = Buffer.from(result.data.audioContent, "base64");

          fsPromises.mkdir(path.dirname(soundFilePath), { recursive: true });
          fsPromises.writeFile(soundFilePath, audioBuffer);
          mainWindow && mainWindow.webContents.send("play-sound", soundFilePath);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
    mainWindow && mainWindow.webContents.send("play-sound", soundFilePath);
  }
};
