import { useStore } from "effector-react";
import { countdownModel } from "../../../../entitites/countdown";
import { events } from "../../model";
import { IntervalType } from "../../../../entitites/countdown/constants";
import { Button } from "../../../../shared/components/Button";

export const PlayPauseButton = () => {
  const isRunning = useStore(countdownModel.$isRunning);

  return (
    <Button
      primary
      onClick={() =>
        events.togglePlay({
          interval: 60 * 20,
          type: IntervalType.WORK,
        })
      }
    >
      {isRunning ? "Пауза" : "Старт"}
    </Button>
  );
};
