import { IpcChannels } from "./constants";

export type Ipc = {
  send: (channel: IpcChannels, ...args: any[]) => void;
};
