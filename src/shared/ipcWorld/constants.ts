export enum IpcChannels {
  "countdown-tick" = "countdown-tick",
  "countdown-tick-as-image" = "countdown-tick-as-image",
  "clock:tick" = "clock:tick",
  "navigate-to-timer" = "navigate-to-timer",
  "navigate-to-stats" = "navigate-to-stats",
  "window:hide-after-save" = "window:hide-after-save",
  "toggle-play-pause" = "toggle-play-pause",
  "update-available" = "update-available",
  "download-progress" = "download-progress",
  "update-downloaded" = "update-downloaded",
  "update-error" = "update-error",
  "download-update" = "download-update",
  "install-update" = "install-update",
  "liquid-glass-state" = "liquid-glass-state",
}

export const IPC_WORLD = 'ipcWorld'