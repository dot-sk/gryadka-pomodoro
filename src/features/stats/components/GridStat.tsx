import { useStore } from "effector-react";
import {
  $statEntriesHistoryHoursSumByDateAsc,
  $todayEntriesByHoursSum,
} from "../model";
import {
  LinearProgress,
  LinearProgressDirection,
} from "../../../shared/components/LinearProgress";
import range from "@tinkoff/utils/array/range";
import { formatSeconds } from "../../../shared/utils";
import { secToMinutes } from "../utils";

type GridStatProps = {
  entries: (readonly [string, number])[];
  xMin?: number;
  xMax: number;
  yMin?: number;
  yMax: number;
  xSteps: number;
  ySteps: number;
};

export const GridStatPure = ({
  entries,
  xMin = 0,
  xMax,
  yMin = 0,
  yMax,
  xSteps,
  ySteps,
}: GridStatProps) => {
  return (
    <div className="relative w-full h-[150px] mb-6 border">
      {range(yMin, yMax, Math.floor(yMax / ySteps))
        .map((val) => [val, `${(val / yMax) * 100}%`])
        .map(([val, bottom]) => (
          <>
            <div
              className="absolute w-full h-[1px] bg-gray-200"
              style={{ bottom }}
            />
            <div
              className="absolute font-mono text-gray-500 right-0 transform translate-x-full"
              style={{ bottom }}
            >
              {val}
            </div>
          </>
        ))}

      {range(xMin, xMax, Math.floor(xMax / xSteps))
        .map((val) => [val, `${(val / xMax) * 100}%`])
        .map(([val, left]) => (
          <>
            <div
              className="absolute w-[1px] h-full bg-gray-200"
              style={{ left }}
            />
            <div
              className="absolute font-mono text-gray-500 bottom-0 transform translate-y-full"
              style={{ left }}
            >
              {val}
            </div>
          </>
        ))}

      {entries.map(([hours, timeSum]) => {
        const minutesSum = secToMinutes(timeSum);
        return (
          <div
            className="absolute bottom-0 h-full"
            style={{
              left: `${(parseInt(hours) / xMax) * 100}%`,
              height: `${(minutesSum / yMax) * 100}%`,
            }}
          >
            <LinearProgress
              direction={LinearProgressDirection.VERTICAL}
              max={timeSum}
              value={timeSum}
            />
          </div>
        );
      })}
    </div>
  );
};

export const GridStatHoursToday = () => {
  const sumByHours = useStore($todayEntriesByHoursSum);

  return (
    <GridStatPure
      entries={sumByHours}
      xMax={24}
      yMax={60}
      xSteps={4}
      ySteps={3}
    />
  );
};

export const GridStatSumHoursByDate = () => {
  const sumByHoursByDate = useStore($statEntriesHistoryHoursSumByDateAsc);

  return (
    <div>
      {sumByHoursByDate.map(([date, sumByHours]) => {
        return (
          <div>
            <div>{`${date}, Σ ${formatSeconds(
              sumByHours.reduce((acc, [_, sum]) => acc + sum, 0),
              { omitEmpty: false }
            )}`}</div>
            <div>
              <GridStatPure
                entries={sumByHours}
                xMax={24}
                yMax={60}
                xSteps={4}
                ySteps={3}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
