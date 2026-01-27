// function maps array of StatEntries by start date to object with keys as dates formatted as DD/MM/YYYY
import { StatEntry } from "./typings";
import { formatSecondsDate } from "../../shared/utils";

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

export function sumStatEntriesTime(statEntries: StatEntry[]) {
  return statEntries.reduce((acc, entry) => acc + entry.time, 0);
}

// функция возвращает дату завтра
export const getTomorrow = () =>
  new Date(new Date().setDate(new Date().getDate() + 1));

// функция определяет, что дата между сегодня 0 часов и завтра 0 часов
export const isBetweenTodayAndTomorrow = (date: number) =>
  date >= new Date().setHours(0, 0, 0, 0) &&
  date < getTomorrow().setHours(0, 0, 0, 0);

// Типы для тепловой карты
export type HeatmapDayData = {
  date: Date;
  dateStr: string; // DD/MM/YYYY
  totalSeconds: number;
  weekIndex: number; // номер недели от начала периода
  dayOfWeek: number; // 0 = воскресенье, 6 = суббота
};

// Функция генерирует массив дней для тепловой карты (последние N недель)
export function generateHeatmapDays(numberOfWeeks: number): HeatmapDayData[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Находим воскресенье текущей недели (или сегодня, если сегодня воскресенье)
  const dayOfWeek = today.getDay();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek);

  // Идем назад на numberOfWeeks недель от начала текущей недели
  startDate.setDate(startDate.getDate() - (numberOfWeeks - 1) * 7);

  const days: HeatmapDayData[] = [];
  const totalDays = numberOfWeeks * 7;

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const weekIndex = Math.floor(i / 7);
    const dayOfWeek = date.getDay();

    days.push({
      date,
      dateStr: formatSecondsDate(date.getTime() / 1000),
      totalSeconds: 0,
      weekIndex,
      dayOfWeek,
    });
  }

  return days;
}

// Функция наполняет данные тепловой карты статистикой
export function fillHeatmapWithStats(
  heatmapDays: HeatmapDayData[],
  statEntries: StatEntry[]
): HeatmapDayData[] {
  const statsByDate = mapStatEntriesByDate(statEntries);

  return heatmapDays.map((day) => {
    const entries = statsByDate[day.dateStr] || [];
    const totalSeconds = sumStatEntriesTime(entries);

    return {
      ...day,
      totalSeconds,
    };
  });
}
