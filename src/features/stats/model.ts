import { combine, createDomain, forward, sample, split } from "effector";
import connectLocalStorage from "effector-localstorage";
import { countdownModel } from "../../entitites/countdown";
import { StatEntry } from "./typings";
import { StatEntryOwnTypes } from "./constants";
import { IntervalType } from "../../entitites/countdown/constants";
import { formatSecondsDate } from "../../shared/utils";

// function maps array of StatEntries by start date to object with keys as dates formatted as DD/MM/YYYY
function mapStatEntriesByDate(statEntries: StatEntry[]) {
  const result: { [key: string]: StatEntry[] } = {};

  statEntries.forEach((entry) => {
    const date = formatSecondsDate(entry.start / 1000);
    if (!result[date]) {
      result[date] = [];
    }
    result[date].push(entry);
  });

  return result;
}

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

// a function that returns tomorrow's date
const getTomorrow = () =>
  new Date(new Date().setDate(new Date().getDate() + 1));

// функция определяет, что дата между сегодня 6 утра и завтра 6 утра
const isBetweenTodayAndTomorrow = (date: number) =>
  date >= new Date().setHours(0, 0, 0, 0) &&
  date < getTomorrow().setHours(0, 0, 0, 0);

export const $totalToday = combine($statEntriesHistory, (entries) => {
  return entries.reduce((acc, entry) => {
    if (isBetweenTodayAndTomorrow(entry.end)) {
      return acc + entry.time;
    }

    return acc;
  }, 0);
});

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
