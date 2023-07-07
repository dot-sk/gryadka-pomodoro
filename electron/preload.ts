const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('ipcWorld', {
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },
  on: (channel: string, listener: any) => {
    ipcRenderer.on(channel, listener)
  }
});
