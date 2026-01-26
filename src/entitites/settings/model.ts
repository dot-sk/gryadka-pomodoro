import { createDomain } from "effector";
import connectLocalStorage from "effector-localstorage";

export const domain = createDomain("settings");

export const events = {
  set: domain.event<{ key: string; value: any }>(),
};

const connectSettingsLocalStorage = connectLocalStorage("$settings");

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

const localStorageInitialValue =
  connectSettingsLocalStorage.init(SETTINGS_DEFAULT);

const storeInitialValue =
  localStorageInitialValue.revision === SETTINGS_REVISION
    ? localStorageInitialValue
    : SETTINGS_DEFAULT;

export const $settings = domain
  .store(storeInitialValue)
  .on(events.set, (settings, { key, value }) => {
    return { ...settings, [key]: value };
  });

$settings.watch(connectSettingsLocalStorage);

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
