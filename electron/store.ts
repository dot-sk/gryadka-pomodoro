import ElectronStore from "electron-store";

export type StatEntry = {
  start: number;
  end: number;
  time: number;
  interval: number;
  type: string;
};

export type Settings = {
  revision: number;
  theme: string;
  sound: boolean;
  dailyGoalSeconds: number;
  workIntervals: string;
  restIntervals: string;
};

type StoreSchema = {
  statEntriesHistory: StatEntry[];
  settings: Settings;
};

const EIGHT_HOURS_SECONDS = 8 * 60 * 60;
const SETTINGS_REVISION = 1;

export const store = new ElectronStore<StoreSchema>({
  name: "graydka-data",
  defaults: {
    statEntriesHistory: [],
    settings: {
      revision: SETTINGS_REVISION,
      theme: "light",
      sound: true,
      dailyGoalSeconds: EIGHT_HOURS_SECONDS,
      workIntervals: [0.5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].join(";"),
      restIntervals: [5, 10, 15, 20, 25, 30, 60].join(";"),
    },
  },
});
