import { createDomain, sample } from "effector";
import { countdownModel } from "../../entitites/countdown";
import { StatEntry } from "./typings";
import {
  isBetweenTodayAndTomorrow,
  mapStatEntriesByDate,
  sumStatEntriesTime,
  generateHeatmapDays,
  fillHeatmapWithStats,
} from "./utils";
import {
  connectElectronStore,
  loadFromElectronStore,
} from "../../shared/lib/effector-electron-store";

export const domain = createDomain();

const emptyEntry: StatEntry = {
  start: 0,
  end: 0,
  time: 0,
  interval: 0,
};

export const events = {
  push: domain.event<StatEntry>(),
  remove: domain.event<StatEntry>(),
  reset: domain.event<unknown>(),
  loadHistory: domain.event<StatEntry[]>(),
};

const statEntriesStore = connectElectronStore<StatEntry[]>("statEntriesHistory");

export const $statEntry = domain
  .createStore<StatEntry>(emptyEntry)
  .on(events.reset, () => emptyEntry);

export const $statEntriesHistory = domain
  .createStore<StatEntry[]>(statEntriesStore.init([]))
  .on(events.loadHistory, (_, entries) => entries)
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

// Селектор для тепловой карты (последние 18 недель - компактный размер под окно)
export const $statEntriesByDayForHeatmap = $statEntriesHistory.map(
  (entries) => {
    const heatmapDays = generateHeatmapDays(18);
    return fillHeatmapWithStats(heatmapDays, entries);
  }
);

export const $todayEntries = $statEntriesHistory.map((entries) =>
  entries.filter((entry) => isBetweenTodayAndTomorrow(entry.end))
);

export const $totalToday = $todayEntries.map(sumStatEntriesTime);

$statEntry
  .on(countdownModel.events.start, (_, { interval }) => ({
    ...emptyEntry,
    start: Date.now(),
    interval,
  }))
  .on(countdownModel.events.end, (entry, { elapsedTime }) => {
    if (entry.start === 0) {
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
  filter: (entry) => entry.end > 0 && entry.start > 0,
});

sample({
  clock: statEntryIsCompletedEvent,
  target: [events.push, events.reset],
});

// Подписка на изменения для сохранения в electron-store
statEntriesStore.subscribe($statEntriesHistory);

// Загрузка данных при старте
loadFromElectronStore("statEntriesHistory", []).then((data) => {
  events.loadHistory(data);
});
