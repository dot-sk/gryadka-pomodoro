// function maps array of StatEntries by start date to object with keys as dates formatted as DD/MM/YYYY
import { StatEntry } from "./typings";
import { formatSeconds, formatSecondsDate } from "../../shared/utils";

export function mapStatEntriesByDate(statEntries: StatEntry[]) {
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

export function mapStatEntriesByHours(statEntries: StatEntry[]) {
  const result: { [key: string]: StatEntry[] } = {};

  statEntries.forEach((entry) => {
    const date = new Date((entry.start / 1000) * 1000);
    const hours = date.getHours();

    if (!result[hours]) {
      result[hours] = [];
    }
    result[hours].push(entry);
  });

  return result;
}

export function sumStatEntriesTime(statEntries: StatEntry[]) {
  return statEntries.reduce((acc, entry) => acc + entry.time, 0);
}

export const secToMinutes = (seconds: number) => seconds / 60;

// функция возвращает дату завтра
export const getTomorrow = () =>
  new Date(new Date().setDate(new Date().getDate() + 1));

// функция определяет, что дата между сегодня 0 часов и завтра 0 часов
export const isBetweenTodayAndTomorrow = (date: number) =>
  date >= new Date().setHours(0, 0, 0, 0) &&
  date < getTomorrow().setHours(0, 0, 0, 0);
