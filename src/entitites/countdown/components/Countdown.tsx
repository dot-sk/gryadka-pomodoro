import { useStore } from "effector-react";
import { formatTime } from "../../../shared/utils";
import { $time, $currentInterval } from "../model";
import { CircleProgress } from "../../../shared/components/CircleProgress";

// A component that displays a timeControls timer.
export const Countdown = () => {
  const time = useStore($time);
  const currentInterval = useStore($currentInterval) || 1;
  const progress = time / currentInterval;

  return <div className="font-mono text-5xl">{formatTime(time)}</div>;
};
