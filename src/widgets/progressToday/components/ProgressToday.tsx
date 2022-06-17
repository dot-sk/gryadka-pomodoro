import { Countdown, countdownModel } from "../../../entitites/countdown";
import { CircleProgress } from "../../../shared/components/CircleProgress";
import { useStore } from "effector-react";
import { statsModel } from "../../../features/stats";
import { useEffect, useRef, useState } from "react";

const HOUR_SEC = 60 * 60;
const TARGET_DURATION_PER_DAY_SECONDS = HOUR_SEC * 8;

export const ProgressToday = () => {
  const [animate, setAnimate] = useState(true);

  const time = useStore(countdownModel.$time);
  const prevTime = useRef(time);
  const currentInterval = useStore(countdownModel.$currentInterval) || 1;
  const totalToday = useStore(statsModel.$totalToday);
  const progress = time / currentInterval;

  const dailyProgress = totalToday / TARGET_DURATION_PER_DAY_SECONDS;

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
      <div className="relative z-[2] text-white">
        <Countdown />
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[270px] h-[270px] rounded-full bg-[#E95139]" />

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <CircleProgress
          progress={dailyProgress}
          radius={165}
          strokeWidth={20}
          strokeColor="#E95139"
          shadowOpacity={0.2}
          shadowColor="#E95139"
        />
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <CircleProgress
          progress={progress}
          radius={145}
          strokeWidth={20}
          strokeColor="#C2E25D"
          shadowOpacity={0.2}
          shadowColor="#FFFFFF"
          inverse={true}
          animate={animate}
        />
      </div>
    </div>
  );
};
