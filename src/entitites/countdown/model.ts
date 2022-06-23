import { combine, createDomain, forward, merge, sample } from "effector";
import { CountdownState, IntervalType } from "./constants";
import { wait } from "../../shared/utils";
import {
  CountdownStartPayload,
  CountdownEndPayload,
  CountdownStopPayload,
} from "./typings";

const ONE_SEC = 1000;

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
};

export const effects = {
  tickEffect: domain.createEffect(() => wait(ONE_SEC)),
};

const startTypeGuard = events.start.filterMap(
  ({ type }: any = {}) => type ?? IntervalType.WORK
);
const startTimeGuard = events.start.filterMap(
  ({ interval }: any = { interval: 0 }) => (interval > 0 ? interval : undefined)
);
const setTimeGuard = events.setTime.filter({ fn: (time) => time > 0 });

export const $time = domain
  .store(0)
  .on(merge([setTimeGuard, startTimeGuard]), (_, time) => time)
  .on(effects.tickEffect, (time) => time - 1);

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

// tick when countdown starts
sample({
  source: merge([startTimeGuard, events.resume]),
  filter: effects.tickEffect.pending.map((is) => !is),
  fn: () => null,
  target: effects.tickEffect,
});

const willTick = sample({
  source: effects.tickEffect.done,
  filter: combine(
    $time,
    $isRunning,
    (time, isRunning) => time > 0 && isRunning
  ),
});

// trigger tick after 1 sec is over if countdown is running and time is left
sample({
  source: willTick,
  fn: () => null,
  target: effects.tickEffect,
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
