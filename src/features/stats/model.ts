import { combine, createDomain, forward, sample, split } from "effector";
import connectLocalStorage from "effector-localstorage";
import { countdownModel } from "../../entitites/countdown";
import { StatEntry } from "./typings";
import { StatEntryOwnTypes } from "./constants";

export const domain = createDomain();

const emptyEntry: StatEntry = {
  start: 0,
  end: 0,
  time: 0,
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

$statEntry
  .on(countdownModel.events.start, (_, { interval, type }) => ({
    ...emptyEntry,
    start: Date.now(),
    type,
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
