const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel, ...args) => {
      ipcRenderer.send(channel, ...args);
    },
    on: (channel, func) => {
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);

      if (channel === "update-available") {
        ipcRenderer.on("update-available", () => func());
      } else if (channel === "update-not-available") {
        ipcRenderer.on("update-not-available", () => func());
      }
    },
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    removeListener: (channel, func) => {},
  },
  getSoundPath: (soundFileName) => ipcRenderer.invoke("get-sound-path", soundFileName),
  playSound: (soundFilePath) => {
    const audio = new Audio(soundFilePath);
    audio.play().catch((e) => console.error("Error playing sound:", e));
  },
  getlockOverlayBids: () => ipcRenderer.invoke("get-lockOverlayBids"),
  getlockOverlayTimers: () => ipcRenderer.invoke("get-lockOverlayTimers"),
  getlockOverlayTracker: () => ipcRenderer.invoke("get-lockOverlayTracker"),
  getActiveTimers: () => ipcRenderer.invoke("get-activeTimers"),
  startFileWatch: () => ipcRenderer.send("start-file-watch"),
  readItemsData: () => ipcRenderer.invoke("read-itemsData"),
  getTriggers: () => ipcRenderer.invoke("get-triggers"),
});

window.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      ipcRenderer.send("close-itemDetailsWindow");
    }
  });
});
