import { allSettled, fork } from "effector";
import { $countdownState, $time, $isInitial, $isPaused, $isRunning, domain, events } from "./model";
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

  it("должен сразу показать interval-1 при старте (первая секунда уже началась)", async () => {
    const scope = fork(domain);

    await allSettled(events.start, { scope, params: START_PARAMS });
    // При старте сразу показываем 9, т.к. первая секунда уже пошла
    expect(scope.getState($time)).toBe(9);

    advanceTime(1000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(8);

    advanceTime(1000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(7);
  });

  it("должен остановиться при паузе", async () => {
    const scope = fork(domain);

    await allSettled(events.start, { scope, params: START_PARAMS });
    // start: time=9

    advanceTime(2000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(7); // 9 - 2

    await allSettled(events.pause, { scope });

    // Время идёт, но тики не обрабатываются (isRunning = false)
    advanceTime(5000);
    await allSettled(events.clockInterval, { scope, params: 1000 });

    // Время должно остаться тем же
    expect(scope.getState($time)).toBe(7);
  });

  it("должен продолжить с того же места после паузы", async () => {
    const scope = fork(domain);

    await allSettled(events.start, { scope, params: START_PARAMS });
    // start: time=9

    advanceTime(2000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(7); // 9 - 2

    await allSettled(events.pause, { scope });
    advanceTime(5000); // время идёт во время паузы

    await allSettled(events.resume, { scope });
    // Сразу после resume время должно быть тем же
    expect(scope.getState($time)).toBe(7);

    // Первый тик после resume (0 сек прошло) — время не меняется
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(7);

    advanceTime(2000);
    await allSettled(events.clockInterval, { scope, params: 1000 });

    // 7 - 2 = 5
    expect(scope.getState($time)).toBe(5);
  });

  it("должен сбросить состояние в INITIAL только после того как 0 показался полную секунду", async () => {
    const scope = fork(domain);

    // interval=3: показываем 2, 1, 0, потом reset
    await allSettled(events.start, { scope, params: { interval: 3, type: IntervalType.WORK } });
    expect(scope.getState($time)).toBe(2); // сразу -1
    expect(scope.getState($countdownState)).toBe(CountdownState.RUNNING);

    advanceTime(1000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(1);
    expect(scope.getState($countdownState)).toBe(CountdownState.RUNNING);

    advanceTime(1000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(0); // показываем 0, но ещё не reset
    expect(scope.getState($countdownState)).toBe(CountdownState.RUNNING);

    advanceTime(1000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    // Теперь reset — прошло 3 секунды
    expect(scope.getState($countdownState)).toBe(CountdownState.INITIAL);
    expect(scope.getState($time)).toBe(3); // вернулся к интервалу
  });

  it("должен вернуть таймер в значение интервала после reset", async () => {
    const scope = fork(domain);

    await allSettled(events.start, { scope, params: START_PARAMS });
    // start: time=9

    advanceTime(3000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(6); // 9 - 3

    await allSettled(events.stop, { scope, params: { save: false } });

    // В INITIAL показываем полный интервал
    expect(scope.getState($time)).toBe(10);
    expect(scope.getState($countdownState)).toBe(CountdownState.INITIAL);
  });

  describe("флаги состояния во время паузы", () => {
    it("$isInitial должен быть false во время паузы", async () => {
      const scope = fork(domain);

      // До старта - INITIAL
      expect(scope.getState($isInitial)).toBe(true);
      expect(scope.getState($isPaused)).toBe(false);
      expect(scope.getState($isRunning)).toBe(false);

      await allSettled(events.start, { scope, params: START_PARAMS });

      // После старта - RUNNING
      expect(scope.getState($isInitial)).toBe(false);
      expect(scope.getState($isPaused)).toBe(false);
      expect(scope.getState($isRunning)).toBe(true);

      await allSettled(events.pause, { scope });

      // После паузы - PAUSED (НЕ INITIAL!)
      expect(scope.getState($isInitial)).toBe(false);
      expect(scope.getState($isPaused)).toBe(true);
      expect(scope.getState($isRunning)).toBe(false);
      expect(scope.getState($countdownState)).toBe(CountdownState.PAUSED);
    });

    it("clockInterval не должен менять $time во время паузы", async () => {
      const scope = fork(domain);

      await allSettled(events.start, { scope, params: START_PARAMS });
      // start: time=9
      advanceTime(2000);
      await allSettled(events.clockInterval, { scope, params: 1000 });
      expect(scope.getState($time)).toBe(7); // 9 - 2

      await allSettled(events.pause, { scope });
      const timeAtPause = scope.getState($time);

      // Много тиков во время паузы
      for (let i = 0; i < 5; i++) {
        advanceTime(1000);
        await allSettled(events.clockInterval, { scope, params: 1000 });
      }

      // Время не должно измениться
      expect(scope.getState($time)).toBe(timeAtPause);
      // И состояние всё ещё PAUSED
      expect(scope.getState($isInitial)).toBe(false);
      expect(scope.getState($isPaused)).toBe(true);
    });
  });
});
