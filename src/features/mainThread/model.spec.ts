import { ipc } from "../../shared/ipc/ipc";
import { allSettled, fork } from "effector";
import { countdownModel } from "../../entitites/countdown";
import { wait } from "../../shared/utils";
import "./model";
import { IntervalType } from "../../entitites/countdown/constants";

describe("features/mainThread/model", () => {
  it("должен отсылать каждое обновление времени в основной поток", async () => {
    const spy = jest.spyOn(ipc, "send");

    const scope = fork(countdownModel.domain, {
      handlers: [[countdownModel.effects.tickEffect, () => wait(100)]],
    });

    await allSettled(countdownModel.events.start, {
      scope,
      params: { interval: 5, type: IntervalType.WORK },
    });
    // ожидаем 7, а не 5, т.к.
    // +1 обновление при создании стора
    // и +1 в конце - время установится в значение интервала, который закончился
    expect(spy).toHaveBeenCalledTimes(7);
    spy.mockRestore();
  });
});
