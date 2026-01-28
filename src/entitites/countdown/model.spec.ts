import { allSettled, fork } from "effector";
import { $countdownState, $time, $isPaused, $isRunning, $canEditTime, $hasActiveTimer, $currentInterval, domain, events } from "./model";
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
    const scope = fork();
    expect(scope.getState($time)).toBe(0);
  });

  it("должен иметь состояние PAUSED при старте", () => {
    const scope = fork();
    expect(scope.getState($countdownState)).toBe(CountdownState.PAUSED);
  });

  it("должен сразу показать interval-1 при старте (первая секунда уже началась)", async () => {
    const scope = fork();

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
    const scope = fork();

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
    const scope = fork();

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

  it("должен сбросить состояние в PAUSED только после того как 0 показался полную секунду", async () => {
    const scope = fork();

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
    // Теперь SUCCESS — таймер завершился
    expect(scope.getState($countdownState)).toBe(CountdownState.SUCCESS);
    // После перехода в SUCCESS нужен явный reset для возврата к PAUSED
    await allSettled(events.reset, { scope });
    expect(scope.getState($countdownState)).toBe(CountdownState.PAUSED);
    expect(scope.getState($time)).toBe(3); // вернулся к интервалу
  });

  it("должен вернуть таймер в значение интервала после reset", async () => {
    const scope = fork();

    await allSettled(events.start, { scope, params: START_PARAMS });
    // start: time=9

    advanceTime(3000);
    await allSettled(events.clockInterval, { scope, params: 1000 });
    expect(scope.getState($time)).toBe(6); // 9 - 3

    await allSettled(events.stop, { scope, params: { save: false } });

    // В PAUSED показываем полный интервал
    expect(scope.getState($time)).toBe(10);
    expect(scope.getState($countdownState)).toBe(CountdownState.PAUSED);
  });

  describe("флаги состояния во время паузы", () => {
    it("$isPaused должен быть true в начале и после паузы", async () => {
      const scope = fork();

      // До старта - PAUSED
      expect(scope.getState($isPaused)).toBe(true);
      expect(scope.getState($isRunning)).toBe(false);

      await allSettled(events.start, { scope, params: START_PARAMS });

      // После старта - RUNNING
      expect(scope.getState($isPaused)).toBe(false);
      expect(scope.getState($isRunning)).toBe(true);

      await allSettled(events.pause, { scope });

      // После паузы - PAUSED
      expect(scope.getState($isPaused)).toBe(true);
      expect(scope.getState($isRunning)).toBe(false);
      expect(scope.getState($countdownState)).toBe(CountdownState.PAUSED);
    });

    it("clockInterval не должен менять $time во время паузы", async () => {
      const scope = fork();

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
      expect(scope.getState($isPaused)).toBe(true);
    });
  });

  describe("$canEditTime - редактирование времени стрелками", () => {
    it("должен быть true в начальном состоянии (до первого запуска)", async () => {
      const scope = fork();

      // Инициализируем начальное время
      await allSettled(events.initFromSettings, { 
        scope, 
        params: { interval: 1500, type: IntervalType.WORK } 
      });

      expect(scope.getState($canEditTime)).toBe(true);
      expect(scope.getState($isPaused)).toBe(true);
    });

    it("должен быть false после resume (таймер запущен)", async () => {
      const scope = fork();

      await allSettled(events.initFromSettings, { 
        scope, 
        params: { interval: 1500, type: IntervalType.WORK } 
      });

      await allSettled(events.resume, { scope });

      expect(scope.getState($canEditTime)).toBe(false);
      expect(scope.getState($isRunning)).toBe(true);
    });

    it("должен быть false после паузы если таймер уже был запущен", async () => {
      const scope = fork();

      await allSettled(events.initFromSettings, { 
        scope, 
        params: { interval: 1500, type: IntervalType.WORK } 
      });

      // Запускаем
      await allSettled(events.resume, { scope });
      expect(scope.getState($canEditTime)).toBe(false);

      // Ставим на паузу
      await allSettled(events.pause, { scope });
      
      // Даже на паузе - нельзя редактировать, т.к. таймер уже был запущен
      expect(scope.getState($canEditTime)).toBe(false);
      expect(scope.getState($isPaused)).toBe(true);
    });

    it("должен быть true после reset (можно снова редактировать)", async () => {
      const scope = fork();

      await allSettled(events.initFromSettings, { 
        scope, 
        params: { interval: 1500, type: IntervalType.WORK } 
      });

      // Запускаем и ставим на паузу
      await allSettled(events.resume, { scope });
      await allSettled(events.pause, { scope });
      expect(scope.getState($canEditTime)).toBe(false);

      // Reset
      await allSettled(events.reset, { scope });

      // После reset можно снова редактировать
      expect(scope.getState($canEditTime)).toBe(true);
      expect(scope.getState($isPaused)).toBe(true);
    });

    it("должен быть true после stop без сохранения (можно снова редактировать)", async () => {
      const scope = fork();

      await allSettled(events.initFromSettings, { 
        scope, 
        params: { interval: 1500, type: IntervalType.WORK } 
      });

      // Запускаем
      await allSettled(events.resume, { scope });
      expect(scope.getState($canEditTime)).toBe(false);

      // Stop без сохранения
      await allSettled(events.stop, { scope, params: { save: false } });

      // После stop можно снова редактировать
      expect(scope.getState($canEditTime)).toBe(true);
      expect(scope.getState($isPaused)).toBe(true);
    });

    it("должен быть true после stop с сохранением и последующего reset", async () => {
      const scope = fork();

      await allSettled(events.initFromSettings, { 
        scope, 
        params: { interval: 1500, type: IntervalType.WORK } 
      });

      // Запускаем
      await allSettled(events.resume, { scope });
      expect(scope.getState($canEditTime)).toBe(false);

      // Stop с сохранением -> переход в SUCCESS
      await allSettled(events.stop, { scope, params: { save: true } });
      expect(scope.getState($countdownState)).toBe(CountdownState.SUCCESS);

      // В SUCCESS нельзя редактировать (таймер ещё не сброшен)
      expect(scope.getState($canEditTime)).toBe(false);

      // Reset после SUCCESS
      await allSettled(events.reset, { scope });

      // После reset можно снова редактировать
      expect(scope.getState($canEditTime)).toBe(true);
      expect(scope.getState($isPaused)).toBe(true);
    });

    it("setTime должен обновлять $currentInterval только когда $canEditTime=true", async () => {
      const scope = fork();

      await allSettled(events.initFromSettings, { 
        scope, 
        params: { interval: 1500, type: IntervalType.WORK } 
      });

      // До запуска - можно редактировать
      expect(scope.getState($canEditTime)).toBe(true);
      
      await allSettled(events.setTime, { scope, params: 1800 });
      
      // currentInterval должен обновиться
      expect(scope.getState($time)).toBe(1800);
      expect(scope.getState($currentInterval)).toBe(1800);
    });

    it("setTime НЕ должен обновлять $currentInterval когда таймер на паузе после запуска", async () => {
      const scope = fork();

      await allSettled(events.initFromSettings, { 
        scope, 
        params: { interval: 1500, type: IntervalType.WORK } 
      });

      // Запускаем и ставим на паузу
      await allSettled(events.resume, { scope });
      
      advanceTime(2000);
      await allSettled(events.clockInterval, { scope, params: 1000 });
      
      await allSettled(events.pause, { scope });
      
      expect(scope.getState($canEditTime)).toBe(false);
      
      const intervalBefore = scope.getState($currentInterval);
      
      // Пытаемся изменить время (это не должно менять currentInterval)
      await allSettled(events.setTime, { scope, params: 1000 });
      
      // $time изменится (setTime всегда работает)
      expect(scope.getState($time)).toBe(1000);
      // Но $currentInterval не должен измениться
      expect(scope.getState($currentInterval)).toBe(intervalBefore);
    });
  });
});
