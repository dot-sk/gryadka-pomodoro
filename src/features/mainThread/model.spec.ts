import { ipcWorld } from "../../shared/ipcWorld/ipcWorld";
import { allSettled, fork } from "effector";
import { countdownModel } from "../../entitites/countdown";
import { wait } from "../../shared/utils";
import { IntervalType } from "../../entitites/countdown/constants";
import { IpcChannels } from "../../shared/ipcWorld/constants";
import "./model";

describe("features/mainThread/model", () => {
  it("должен отсылать каждое обновление времени в основной поток", async () => {
    const spy = jest.spyOn(ipcWorld, "send");

    const scope = fork(countdownModel.domain, {
      handlers: [[countdownModel.effects.tickEffect, () => wait(100)]],
    });

    await allSettled(countdownModel.events.start, {
      scope,
      params: { interval: 5, type: IntervalType.WORK },
    });
    // ожидаем 6, а не 5, т.к.
    // +1 обновление при создании стора
    expect(spy).toHaveBeenCalledTimes(6);
    expect(spy).toHaveBeenCalledWith(
      IpcChannels["countdown-tick-as-image"],
      expect.any(String)
    );
    spy.mockRestore();
  });
});
