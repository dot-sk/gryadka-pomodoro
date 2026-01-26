import { ipcWorld } from "../../shared/ipcWorld/ipcWorld";
import { allSettled, fork } from "effector";
import { countdownModel } from "../../entitites/countdown";
import { IntervalType } from "../../entitites/countdown/constants";
import { IpcChannels } from "../../shared/ipcWorld/constants";

// Мок canvas
jest.mock("../../shared/renderStringToDataURL/renderStringToDataURL", () => ({
  renderStringToDataURL: jest.fn(() => "data:image/png;base64,mock"),
}));

import { renderStringToDataURL } from "../../shared/renderStringToDataURL/renderStringToDataURL";
import "./model";

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

  it("должен отсылать обновление времени в основной поток при изменении $time", async () => {
    const spy = jest.spyOn(ipcWorld, "send");

    const scope = fork(countdownModel.domain);

    // Начальное значение при старте
    await allSettled(countdownModel.events.start, {
      scope,
      params: { interval: 3, type: IntervalType.WORK },
    });

    // Симулируем тики
    advanceTime(1000);
    await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

    advanceTime(1000);
    await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

    advanceTime(1000);
    await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

    // Проверяем что IPC вызывался с правильным каналом
    expect(spy).toHaveBeenCalledWith(
      IpcChannels["countdown-tick-as-image"],
      expect.any(String)
    );

    spy.mockRestore();
  });

  describe("рендер во время паузы", () => {
    it("во время паузы clockInterval НЕ должен вызывать рендер", async () => {
      const spy = jest.spyOn(ipcWorld, "send");

      const scope = fork(countdownModel.domain);

      // Старт
      await allSettled(countdownModel.events.start, {
        scope,
        params: { interval: 10, type: IntervalType.WORK },
      });

      advanceTime(2000);
      await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

      // Пауза
      await allSettled(countdownModel.events.pause, { scope });

      // Запоминаем количество вызовов до тиков во время паузы
      const callsBeforePauseTicks = spy.mock.calls.length;

      // Много тиков во время паузы
      for (let i = 0; i < 5; i++) {
        advanceTime(1000);
        await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });
      }

      // Количество вызовов НЕ должно увеличиться (clockInterval не должен триггерить рендер на паузе)
      const callsAfterPauseTicks = spy.mock.calls.length;

      expect(callsAfterPauseTicks).toBe(callsBeforePauseTicks);

      spy.mockRestore();
    });

    it("при нажатии паузы должен рендериться таймер, а не скринсейвер", async () => {
      const scope = fork(countdownModel.domain);

      await allSettled(countdownModel.events.start, {
        scope,
        params: { interval: 10, type: IntervalType.WORK },
      });

      advanceTime(2000);
      await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

      (renderStringToDataURL as jest.Mock).mockClear();

      // Пауза
      await allSettled(countdownModel.events.pause, { scope });

      // renderStringToDataURL вызван с isPaused=false (4-й аргумент)
      // потому что isInitial=false на паузе
      expect(renderStringToDataURL).toHaveBeenCalled();
      const lastCall = (renderStringToDataURL as jest.Mock).mock.calls.at(-1);
      expect(lastCall[3]).toBe(false); // isPaused/isInitial = false
    });
  });

  describe("progress bar", () => {
    it("должен быть 100% при старте (time=interval-1, но progress=1)", async () => {
      const scope = fork(countdownModel.domain);
      (renderStringToDataURL as jest.Mock).mockClear();

      await allSettled(countdownModel.events.start, {
        scope,
        params: { interval: 10, type: IntervalType.WORK },
      });

      // При старте time=9, totalTime=10, но progress должен быть 1.0
      const lastCall = (renderStringToDataURL as jest.Mock).mock.calls.at(-1);
      const progress = lastCall[4]; // 5-й аргумент — progress
      expect(progress).toBe(1);
    });

    it("должен уменьшаться с каждой секундой", async () => {
      const scope = fork(countdownModel.domain);
      (renderStringToDataURL as jest.Mock).mockClear();

      await allSettled(countdownModel.events.start, {
        scope,
        params: { interval: 10, type: IntervalType.WORK },
      });

      advanceTime(1000);
      await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });

      // time=8, progress = (8+1)/10 = 0.9
      const lastCall = (renderStringToDataURL as jest.Mock).mock.calls.at(-1);
      const progress = lastCall[4];
      expect(progress).toBe(0.9);
    });
  });
});
