const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('ipcWorld', {
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },
  on: (channel: string, listener: any) => {
    ipcRenderer.on(channel, listener)
  }
});

contextBridge.exposeInMainWorld('electronStore', {
  get: (key: string) => ipcRenderer.invoke('store:get', key),
  set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
});
