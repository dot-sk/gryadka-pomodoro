import { useStore } from "effector-react";
import { formatSeconds } from "../../../shared/utils";
import { $countdownType, $time } from "../model";
import { IntervalTypeEmoji } from "../constants";

export const Countdown = () => {
  const time = useStore($time);
  const type = useStore($countdownType);

  return (
    <div className="font-mono text-5xl relative">
      {formatSeconds(time)}

      <span className="absolute top-[-35px] left-1/2 transform -translate-x-1/2 text-2xl">
        {IntervalTypeEmoji[type]}
      </span>
    </div>
  );
};
