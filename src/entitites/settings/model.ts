import { createDomain } from "effector";
import {
  connectElectronStore,
  loadFromElectronStore,
} from "../../shared/lib/effector-electron-store";

export const domain = createDomain("settings");

export const events = {
  set: domain.event<{ key: string; value: any }>(),
  loadSettings: domain.event<any>(),
};

const settingsStore = connectElectronStore("settings");

const EIGHT_HOURS_SECONDS = 8 * 60 * 60;

const SETTINGS_REVISION = 1;

const SETTINGS_DEFAULT = {
  revision: SETTINGS_REVISION,
  theme: "light",
  sound: true,
  dailyGoalSeconds: EIGHT_HOURS_SECONDS,
  workIntervals: [0.5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].join(";"),
  restIntervals: [5, 10, 15, 20, 25, 30, 60].join(";"),
};

export const $settings = domain
  .store(SETTINGS_DEFAULT)
  .on(events.loadSettings, (_, settings) => {
    // Проверка ревизии при загрузке
    return settings.revision === SETTINGS_REVISION ? settings : SETTINGS_DEFAULT;
  })
  .on(events.set, (settings, { key, value }) => {
    return { ...settings, [key]: value };
  });

export const $dailyGoalSeconds = $settings.map(
  (settings) => settings.dailyGoalSeconds
);

export const $workIntervals = $settings
  .map((settings) => settings.workIntervals.split(";"))
  .map((intervals: string[]) =>
    intervals.map((interval) => parseFloat(interval))
  );

export const $restIntervals = $settings
  .map((settings) => settings.restIntervals.split(";"))
  .map((intervals: string[]) =>
    intervals.map((interval) => parseFloat(interval))
  );

// Подписка на изменения для сохранения в electron-store
settingsStore.subscribe($settings);

// Загрузка настроек при старте
loadFromElectronStore("settings", SETTINGS_DEFAULT).then((data) => {
  events.loadSettings(data);
});