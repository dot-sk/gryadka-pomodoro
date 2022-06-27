import { createDomain, forward, sample } from "effector";
import connectLocalStorage from "effector-localstorage";
import { countdownModel } from "../../entitites/countdown";
import { StatEntry } from "./typings";
import { StatEntryOwnTypes } from "./constants";
import { IntervalType } from "../../entitites/countdown/constants";
import {
  isBetweenTodayAndTomorrow,
  mapStatEntriesByDate,
  mapStatEntriesByHours,
  secToMinutes,
  sumStatEntriesTime,
} from "./utils";

export const domain = createDomain();

const emptyEntry: StatEntry = {
  start: 0,
  end: 0,
  time: 0,
  interval: 0,
  type: StatEntryOwnTypes.INITIAL,
};

export const events = {
  push: domain.event<StatEntry>(),
  remove: domain.event<StatEntry>(),
  reset: domain.event<unknown>(),
};

const statEntriesLocalStorage = connectLocalStorage("$statEntriesHistory");

export const $statEntry = domain
  .createStore<StatEntry>(emptyEntry)
  .on(events.reset, () => emptyEntry);

export const $statEntriesHistory = domain
  .createStore<StatEntry[]>(statEntriesLocalStorage.init([]))
  .on(events.push, (entries, entry) => [...entries, entry])
  .on(events.remove, (entries, entry) => {
    const index = entries.findIndex((e) => e === entry);
    if (index === -1) {
      return entries;
    }
    return [...entries.slice(0, index), ...entries.slice(index + 1)];
  });

export const $statEntriesHistoryAsc = $statEntriesHistory.map((entries) =>
  entries.sort((a, b) => b.start - a.start)
);

export const $statEntriesHistoryAscByDate =
  $statEntriesHistoryAsc.map(mapStatEntriesByDate);

export const $statEntriesHistoryHoursSumByDateAsc =
  $statEntriesHistoryAscByDate.map((entries) =>
    Object.entries(entries).map(([date, entries]) => {
      const hours = mapStatEntriesByHours(entries);

      const sumByHours = Object.entries(hours).map((value) => {
        return [value[0], sumStatEntriesTime(value[1])] as const;
      });

      return [date, sumByHours] as const;
    }, {})
  );

export const $todayEntries = $statEntriesHistory.map((entries) =>
  entries.filter((entry) => isBetweenTodayAndTomorrow(entry.end))
);

export const $todayEntriesByHours = $todayEntries.map(mapStatEntriesByHours);
export const $todayEntriesByHoursSum = $todayEntriesByHours.map((entries) =>
  Object.entries(entries).map((value) => {
    return [value[0], sumStatEntriesTime(value[1])] as const;
  })
);

export const $totalToday = $todayEntries.map(sumStatEntriesTime);

export const $latestWorkEntry = domain
  .createStore<StatEntry | null>(null)
  .on(events.push, (_, entry) => {
    if (entry.type === IntervalType.WORK) {
      return entry;
    }

    return null;
  });

export const $latestRestEntry = domain
  .createStore<StatEntry | null>(null)
  .on(events.push, (_, entry) => {
    if (entry.type === IntervalType.REST) {
      return entry;
    }

    return null;
  });

$statEntry
  .on(countdownModel.events.start, (_, { interval, type }) => ({
    ...emptyEntry,
    start: Date.now(),
    type,
    interval,
  }))
  .on(countdownModel.events.end, (entry, { elapsedTime }) => {
    if (entry.type === StatEntryOwnTypes.INITIAL) {
      return entry;
    }

    return {
      ...entry,
      time: elapsedTime,
      end: Date.now(),
    };
  });

const statEntryIsCompletedEvent = sample({
  source: $statEntry,
  filter: (entry) => entry.end > 0 && entry.type !== StatEntryOwnTypes.INITIAL,
});

forward({
  from: statEntryIsCompletedEvent,
  to: [events.push, events.reset],
});

$statEntriesHistory.watch(statEntriesLocalStorage);
