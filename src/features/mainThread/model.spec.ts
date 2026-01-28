import { allSettled, fork, createStore } from "effector";
import { countdownModel } from "../../entitites/countdown";
import { events, $fontReady } from "./model";
import { createCountdownStartPayload } from "../../shared/testing";

// Мок canvas
jest.mock("../../shared/renderStringToDataURL/renderStringToDataURL", () => ({
  renderStringToDataURL: jest.fn(() => "data:image/png;base64,mock"),
}));

describe("features/mainThread/model", () => {
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

  // Хелпер для создания scope с отслеживанием render событий
  const createScopeWithRenderTracking = () => {
    const $renderCalls = createStore<Array<{ time: number; totalTime: number; isPaused: boolean; hasActiveTimer: boolean }>>([], { domain: countdownModel.domain })
      .on(events.render, (calls, payload) => [...calls, payload]);

    const scope = fork({
      values: [[$fontReady, true]],
    });

    return { scope, $renderCalls };
  };

  it("должен отсылать обновление времени в основной поток при изменении $time", async () => {
    const { scope, $renderCalls } = createScopeWithRenderTracking();

    // Начальное значение при старте
    await allSettled(countdownModel.events.start, {
      scope,
      params: createCountdownStartPayload({ interval: 3 }),
    });

    // Симулируем тики
    advanceTime(1000);
    await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

    advanceTime(1000);
    await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

    advanceTime(1000);
    await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

    // Проверяем что render event вызывался
    const renderCalls = scope.getState($renderCalls);
    expect(renderCalls.length).toBeGreaterThan(0);
  });

  describe("рендер во время паузы", () => {
    it("во время паузы НЕ должен вызывать рендер на каждый clockInterval", async () => {
      const { scope, $renderCalls } = createScopeWithRenderTracking();

      // Старт
      await allSettled(countdownModel.events.start, {
        scope,
        params: createCountdownStartPayload({ interval: 10 }),
      });

      advanceTime(2000);
      await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

      // Пауза
      await allSettled(countdownModel.events.pause, { scope });

      // Запоминаем количество вызовов до тиков во время паузы
      const callsBeforePauseTicks = scope.getState($renderCalls).length;

      // Много тиков во время паузы
      for (let i = 0; i < 5; i++) {
        advanceTime(1000);
        await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });
      }

      // Количество вызовов НЕ должно увеличиться - время в трее остаётся статичным
      const callsAfterPauseTicks = scope.getState($renderCalls).length;

      expect(callsAfterPauseTicks).toBe(callsBeforePauseTicks);
    });

    it("при нажатии паузы должен рендериться таймер (с isPaused=true)", async () => {
      const { scope, $renderCalls } = createScopeWithRenderTracking();

      await allSettled(countdownModel.events.start, {
        scope,
        params: createCountdownStartPayload({ interval: 10 }),
      });

      advanceTime(2000);
      await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

      // Очищаем историю вызовов
      const callsBeforePause = scope.getState($renderCalls).length;

      // Пауза
      await allSettled(countdownModel.events.pause, { scope });

      // Проверяем что был вызов render с isPaused=true
      const renderCalls = scope.getState($renderCalls);
      expect(renderCalls.length).toBeGreaterThan(callsBeforePause);

      const lastCall = renderCalls[renderCalls.length - 1];
      expect(lastCall.isPaused).toBe(true);
      // Время должно быть отрисовано (не скринсейвер), поэтому time должен быть актуальным
      expect(lastCall.time).toBe(7); // 10 - 1 (при старте) - 2 (advanceTime(2000))
    });
  });

  describe("progress bar", () => {
    it("должен быть 100% при старте (time=interval-1, но progress=1)", async () => {
      const { scope, $renderCalls } = createScopeWithRenderTracking();

      await allSettled(countdownModel.events.start, {
        scope,
        params: createCountdownStartPayload({ interval: 10 }),
      });

      // При старте time=9, totalTime=10
      const renderCalls = scope.getState($renderCalls);
      expect(renderCalls.length).toBeGreaterThan(0);

      const firstCall = renderCalls[0];
      expect(firstCall.time).toBe(9);
      expect(firstCall.totalTime).toBe(10);
      // progress вычисляется как (time + 1) / totalTime = (9 + 1) / 10 = 1.0
    });

    it("должен уменьшаться с каждой секундой", async () => {
      const { scope, $renderCalls } = createScopeWithRenderTracking();

      await allSettled(countdownModel.events.start, {
        scope,
        params: createCountdownStartPayload({ interval: 10 }),
      });

      advanceTime(1000);
      await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

      // time=8, totalTime=10, progress = (8+1)/10 = 0.9
      const renderCalls = scope.getState($renderCalls);
      const lastCall = renderCalls[renderCalls.length - 1];

      expect(lastCall.time).toBe(8);
      expect(lastCall.totalTime).toBe(10);
      // progress вычисляется как (time + 1) / totalTime = (8 + 1) / 10 = 0.9
    });
  });

  describe("рендер анимации помидорки", () => {
    it("должен рендерить анимацию каждую секунду когда таймер не активен (!hasActiveTimer)", async () => {
      const { scope, $renderCalls } = createScopeWithRenderTracking();

      // Инициализируем из настроек (но не стартуем таймер)
      await allSettled(countdownModel.events.initFromSettings, {
        scope,
        params: 1500,
      });

      const callsAfterInit = scope.getState($renderCalls).length;

      // Симулируем 3 тика часов (анимация должна обновляться)
      for (let i = 0; i < 3; i++) {
        advanceTime(1000);
        await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });
      }

      const renderCalls = scope.getState($renderCalls);

      // Должно быть: callsAfterInit + 3 (clockInterval)
      expect(renderCalls.length).toBe(callsAfterInit + 3);

      // Все вызовы должны иметь hasActiveTimer=false
      const animationCalls = renderCalls.slice(-3);
      animationCalls.forEach(call => {
        expect(call.hasActiveTimer).toBe(false);
      });
    });

    it("должен остановить анимацию когда таймер запускается (hasActiveTimer=true)", async () => {
      const { scope, $renderCalls } = createScopeWithRenderTracking();

      // Инициализируем
      await allSettled(countdownModel.events.initFromSettings, {
        scope,
        params: 1500,
      });

      // Тик анимации (должен рендериться)
      advanceTime(1000);
      await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

      // Запускаем таймер
      await allSettled(countdownModel.events.start, {
        scope,
        params: createCountdownStartPayload({ interval: 1500 }),
      });

      // После старта hasActiveTimer должен стать true
      const callsAfterStart = scope.getState($renderCalls);
      const startCall = callsAfterStart[callsAfterStart.length - 1];
      expect(startCall.hasActiveTimer).toBe(true);

      // Тики часов больше НЕ должны вызывать рендер (таймер активен)
      const callsAfterStartCount = callsAfterStart.length;

      for (let i = 0; i < 3; i++) {
        advanceTime(1000);
        await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });
      }

      // Рендер вызывается, но не на каждый clockInterval, а только при изменении $time
      const finalCalls = scope.getState($renderCalls);
      expect(finalCalls.length).toBeGreaterThan(callsAfterStartCount);

      // Все вызовы после старта должны иметь hasActiveTimer=true
      const timerCalls = finalCalls.slice(callsAfterStartCount);
      timerCalls.forEach(call => {
        expect(call.hasActiveTimer).toBe(true);
      });
    });

    it("должен возобновить анимацию после reset таймера", async () => {
      const { scope, $renderCalls } = createScopeWithRenderTracking();

      // Запускаем таймер
      await allSettled(countdownModel.events.start, {
        scope,
        params: createCountdownStartPayload({ interval: 1500 }),
      });

      // Сбрасываем
      await allSettled(countdownModel.events.reset, { scope });

      const callsAfterReset = scope.getState($renderCalls).length;

      // Тик анимации (должен рендериться снова)
      advanceTime(1000);
      await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

      const renderCalls = scope.getState($renderCalls);
      expect(renderCalls.length).toBe(callsAfterReset + 1);

      const lastCall = renderCalls[renderCalls.length - 1];
      expect(lastCall.hasActiveTimer).toBe(false);
    });

    it("должен рендерить анимацию когда шрифты загружены", async () => {
      const scope = fork({
        values: [[$fontReady, false]], // Шрифты еще не готовы
      });

      const $renderCalls = createStore<Array<{
        time: number;
        totalTime: number;
        isPaused: boolean;
        hasActiveTimer: boolean;
      }>>([], { domain: countdownModel.domain })
        .on(events.render, (calls, payload) => [...calls, payload]);

      // Инициализируем (но шрифты не готовы - не должно быть рендера)
      await allSettled(countdownModel.events.initFromSettings, {
        scope,
        params: 1500,
      });

      expect(scope.getState($renderCalls).length).toBe(0);

      // Шрифты загрузились
      await allSettled(events.setFontsReady, { scope, params: true });

      // Должен быть рендер
      const renderCalls = scope.getState($renderCalls);
      expect(renderCalls.length).toBe(1);
      expect(renderCalls[0].hasActiveTimer).toBe(false);
    });
  });
});
