import { allSettled, fork } from "effector";
import { $countdownState, $time, domain, events } from "./model";
import { CountdownState, IntervalType } from "./constants";

const SECONDS = 10;
const START_PARAMS = { interval: SECONDS, type: IntervalType.WORK };

describe("entity/countdown/model", () => {
  let dateNowSpy: jest.SpyInstance;
  let currentTime: number;

  beforeEach(() => {
    currentTime = 1000000;
    dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => currentTime);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  const advanceTime = (ms: number) => {
    currentTime += ms;
  };

  it("должен =0 секунд при старте", () => {
    const scope = fork(domain);
    expect(scope.getState($time)).toBe(0);
  });

  it("должен иметь состояние INITIAL при старте", () => {
    const scope = fork(domain);
    expect(scope.getState($countdownState)).toBe(CountdownState.INITIAL);
  });

  it("должен уменьшать время на каждый тик", async () => {
    const scope = fork(domain);

    await allSettled(events.start, { scope, params: START_PARAMS });
    expect(scope.getState($time)).toBe(10);

    advanceTime(1000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(9);

    advanceTime(1000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(8);
  });

  it("должен остановиться при паузе", async () => {
    const scope = fork(domain);

    await allSettled(events.start, { scope, params: START_PARAMS });

    advanceTime(2000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(8);

    await allSettled(events.pause, { scope });

    // Время идёт, но тики не обрабатываются (isRunning = false)
    advanceTime(5000);
    await allSettled(events.clockInterval, { scope, params: 1000 });

    // Время должно остаться тем же
    expect(scope.getState($time)).toBe(8);
  });

  it("должен продолжить с того же места после паузы", async () => {
    const scope = fork(domain);

    await allSettled(events.start, { scope, params: START_PARAMS });

    advanceTime(2000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(8);

    await allSettled(events.pause, { scope });
    advanceTime(5000); // время идёт во время паузы

    await allSettled(events.resume, { scope });
    // После resume startedAt обновляется на текущее время

    advanceTime(2000);
    await allSettled(events.clockInterval, { scope, params: 1000 });

    // 8 - 2 = 6
    expect(scope.getState($time)).toBe(6);
  });

  it("должен сбросить состояние в INITIAL, когда дотикал до 0", async () => {
    const scope = fork(domain);

    await allSettled(events.start, { scope, params: { interval: 2, type: IntervalType.WORK } });

    advanceTime(2000);
    await allSettled(events.clockInterval, { scope, params: 1000 });

    expect(scope.getState($countdownState)).toBe(CountdownState.INITIAL);
  });

  it("должен вернуть таймер в значение интервала после reset", async () => {
    const scope = fork(domain);

    await allSettled(events.start, { scope, params: START_PARAMS });

    advanceTime(3000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(7);

    await allSettled(events.stop, { scope, params: { save: false } });

    expect(scope.getState($time)).toBe(10);
    expect(scope.getState($countdownState)).toBe(CountdownState.INITIAL);
  });
});
