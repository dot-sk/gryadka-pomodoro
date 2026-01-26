import { allSettled, fork } from "effector";
import { countdownModel } from "../../entitites/countdown";
import { events } from "./model";
import { IntervalType } from "../../entitites/countdown/constants";

const START_PARAMS = { interval: 10, type: IntervalType.WORK };

describe("features/timeControls/model", () => {
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

  it("должен переключать между play/pause", async () => {
    const scope = fork(countdownModel.domain);

    // start: time=9 (interval-1)
    await allSettled(events.togglePlay, { scope, params: START_PARAMS });
    advanceTime(2000);
    await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });
    expect(scope.getState(countdownModel.$time)).toBe(7); // 9 - 2

    // pause
    await allSettled(events.togglePlay, { scope, params: START_PARAMS });
    advanceTime(2000);
    await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });
    // время не должно измениться
    expect(scope.getState(countdownModel.$time)).toBe(7);

    // resume
    await allSettled(events.togglePlay, { scope, params: START_PARAMS });
    advanceTime(2000);
    await allSettled(countdownModel.events.clockInterval, { scope, params: 1000 });
    expect(scope.getState(countdownModel.$time)).toBe(5); // 7 - 2

    // pause
    await allSettled(events.togglePlay, { scope, params: START_PARAMS });
    expect(scope.getState(countdownModel.$time)).toBe(5);
  });
});
