import { IpcChannels } from "./constants";

export type IpcWorld = {
  send(channel: IpcChannels, ...args: any[]): void,
  // event параметр на данный момент пофиг какой
  on(channel: IpcChannels, listener: (event: unknown, ...args: any[]) => void): void
};

