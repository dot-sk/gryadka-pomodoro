/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

import type { IpcWorld } from "./shared/ipcWorld/typings";

declare global {
  interface Window {
    [key: string]: IpcWorld | undefined;
  }
}
