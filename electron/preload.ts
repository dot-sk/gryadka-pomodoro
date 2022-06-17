const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ipc", {
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },
});
