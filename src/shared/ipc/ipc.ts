import { Ipc } from "./typings";

// use fake ipc for testing
const fakeIpc = { send: () => null };

export const ipc: Ipc = (window as any).ipc ?? fakeIpc;
