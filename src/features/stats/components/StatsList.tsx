import { useStore } from "effector-react";
import { $statEntriesHistoryAscByDate, events } from "../model";
import { formatSeconds, formatTime } from "../../../shared/utils";
import { IntervalType } from "../../../entitites/countdown/constants";
import { StatEntry } from "../typings";

const TYPE_TRANSLATION = {
  [IntervalType.INITIAL]: "",
  [IntervalType.WORK]: "Работа",
  [IntervalType.REST]: "Отдых",
};

// function sums up all time properties of StatEntries
function sumStatEntriesTime(statEntries: StatEntry[]) {
  return statEntries.reduce((acc, entry) => acc + entry.time, 0);
}

export const StatsList = () => {
  const entriesByDate = useStore($statEntriesHistoryAscByDate);

  return (
    <div className="flex flex-col space-y-2">
      {Object.entries(entriesByDate).map(([date, entries]) => (
        <div key={date} className="flex flex-col space-y-2">
          <div className="flex flex-col space-y-2">
            <span className="text-gray-600">
              {`${date}, Σ ${formatSeconds(sumStatEntriesTime(entries))}`}
            </span>
            <span>
              {entries.map((entry) => {
                const { start, end, time, type } = entry;

                return (
                  <div
                    key={`${start}-${end}`}
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
