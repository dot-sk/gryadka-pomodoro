import { split, EventPayload, combine } from "effector";
import { statsModel } from "../../features/stats";
import { countdownModel } from "../../entitites/countdown";
import { IntervalType } from "../../entitites/countdown/constants";

export const events = {
  togglePlay:
    countdownModel.domain.event<
      EventPayload<typeof countdownModel.events.start>
    >(),
};

export const $nextStartActionPayload = combine(
  countdownModel.$countdownType,
  statsModel.$latestWorkEntry,
  statsModel.$latestRestEntry,
  (countdownType, latestWorkEntry, latestRestEntry) => {
    const FIVE_MINUTES = 60 * 5;
    const guessedIntervals = {
      [IntervalType.WORK]: latestWorkEntry?.interval ?? FIVE_MINUTES,
      [IntervalType.REST]: latestRestEntry?.interval ?? FIVE_MINUTES,
    };
    const oppositeIntervalType =
      countdownType === IntervalType.WORK
        ? IntervalType.REST
        : IntervalType.WORK;

    return {
      type: oppositeIntervalType,
      interval: guessedIntervals[oppositeIntervalType],
    };
  }
);

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
