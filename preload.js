const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel, key, value) => {
      ipcRenderer.send(channel, key, value);
    },
    on: (channel, func) => {
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    },
    receive: (channel, func) => {
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    },
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  },
  playSound: (soundFile) => {
    const audio = new Audio(soundFile);
    audio.play().catch((e) => console.error("Error playing sound:", e));
  },
});
