import { countdownModel } from "../../entitites/countdown";
import { split, EventPayload } from "effector";

export const events = {
  togglePlay:
    countdownModel.domain.event<
      EventPayload<typeof countdownModel.events.start>
    >(),
};

split({
  source: events.togglePlay,
  match: {
    start: countdownModel.$isInitial,
    resume: countdownModel.$isPaused,
    pause: countdownModel.$isRunning,
  },
  cases: {
    start: countdownModel.events.start,
    resume: countdownModel.events.resume,
    pause: countdownModel.events.pause,
  },
});
