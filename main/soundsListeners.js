import { config } from "dotenv";
config();
import { app, ipcMain } from "electron";
import { getMainWindow } from "./windowManager.js";
import { promises as fsPromises } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import textToSpeech from "@google-cloud/text-to-speech";
import { sanitizeFilename } from "./util.js";
const { writeFile, access: exists } = fsPromises;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tts = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, "./vgina-412004-91343028ed0c.json"),
});

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

  ipcMain.on("play-sound", (event, fileName) => {
    const userDataPath = app.getPath("userData");
    const fullPath = path.join(userDataPath, `sounds/${fileName}`);
    const mainWindow = getMainWindow();
    mainWindow && mainWindow.webContents.send("play-sound", fullPath);
  });

  ipcMain.on("speak", (event, speech) => {
    speak(speech);
  });

  async function speak(speech) {
    const userDataPath = app.getPath("userData");
    const soundFilePath = path.join(userDataPath, `./sounds/${sanitizeFilename(speech)}.mp3`);

    try {
      await exists(soundFilePath, fs.constants.F_OK);
    } catch (error) {
      const request = {
        input: { text: speech },
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
};
