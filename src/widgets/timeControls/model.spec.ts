import { allSettled, fork } from "effector";
import { countdownModel } from "../../entitites/countdown";
import { events } from "./model";
import { wait } from "../../shared/utils";
import { IntervalType } from "../../entitites/countdown/constants";

jest.useRealTimers();

const START_PARAMS = { interval: 10, type: IntervalType.WORK };

describe("features/timeControls/model", () => {
  it("должен переключать между play/pause", async () => {
    const scope = fork(countdownModel.domain, {
      // @ts-ignore
      handlers: [[countdownModel.effects.tickEffect, () => wait(100)]],
    });

    // start
    allSettled(events.togglePlay, { scope, params: START_PARAMS });
    await wait(200);
    // pause
    allSettled(events.togglePlay, { scope, params: START_PARAMS });
    await wait(200);
    // start
    allSettled(events.togglePlay, { scope, params: START_PARAMS });
    await wait(200);
    // pause
    allSettled(events.togglePlay, { scope, params: START_PARAMS });
    await wait(200);

    expect(scope.getState(countdownModel.$time)).toBe(6);
  });
});
