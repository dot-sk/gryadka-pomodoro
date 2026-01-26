import { ipcWorld } from "../../shared/ipcWorld/ipcWorld";
import { allSettled, fork } from "effector";
import { countdownModel } from "../../entitites/countdown";
import { IntervalType } from "../../entitites/countdown/constants";
import { IpcChannels } from "../../shared/ipcWorld/constants";
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
});
