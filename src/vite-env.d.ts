/// <reference types="vite/client" />

import type { IpcWorld } from "./shared/ipcWorld/typings";

declare global {
  interface Window {
    [key: string]: IpcWorld | undefined;
  }
}
