import { countdownModel } from "../../../../entitites/countdown";
import { Button } from "../../../../shared/components/Button";

export const StopButton = () => {
  return (
    <Button onClick={() => countdownModel.events.stop({ save: true })}>
      Стоп
    </Button>
  );
};
