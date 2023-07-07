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
  events.clockInterval(msSinceLastTick)
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

const clockIntervalIsRunning = sample({
  source: events.clockInterval,
  filter: $isRunning
});

export const $time = domain
  .store(0)
  .on(merge([setTimeGuard, startTimeGuard]), (_, time) => time)
  .on(clockIntervalIsRunning, (secLeft) => {
    // TODO: правильнее было бы отнимать реально прошедшее время, но для этого
    // кажется, что надо рефакторить и переходить на миллисекунды
    // сейчас для простоты забил
    // msSinceLastTick - второй параметр этой функции, кототрый сейчас не указан
    // return secLeft - msSinceLastTick / 1000
    return secLeft - 1
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
