import { useStore } from "effector-react";
import { IntervalTypeEmoji } from "../../../../entitites/countdown/constants";
import { countdownModel } from "../../../../entitites/countdown";
import { $nextStartActionPayload } from "../../model";
import { Button } from "../../../../shared/components/Button";

export const NextActionGuess = () => {
  const countdownType = useStore(countdownModel.$countdownType);
  const nextStartActionPayload = useStore($nextStartActionPayload);

  return (
    <Button
      primary
      onClick={() => {
        countdownModel.events.stop({ save: true });
        countdownModel.events.start(nextStartActionPayload);
      }}
    >
      {`${IntervalTypeEmoji[countdownType]} (${
        nextStartActionPayload.interval / 60
      } мин)`}
    </Button>
  );
};
