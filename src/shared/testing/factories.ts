import type { StatEntry } from "../../features/stats/typings";
import type { CountdownStartPayload } from "../../entitites/countdown/typings";

/**
 * Фабрика для создания моковых данных StatEntry
 * Используется в тестах для создания тестовых данных
 */
export const createStatEntry = (overrides?: Partial<StatEntry>): StatEntry => {
  const now = Date.now();
  return {
    start: now,
    end: now + 1000,
    time: 1000,
    interval: 1000,
    ...overrides,
  };
};

/**
 * Фабрика для создания моковых данных CountdownStartPayload
 * Используется в тестах для создания тестовых данных
 */
export const createCountdownStartPayload = (
  overrides?: Partial<CountdownStartPayload>
): CountdownStartPayload => {
  return {
    interval: 1500,
    ...overrides,
  };
};

/**
 * Создает массив StatEntry с заданным количеством элементов
 */
export const createStatEntries = (
  count: number,
  overrides?: (index: number) => Partial<StatEntry>
): StatEntry[] => {
  return Array.from({ length: count }, (_, index) =>
    createStatEntry(overrides?.(index))
  );
};
