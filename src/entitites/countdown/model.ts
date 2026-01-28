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
};

ipcWorld.on(IpcChannels["clock:tick"], (_, msSinceLastTick) => {
  events.clockInterval(Number(msSinceLastTick))
})

const startTypeGuard = events.start.filterMap(
  ({ type }: any = {}) => type ?? IntervalType.WORK
);
const startTimeGuard = events.start.filterMap(
  ({ interval }: any = { interval: 0 }) => (interval > 0 ? interval : undefined)
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

const stopAndSaveGuard = stopGuard.filterMap(({ save }) =>
  save === true ? save : undefined
);

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

// Флаг: есть ли таймер "в процессе" (запущен или на паузе после запуска)
// true = таймер активен (нельзя редактировать интервал)
// Сбрасывается при reset/stop
export const $hasActiveTimer = domain
  .store(false)
  .on(events.resume, () => true)
  .on(startTimeGuard, () => true)
  .reset(events.reset);

// Лок на ручное изменение интервала: редактировать можно только если нет активного таймера
export const $canEditTime = $hasActiveTimer.map((hasActive) => !hasActive);

export const $currentInterval = domain
  .store<number>(0)
  .on(startTimeGuard, (_, time) => time)
  .on(events.initFromSettings, (_, { interval }) => interval);

// Когда можно редактировать время (до первого запуска) - currentInterval = time
sample({
  clock: setTimeGuard,
  source: $canEditTime,
  filter: (canEdit) => canEdit,
  fn: (_, newTime) => newTime,
  target: $currentInterval,
});

// Timestamp когда стартовали/возобновили текущий отрезок
const $startedAt = domain
  .store<number>(0)
  .on(startTimeGuard, () => Date.now())
  .reset(events.reset);

// Сколько секунд было на момент старта текущего отрезка
const $effectiveInterval = domain
  .store<number>(0)
  .on(startTimeGuard, (_, interval) => interval - 1) // -1: синхронно с $time
  .on(events.initFromSettings, (_, { interval }) => interval - 1)
  .reset(events.reset);

// При resume: обновляем startedAt
sample({
  clock: events.resume,
  fn: () => Date.now(),
  target: $startedAt,
});

const clockIntervalIsRunning = sample({
  source: events.clockInterval,
  filter: $isRunning
});

export const $time = domain
  .store(0)
  .on(setTimeGuard, (_, time) => time)
  .on(startTimeGuard, (_, interval) => interval - 1) // -1: первая секунда уже началась
  .on(events.initFromSettings, (_, { interval }) => interval - 1);

// Вычисляем время из реального timestamp — нет дрифта
sample({
  clock: clockIntervalIsRunning,
  source: combine($startedAt, $effectiveInterval),
  fn: ([startedAt, effectiveInterval]) => {
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    return effectiveInterval - elapsedSeconds; // может быть < 0, это триггерит завершение
  },
  target: $time,
});

// $time на момент паузы становится новым effectiveInterval при resume
sample({
  clock: events.pause,
  source: $time,
  target: $effectiveInterval,
});

// При ручном изменении времени (setTime) также обновляем effectiveInterval
sample({
  clock: setTimeGuard,
  fn: (time) => time,
  target: $effectiveInterval,
});

const timeNegative = sample({
  source: $time,
  filter: (time) => time < 0, // завершаем когда время ушло в минус (0 показался полную секунду)
});

// После save -> переход в SUCCESS
sample({
  clock: merge([stopAndSaveGuard, timeNegative]),
  fn: () => null,
  target: events.showSuccess,
});

// reset countdown when timer is stopped without save
const stopWithoutSaveGuard = stopGuard.filterMap(({ save }) =>
  save !== true ? true : undefined
);

// reset countdown when timer reaches 0 or when it is stopped from outside
sample({
  clock: stopWithoutSaveGuard,
  target: events.reset,
});

sample({
  clock: merge([stopAndSaveGuard, timeNegative]),
  source: combine($time, $currentInterval).map(([time, currentInterval]) => ({
    // clamp time к 0, т.к. при завершении time может быть < 0
    elapsedTime: currentInterval - Math.max(0, time),
  })),
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
sample({
  clock: sample({
    source: combine({
      interval: settingsModel.$lastInterval,
      type: settingsModel.$lastIntervalType,
    }),
    filter: ({ interval }) => interval > 0,
  }),
  fn: ({ interval, type }) => ({ interval, type: type as IntervalType }),
  target: events.initFromSettings,
});
