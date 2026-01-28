import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow } from 'electron';
import { IpcChannels } from '../src/shared/ipcWorld/constants';

const CHECK_UPDATE_DELAY_MS = 5000;

export function setupAutoUpdater(window: BrowserWindow | null) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  if (app.isPackaged) {
    setTimeout(() => autoUpdater.checkForUpdates(), CHECK_UPDATE_DELAY_MS);
  }

  autoUpdater.on('update-available', (info) => {
    window?.webContents.send(IpcChannels['update-available'], info);
  });

  autoUpdater.on('error', (err) => {
    window?.webContents.send(IpcChannels['update-error'], err.message);
  });

  autoUpdater.on('download-progress', (progress) => {
    window?.webContents.send(IpcChannels['download-progress'], progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    window?.webContents.send(IpcChannels['update-downloaded'], info);
  });

  return autoUpdater;
}
