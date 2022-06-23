import { Countdown, countdownModel } from "../../../entitites/countdown";
import { CircleProgress } from "../../../shared/components/CircleProgress";
import { useStore } from "effector-react";
import { statsModel } from "../../../features/stats";
import { useEffect, useRef, useState } from "react";
import css from "./ProgressToday.module.css";
import { LineProgress } from "../../../shared/components/LineProgress";
import { settingsModel } from "../../../entitites/settings";

export const ProgressToday = () => {
  const [animate, setAnimate] = useState(true);

  const dailyGoal = useStore(settingsModel.$dailyGoalSeconds);
  const time = useStore(countdownModel.$time);
  const prevTime = useRef(time);
  const currentInterval = useStore(countdownModel.$currentInterval) || 1;
  const totalToday = useStore(statsModel.$totalToday);
  const progress = time / currentInterval;

  useEffect(() => {
    // if time is greater than prevTime, then we don't need to animate
    if (time > prevTime.current) {
      setAnimate(false);
    }

    // if time is less than prevTime and animate is false, then we need to animate
    if (time < prevTime.current && !animate) {
      setAnimate(true);
    }

    prevTime.current = time;
  }, [time]);

  return (
    <div className="relative flex justify-center items-center w-[330px] h-[330px]">
      <div className="relative z-[2]">
        <Countdown />
      </div>

      <div className="absolute z-10 w-12 bottom-0 left-1/2 transform -translate-x-1/2">
        <LineProgress value={totalToday} max={dailyGoal} />
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <CircleProgress
          progress={progress}
          radius={145}
          strokeWidth={20}
          inverse={true}
          animate={animate}
          className={css.progressRing}
        />
      </div>
    </div>
  );
};
