const { contextBridge, ipcRenderer } = require("electron");
const validChannels = ["minimize-app", "maximize-app", "close-app", "open-file-dialog", "storeSet", "file-name"];

contextBridge.exposeInMainWorld("electron", {
  sendMessage: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receiveMessage: (channel, func) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  invoke: (channel, ...args) => {
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
  storeSet: (key, value) => {
    ipcRenderer.send("storeSet", key, value);
  },
  removeMessage: (channel, func) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    }
  },
  storeGet: (key) => {
    return ipcRenderer.invoke("storeGet", key);
  },
  getLastTab: () => ipcRenderer.invoke("get-last-tab"),
  setLastTab: (tabPath) => ipcRenderer.send("set-last-tab", tabPath),
});
