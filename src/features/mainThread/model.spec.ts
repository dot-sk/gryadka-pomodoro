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
    const $renderCalls = createStore<Array<{ time: number; totalTime: number; isPaused: boolean }>>([], { domain: countdownModel.domain })
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
});
