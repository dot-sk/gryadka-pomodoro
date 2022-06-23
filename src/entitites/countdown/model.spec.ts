import { allSettled, fork } from "effector";
import { $countdownState, $time, domain, effects, events } from "./model";
import { CountdownState, IntervalType } from "./constants";
import { wait } from "../../shared/utils";

jest.useRealTimers();

const SECONDS = 10;
const START_PARAMS = { interval: SECONDS, type: IntervalType.WORK };

describe("entity/countdown/model", () => {
  it("должен =0 секунд при старте", () => {
    const scope = fork(domain);
    expect(scope.getState($time)).toBe(0);
  });

  it("должен иметь состояние INITIAL при старте", () => {
    const scope = fork(domain);
    expect(scope.getState($countdownState)).toBe(CountdownState.INITIAL);
  });

  it("должен протикать согласно количеству секунд", async () => {
    const scope = fork(domain);
    const allowedDelta = 100;
    const threeSecMs = 3 * 1000;

    const start = Date.now();
    await allSettled(events.start, {
      scope,
      params: { interval: 3, type: IntervalType.WORK },
    });
    const end = Date.now();
    const diff = end - start;

    expect(diff).not.toBeLessThan(threeSecMs - allowedDelta);
    expect(diff).not.toBeGreaterThan(threeSecMs + allowedDelta);
  });

  it("должен остановиться при паузе", async () => {
    const fn = jest.fn();
    const scope = fork(domain, {
      handlers: [
        [
          effects.tickEffect,
          () => {
            fn();
            return wait(100);
          },
        ],
      ],
    });

    allSettled(events.start, { scope, params: START_PARAMS });
    await wait(200);
    await allSettled(events.pause, { scope });
    await wait(200);

    expect(scope.getState($time)).toBe(8);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("должен продолжить с того же места после паузы", async () => {
    const scope = fork(domain, {
      handlers: [[effects.tickEffect, () => wait(110)]],
    });

    allSettled(events.start, { scope, params: START_PARAMS });
    await wait(200);
    await allSettled(events.pause, { scope });
    await wait(200);
    allSettled(events.resume, { scope });
    await wait(200);
    await allSettled(events.pause, { scope });

    expect(scope.getState($time)).toBe(6);
  });

  it("должен сбросить состояние в INITIAL, когда дотикал до 0", async () => {
    const scope = fork(domain, {
      handlers: [[effects.tickEffect, () => null]],
    });

    await allSettled(events.start, { scope, params: START_PARAMS });

    expect(scope.getState($countdownState)).toBe(CountdownState.INITIAL);
  });

  it("должен вернуть таймер в значение интервала, когда дотикал до 0", async () => {
    const scope = fork(domain, {
      handlers: [[effects.tickEffect, () => null]],
    });

    await allSettled(events.start, { scope, params: START_PARAMS });

    expect(scope.getState($time)).toBe(10);
  });

  it("должен сбросить состояние в INITIAL при стопе", async () => {
    const scope = fork(domain, {
      handlers: [[effects.tickEffect, () => wait(100)]],
    });

    allSettled(events.start, { scope, params: START_PARAMS });
    await wait(200);
    await allSettled(events.stop, { scope, params: { save: false } });

    expect(scope.getState($countdownState)).toBe(CountdownState.INITIAL);
  });

  it("дожен вызвать событие end при стопе", async () => {
    const fn = jest.fn();
    events.end.watch(fn);
    const scope = fork(domain, {
      handlers: [[effects.tickEffect, () => wait(100)]],
    });

    allSettled(events.start, { scope, params: START_PARAMS });
    await wait(300);
    await allSettled(events.stop, { scope, params: { save: true } });

    expect(fn).toHaveBeenCalledWith({
      elapsedTime: 3,
    });
  });
});
