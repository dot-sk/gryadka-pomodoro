import { createDomain } from "effector";
import { ipcWorld } from "../shared/ipcWorld/ipcWorld";
import { IpcChannels } from "../shared/ipcWorld/constants";

export enum AppScreen {
  TIMER = "timer",
  STATS = "stats",
}

export const appDomain = createDomain();

export const events = {
  navigateToTimer: appDomain.event(),
  navigateToStats: appDomain.event(),
};

export const $currentScreen = appDomain
  .store<AppScreen>(AppScreen.TIMER)
  .on(events.navigateToTimer, () => AppScreen.TIMER)
  .on(events.navigateToStats, () => AppScreen.STATS);

ipcWorld.on(IpcChannels["navigate-to-timer"], () => {
  events.navigateToTimer();
});

ipcWorld.on(IpcChannels["navigate-to-stats"], () => {
  events.navigateToStats();
});
