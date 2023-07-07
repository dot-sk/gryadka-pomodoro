import { IPC_WORLD } from "./constants";
import { IpcWorld } from "./typings";

// use fake ipc for testing
const mockIpc = { send: () => null, on: () => null };

// шина событий, которая определяется в IpcRenderer
export const ipcWorld: IpcWorld = (window as any)[IPC_WORLD] ?? mockIpc;
