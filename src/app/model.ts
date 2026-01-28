import { createDomain } from "effector";
import { ipcWorld } from "../shared/ipcWorld/ipcWorld";
import { IpcChannels } from "../shared/ipcWorld/constants";
import { countdownModel } from "../entitites/countdown";

export enum AppScreen {
  TIMER = "timer",
  STATS = "stats",
  UPDATE = "update",
}

export const appDomain = createDomain();

export const events = {
  navigateToTimer: appDomain.event(),
  navigateToStats: appDomain.event(),
  navigateToUpdate: appDomain.event(),
};

export const $currentScreen = appDomain
  .store<AppScreen>(AppScreen.TIMER)
  .on(events.navigateToTimer, () => AppScreen.TIMER)
  .on(events.navigateToStats, () => AppScreen.STATS)
  .on(events.navigateToUpdate, () => AppScreen.UPDATE);

ipcWorld.on(IpcChannels["navigate-to-timer"], () => {
  events.navigateToTimer();
});

ipcWorld.on(IpcChannels["navigate-to-stats"], () => {
  events.navigateToStats();
});

ipcWorld.on(IpcChannels["toggle-play-pause"], () => {
  countdownModel.events.togglePlayPause();
});
