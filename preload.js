const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel, ...args) => {
      ipcRenderer.send(channel, ...args);
    },
    on: (channel, func) => {
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
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
  getOverlayBidLocked: () => ipcRenderer.invoke("get-overlayBidLocked"),
  startFileWatch: () => {
    ipcRenderer.send("start-file-watch");
  },
});
