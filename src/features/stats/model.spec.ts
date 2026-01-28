import { allSettled, fork } from "effector";
import { countdownModel } from "../../entitites/countdown";
import {
  $statEntriesHistory,
  $statEntry,
  events,
  $totalToday,
  $statEntriesByDayForHeatmap,
} from "./model";
import { formatSecondsDate } from "../../shared/utils";
import { createStatEntry, createStatEntries } from "../../shared/testing";

// функция возвращает дату сегодня в 12:00
const getTodayNoonMs = () => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date.getTime();
};

describe("features/stats/model", () => {
  let dateNowSpy: jest.SpyInstance;
  let currentTime: number;

  beforeEach(() => {
    currentTime = getTodayNoonMs();
    dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => currentTime);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  const advanceTime = (ms: number) => {
    currentTime += ms;
  };

  it("должен обратотать старт интервала", async () => {
    const statsScope = fork();

    await allSettled(countdownModel.events.start, {
      scope: statsScope,
      params: {
        interval: 2,
      },
    });

    // Симулируем тики до конца интервала
    advanceTime(2000);
    await allSettled(countdownModel.events.clockInterval, {
      scope: statsScope,
      params: 1000,
    });

    const firstEntry = statsScope.getState($statEntriesHistory)[0];

    expect(firstEntry).toMatchObject({
      time: 2,
      interval: 2,
    });
  });

  it('должен перейти в начальное состояние после события "reset"', async () => {
    const statsScope = fork();

    await allSettled(countdownModel.events.start, {
      scope: statsScope,
      params: {
        interval: 2,
      },
    });

    // Симулируем тики до конца интервала
    advanceTime(2000);
    await allSettled(countdownModel.events.clockInterval, {
      scope: statsScope,
      params: 1000,
    });

    expect(statsScope.getState($statEntry)).toMatchObject({
      start: 0,
      end: 0,
      time: 0,
      interval: 0,
    });
  });

  it('должен удалить запись после события "remove"', async () => {
    const testEntry = createStatEntry({
      start: 1,
      end: 2,
      time: 3,
      interval: 10,
    });

    const statsScope = fork({
      values: [
        [
          $statEntriesHistory,
          [testEntry],
        ],
      ],
    });

    const firstEntry = statsScope.getState($statEntriesHistory)[0];

    await allSettled(events.remove, {
      scope: statsScope,
      params: firstEntry,
    });

    expect(statsScope.getState($statEntriesHistory)).toEqual([]);
  });

  it("должен правильно суммировать записи", async () => {
    const todayNoonMs = getTodayNoonMs();
    const statsScope = fork({
      values: [
        [
          $statEntriesHistory,
          createStatEntries(3, (index) => ({
            start: todayNoonMs,
            end: todayNoonMs,
            time: index + 1, // 1, 2, 3
            interval: 10,
          })),
        ],
      ],
    });

    expect(statsScope.getState($totalToday)).toBe(6);
  });

  it("должен генерировать данные для тепловой карты", async () => {
    const todayNoonMs = getTodayNoonMs();
    const statsScope = fork({
      values: [
        [
          $statEntriesHistory,
          [
            createStatEntry({
              start: todayNoonMs,
              end: todayNoonMs,
              time: 3600, // 1 час в секундах
              interval: 3600,
            }),
          ],
        ],
      ],
    });

    const heatmapData = statsScope.getState($statEntriesByDayForHeatmap);

    // Проверяем, что данные генерируются (18 недель * 7 дней = 126 дней)
    expect(heatmapData).toHaveLength(126);

    // Проверяем, что для сегодняшнего дня есть запись с данными
    const todayStr = formatSecondsDate(todayNoonMs / 1000);
    const todayData = heatmapData.find((day) => day.dateStr === todayStr);

    expect(todayData).toBeDefined();
    expect(todayData?.totalSeconds).toBe(3600);

    // Проверяем, что другие дни имеют totalSeconds = 0
    const daysWithoutData = heatmapData.filter(
      (day) => day.dateStr !== todayStr
    );
    expect(daysWithoutData.every((day) => day.totalSeconds === 0)).toBe(true);
  });
});
