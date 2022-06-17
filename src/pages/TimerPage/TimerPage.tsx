import { TimeControls } from "../../features/timeControls";
import { ProgressToday } from "../../widgets/progressToday";
import { useStore } from "effector-react";
import { countdownModel } from "../../entitites/countdown";
import { IntervalType } from "../../entitites/countdown/constants";
import { minToSec } from "../../shared/utils";

const Countdown = () => {
  return (
    <>
      <ProgressToday />
      <div className="mt-12">
        <TimeControls />
      </div>
    </>
  );
};

const INTERVALS_WORK = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
const INTERVALS_REST = [5, 10, 15, 20, 25, 30, 60];

const IntervalSelector = () => {
  return (
    <div>
      <div>
        <p className="font-sansWide text-2xl">Интервал работы:</p>
        <div className="flex flex-wrap mt-2">
          {INTERVALS_WORK.map((interval) => {
            return (
              <button
                key={interval}
                className="rounded-full bg-black py-2 px-3 text-white shadow-lg mb-2 mr-2"
                onClick={() =>
                  countdownModel.events.start({
                    type: IntervalType.WORK,
                    interval: minToSec(interval),
                  })
                }
              >
                {`${interval} мин`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <p className="font-sansWide text-2xl">Интервал отдыха:</p>
        <div className="flex flex-wrap mt-2">
          {INTERVALS_REST.map((interval) => {
            return (
              <button
                key={interval}
                className="rounded-full bg-black py-2 px-3 text-white shadow-lg mb-2 mr-2"
                onClick={() =>
                  countdownModel.events.start({
                    type: IntervalType.REST,
                    interval: minToSec(interval),
                  })
                }
              >
                {`${interval} мин`}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const TimerPage = () => {
  const isInitial = useStore(countdownModel.$isInitial);

  return (
    <div className="py-12">
      {isInitial ? <IntervalSelector /> : <Countdown />}
    </div>
  );
};
