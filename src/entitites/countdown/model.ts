import { combine, createDomain, merge, sample } from "effector";
import { CountdownState, IntervalType } from "./constants";
import {
  CountdownStartPayload,
  CountdownEndPayload,
  CountdownStopPayload,
} from "./typings";
import { ipcWorld } from "../../shared/ipcWorld/ipcWorld";
import { IpcChannels } from "../../shared/ipcWorld/constants";
import { settingsModel } from "../settings";

export const domain = createDomain();

export const events = {
  start: domain.event<CountdownStartPayload>(),
  pause: domain.event(),
  resume: domain.event(),
  stop: domain.event<CountdownStopPayload>(), // external event
  end: domain.event<CountdownEndPayload>(), // internal event
  reset: domain.event(),
  setTime: domain.event<number>(),
  setType: domain.event<IntervalType>(),
  clockInterval: domain.event<number>(),
  showSuccess: domain.event(),
  initFromSettings: domain.event<{ interval: number; type: IntervalType }>(),
  togglePlayPause: domain.event(),
};

ipcWorld.on(IpcChannels["clock:tick"], (_, msSinceLastTick) => {
  events.clockInterval(Number(msSinceLastTick))
})

const startTypeGuard = events.start.map(({ type }) => type ?? IntervalType.WORK);
const startTimeGuard = events.start.filterMap(({ interval }) =>
  interval > 0 ? interval : undefined
);
const setTimeGuard = events.setTime.filter({ fn: (time) => time >= 0 });

export const $countdownState = domain
  .store(CountdownState.PAUSED)
  .on(startTimeGuard, () => CountdownState.RUNNING)
  .on(events.pause, () => CountdownState.PAUSED)
  .on(events.resume, () => CountdownState.RUNNING)
  .on(events.showSuccess, () => CountdownState.SUCCESS)
  .reset(events.reset);

const stopGuard = sample({
  source: events.stop,
  filter: $countdownState.map((state) => state !== CountdownState.INITIAL),
});

const stopAndSaveGuard = stopGuard.filter({ fn: ({ save }) => save === true });
const stopWithoutSaveGuard = stopGuard.filter({ fn: ({ save }) => save !== true });

export const $countdownType = domain
  .createStore<IntervalType>(IntervalType.WORK)
  .on(startTypeGuard, (_, type) => type)
  .on(events.initFromSettings, (_, { type }) => type);

export const $isRunning = $countdownState.map(
  (state) => state === CountdownState.RUNNING
);

export const $isPaused = $countdownState.map(
  (state) => state === CountdownState.PAUSED
);

export const $isSuccess = $countdownState.map(
  (state) => state === CountdownState.SUCCESS
);

// Флаг: таймер "в процессе" (запущен или на паузе после запуска)
// Сбрасывается при reset/stop
export const $hasActiveTimer = domain
  .store(false)
  .on(events.resume, () => true)
  .on(startTimeGuard, () => true)
  .reset(events.reset);

// Редактировать интервал можно только если нет активного таймера
export const $canEditTime = $hasActiveTimer.map((hasActive) => !hasActive);

export const $currentInterval = domain
  .store<number>(0)
  .on(startTimeGuard, (_, time) => time)
  .on(events.initFromSettings, (_, { interval }) => interval);

// Когда можно редактировать время - currentInterval = time
sample({
  clock: setTimeGuard,
  filter: $canEditTime,
  target: $currentInterval,
});

// Timestamp когда стартовали/возобновили текущий отрезок
const $startedAt = domain
  .store<number>(0)
  .on(startTimeGuard, () => Date.now())
  .on(events.resume, () => Date.now())
  .reset(events.reset);

// Сколько секунд было на момент старта текущего отрезка
const $effectiveInterval = domain
  .store<number>(0)
  .on(startTimeGuard, (_, interval) => interval - 1)
  .on(events.initFromSettings, (_, { interval }) => interval - 1)
  .on(setTimeGuard, (_, time) => time)
  .reset(events.reset);

const clockIntervalIsRunning = sample({
  source: events.clockInterval,
  filter: $isRunning
});

export const $time = domain
  .store(0)
  .on(setTimeGuard, (_, time) => time)
  .on(startTimeGuard, (_, interval) => interval - 1)
  .on(events.initFromSettings, (_, { interval }) => interval - 1);

// $time на момент паузы становится новым effectiveInterval при resume
sample({
  clock: events.pause,
  source: $time,
  target: $effectiveInterval,
});

// Вычисляем время из реального timestamp — нет дрифта
sample({
  clock: clockIntervalIsRunning,
  source: combine($startedAt, $effectiveInterval),
  fn: ([startedAt, effectiveInterval]) => {
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    return effectiveInterval - elapsedSeconds;
  },
  target: $time,
});

const timeNegative = sample({
  source: $time,
  filter: (time) => time < 0,
});

// После save -> переход в SUCCESS
sample({
  clock: merge([stopAndSaveGuard, timeNegative]),
  target: events.showSuccess,
});

// reset countdown when timer is stopped without save
sample({
  clock: stopWithoutSaveGuard,
  target: events.reset,
});

const $elapsedTime = combine($time, $currentInterval, (time, currentInterval) => ({
  elapsedTime: currentInterval - Math.max(0, time),
}));

sample({
  clock: merge([stopAndSaveGuard, timeNegative]),
  source: $elapsedTime,
  target: events.end,
});

// restore interval on reset
sample({
  clock: events.reset,
  source: $currentInterval,
  target: events.setTime,
});

// Save last interval and type to settings when starting a timer
sample({
  clock: events.start,
  fn: ({ interval }) => ({ key: "lastInterval", value: interval }),
  target: settingsModel.events.set,
});

sample({
  clock: events.start,
  fn: ({ type }) => ({ key: "lastIntervalType", value: type }),
  target: settingsModel.events.set,
});

// Load last interval from settings on init
const $settingsData = combine({
  interval: settingsModel.$lastInterval,
  type: settingsModel.$lastIntervalType,
});

sample({
  source: $settingsData,
  filter: ({ interval }) => interval > 0,
  fn: ({ interval, type }) => ({ interval, type: type as IntervalType }),
  target: events.initFromSettings,
});

// Toggle play/pause logic
const $toggleState = combine({
  isPaused: $isPaused,
  isRunning: $isRunning,
  hasActiveTimer: $hasActiveTimer,
  currentInterval: $currentInterval,
  type: $countdownType,
});

const togglePayload = sample({
  clock: events.togglePlayPause,
  source: $toggleState,
});

// Если таймер не был запущен вообще - используем start
sample({
  clock: togglePayload,
  filter: ({ isPaused, isRunning, hasActiveTimer }) => isPaused && !isRunning && !hasActiveTimer,
  fn: ({ currentInterval, type }) => ({ interval: currentInterval, type }),
  target: events.start,
});

// Если таймер на паузе после запуска - resume
sample({
  clock: togglePayload,
  filter: ({ isPaused, hasActiveTimer }) => isPaused && hasActiveTimer,
  target: events.resume,
});

// Если таймер запущен - pause
sample({
  clock: togglePayload,
  filter: ({ isRunning }) => isRunning,
  target: events.pause,
});
