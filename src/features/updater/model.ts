import { createEvent, createStore } from "effector";
import { ipcWorld } from "../../shared/ipcWorld/ipcWorld";
import { IpcChannels } from "../../shared/ipcWorld/constants";
import { events as appEvents } from "../../app/model";

export type UpdateInfo = {
  version: string;
  releaseNotes?: string;
};

export type DownloadProgress = {
  percent: number;
  transferred: number;
  total: number;
};

export enum UpdateStatus {
  IDLE = "idle",
  AVAILABLE = "available",
  DOWNLOADING = "downloading",
  DOWNLOADED = "downloaded",
  ERROR = "error",
}

// Events
export const updateAvailable = createEvent<UpdateInfo>();
export const downloadProgress = createEvent<DownloadProgress>();
export const updateDownloaded = createEvent<UpdateInfo>();
export const updateError = createEvent<string>();
export const startDownload = createEvent();
export const installUpdate = createEvent();
export const dismissUpdate = createEvent();

// Stores
export const $updateStatus = createStore<UpdateStatus>(UpdateStatus.IDLE)
  .on(updateAvailable, () => UpdateStatus.AVAILABLE)
  .on(startDownload, () => UpdateStatus.DOWNLOADING)
  .on(downloadProgress, () => UpdateStatus.DOWNLOADING)
  .on(updateDownloaded, () => UpdateStatus.DOWNLOADED)
  .on(updateError, () => UpdateStatus.ERROR)
  .on(dismissUpdate, () => UpdateStatus.IDLE);

export const $updateInfo = createStore<UpdateInfo | null>(null)
  .on(updateAvailable, (_, info) => info)
  .on(updateDownloaded, (_, info) => info)
  .on(dismissUpdate, () => null);

export const $downloadProgress = createStore<DownloadProgress | null>(null)
  .on(downloadProgress, (_, progress) => progress)
  .on(updateDownloaded, () => null)
  .on(dismissUpdate, () => null);

export const $errorMessage = createStore<string | null>(null)
  .on(updateError, (_, message) => message)
  .on(dismissUpdate, () => null);

// Side effects
startDownload.watch(() => ipcWorld.send(IpcChannels["download-update"]));
installUpdate.watch(() => ipcWorld.send(IpcChannels["install-update"]));

// Navigation
updateAvailable.watch(() => appEvents.navigateToUpdate());
updateDownloaded.watch(() => appEvents.navigateToUpdate());
dismissUpdate.watch(() => appEvents.navigateToTimer());

// IPC listeners
ipcWorld.on(IpcChannels["update-available"], (_, ...args) => {
  updateAvailable(args[0] as UpdateInfo);
});

ipcWorld.on(IpcChannels["download-progress"], (_, ...args) => {
  downloadProgress(args[0] as DownloadProgress);
});

ipcWorld.on(IpcChannels["update-downloaded"], (_, ...args) => {
  updateDownloaded(args[0] as UpdateInfo);
});

ipcWorld.on(IpcChannels["update-error"], (_, ...args) => {
  updateError(args[0] as string);
});
