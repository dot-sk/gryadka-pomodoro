import { useStore } from "effector-react";
import { countdownModel } from "../../../../entitites/countdown";
import { events } from "../../model";
import { IntervalType } from "../../../../entitites/countdown/constants";

export const PlayPauseButton = () => {
  const isRunning = useStore(countdownModel.$isRunning);

  return (
    <button
      className="rounded-full bg-black py-2 px-3 text-white w-48 shadow-lg"
      onClick={() =>
        events.togglePlay({
          interval: 60 * 20,
          type: IntervalType.WORK,
        })
      }
    >
      {isRunning ? "Pause" : "Start"}
    </button>
  );
};
