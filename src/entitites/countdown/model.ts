import { combine, createDomain, forward, merge, sample } from "effector";
import { CountdownState, IntervalType } from "./constants";
import {
  CountdownStartPayload,
  CountdownEndPayload,
  CountdownStopPayload,
} from "./typings";
import { ipcWorld } from "../../shared/ipcWorld/ipcWorld";
import { IpcChannels } from "../../shared/ipcWorld/constants";

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
  clockInterval: domain.event<number>()
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
const setTimeGuard = events.setTime.filter({ fn: (time) => time > 0 });

export const $countdownState = domain
  .store(CountdownState.INITIAL)
  .on(startTimeGuard, () => CountdownState.RUNNING)
  .on(events.pause, () => CountdownState.PAUSED)
  .on(events.resume, () => CountdownState.RUNNING)
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
  .on(startTypeGuard, (_, type) => type);

export const $isRunning = $countdownState.map(
  (state) => state === CountdownState.RUNNING
);

export const $isPaused = $countdownState.map(
  (state) => state === CountdownState.PAUSED
);

export const $isInitial = $countdownState.map(
  (state) => state === CountdownState.INITIAL
);

export const $currentInterval = domain
  .store<number>(0)
  .on(startTimeGuard, (_, time) => time);

// Timestamp когда стартовали/возобновили текущий отрезок
const $startedAt = domain
  .store<number>(0)
  .on(startTimeGuard, () => Date.now())
  .reset(events.reset);

// Сколько секунд было на момент старта текущего отрезка
const $effectiveInterval = domain
  .store<number>(0)
  .on(startTimeGuard, (_, interval) => interval)
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
  .on(merge([setTimeGuard, startTimeGuard]), (_, time) => time);

// Вычисляем время из реального timestamp — нет дрифта
sample({
  clock: clockIntervalIsRunning,
  source: combine($startedAt, $effectiveInterval),
  fn: ([startedAt, effectiveInterval]) => {
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, effectiveInterval - elapsedSeconds);
  },
  target: $time,
});

// $time на момент паузы становится новым effectiveInterval при resume
sample({
  clock: events.pause,
  source: $time,
  target: $effectiveInterval,
});

const timeZero = sample({
  source: $time,
  filter: (time) => time === 0,
});

// reset countdown when timer reaches 0 or when it is stopped from outside
forward({
  from: sample({
    source: merge([
      // zero time event
      timeZero,
      stopGuard,
    ]),
    fn: () => null,
  }),
  to: events.reset,
});

sample({
  clock: merge([stopAndSaveGuard, timeZero]),
  source: combine($time, $currentInterval).map(([time, currentInterval]) => ({
    elapsedTime: currentInterval - time,
  })),
  target: events.end,
});

// restore interval on reset
sample({
  clock: events.reset,
  source: $currentInterval,
  target: events.setTime,
});
