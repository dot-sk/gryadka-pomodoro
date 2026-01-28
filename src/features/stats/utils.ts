// function maps array of StatEntries by start date to object with keys as dates formatted as DD/MM/YYYY
import { StatEntry } from "./typings";
import { formatSecondsDate } from "../../shared/utils";

export function mapStatEntriesByDate(
  statEntries: StatEntry[]
): Record<string, StatEntry[]> {
  const result: Record<string, StatEntry[]> = {};

  for (const entry of statEntries) {
    const date = formatSecondsDate(entry.start / 1000);
    if (!result[date]) {
      result[date] = [];
    }
    result[date].push(entry);
  }

  return result;
}

export function sumStatEntriesTime(statEntries: StatEntry[]): number {
  return statEntries.reduce((acc, entry) => acc + entry.time, 0);
}

function getTodayMidnight(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getTomorrowMidnight(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

export function isBetweenTodayAndTomorrow(timestamp: number): boolean {
  return (
    timestamp >= getTodayMidnight().getTime() &&
    timestamp < getTomorrowMidnight().getTime()
  );
}

export type HeatmapDayData = {
  date: Date;
  dateStr: string;
  totalSeconds: number;
  weekIndex: number;
  dayOfWeek: number;
};

const DAYS_PER_WEEK = 7;

function getDayOfWeekMondayBased(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function generateHeatmapDays(numberOfWeeks: number): HeatmapDayData[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayDayOfWeek = getDayOfWeekMondayBased(today);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - todayDayOfWeek - (numberOfWeeks - 1) * DAYS_PER_WEEK);

  const totalDays = numberOfWeeks * DAYS_PER_WEEK;

  return Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    return {
      date,
      dateStr: formatSecondsDate(date.getTime() / 1000),
      totalSeconds: 0,
      weekIndex: Math.floor(i / DAYS_PER_WEEK),
      dayOfWeek: getDayOfWeekMondayBased(date),
    };
  });
}

export function fillHeatmapWithStats(
  heatmapDays: HeatmapDayData[],
  statEntries: StatEntry[]
): HeatmapDayData[] {
  const statsByDate = mapStatEntriesByDate(statEntries);

  return heatmapDays.map((day) => ({
    ...day,
    totalSeconds: sumStatEntriesTime(statsByDate[day.dateStr] || []),
  }));
}
