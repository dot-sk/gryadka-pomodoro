import { useStore } from "effector-react";
import { $statEntriesHistoryAscByDate, events } from "../model";
import { formatSeconds, formatTime } from "../../../shared/utils";
import { IntervalType } from "../../../entitites/countdown/constants";
import { sumStatEntriesTime } from "../utils";

const TYPE_TRANSLATION = {
  [IntervalType.INITIAL]: "",
  [IntervalType.WORK]: "Работа",
  [IntervalType.REST]: "Отдых",
};

type StatsListProps = {
  className?: string;
};
export const ListStatByDate = ({ className = "" }: StatsListProps) => {
  const entriesByDate = useStore($statEntriesHistoryAscByDate);

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {Object.entries(entriesByDate).map(([date, entries]) => (
        <div key={date} className="flex flex-col space-y-2">
          <div className="flex flex-col space-y-2">
            <span className="text-gray-600">
              {`${date}, Σ ${formatSeconds(sumStatEntriesTime(entries))}`}
            </span>
            <span>
              {entries.map((entry, i) => {
                const { start, end, time, type } = entry;

                return (
                  <div
                    key={`${start}-${end}-${i}`}
                    className="relative grid grid-cols-3"
                  >
                    <span>{formatTime(start)}</span>
                    <span>{TYPE_TRANSLATION[type]}</span>
                    <span>{formatSeconds(time)}</span>
                    <span className="absolute right-0">
                      <button onClick={() => events.remove(entry)}>
                        &times;
                      </button>
                    </span>
                  </div>
                );
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
