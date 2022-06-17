import { allSettled, fork } from "effector";
import { countdownModel } from "../../entitites/countdown";
import {
  $statEntriesHistory,
  $statEntry,
  domain,
  events,
  $totalToday,
} from "./model";
import { IntervalType } from "../../entitites/countdown/constants";
import { wait } from "../../shared/utils";
import { StatEntryOwnTypes } from "./constants";

jest.useRealTimers();

// функция возвращает дату сегодня в 12:00
const getTodayNoonMs = () => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date.getTime();
};

describe("features/stats/model", () => {
  it("должен обратотать старт интервала", async () => {
    const statsScope = fork(domain, {
      handlers: [[countdownModel.effects.tickEffect, () => wait(100)]],
    });

    await allSettled(countdownModel.events.start, {
      scope: statsScope,
      params: {
        interval: 2,
        type: IntervalType.WORK,
      },
    });

    const firstEntry = statsScope.getState($statEntriesHistory)[0];

    expect(firstEntry.time).toBe(2);
    expect(firstEntry.type).toBe(IntervalType.WORK);
  });

  it.skip("должен сохранить правильные таймстемпы", async () => {
    const statsScope = fork(domain);
    const allowedDelta = 100;
    const threeSecMs = 3 * 1000;

    await allSettled(countdownModel.events.start, {
      scope: statsScope,
      params: {
        interval: 3,
        type: IntervalType.WORK,
      },
    });

    const firstEntry = statsScope.getState($statEntriesHistory)[0];
    const diff = firstEntry.end - firstEntry.start;

    expect(diff).not.toBeLessThan(threeSecMs - allowedDelta);
    expect(diff).not.toBeGreaterThan(threeSecMs + allowedDelta);
  });

  it('должен перейти в начальное состояние после события "reset"', async () => {
    const statsScope = fork(domain, {
      handlers: [[countdownModel.effects.tickEffect, () => wait(100)]],
    });

    await allSettled(countdownModel.events.start, {
      scope: statsScope,
      params: {
        interval: 2,
        type: IntervalType.WORK,
      },
    });

    expect(statsScope.getState($statEntry)).toMatchObject({
      start: 0,
      end: 0,
      time: 0,
      type: StatEntryOwnTypes.INITIAL,
    });
  });

  it('должен удалить запись после события "remove"', async () => {
    const statsScope = fork(domain, {
      values: [
        [
          $statEntriesHistory,
          [
            {
              start: 1,
              end: 2,
              time: 3,
              type: IntervalType.WORK,
            },
          ],
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
    const statsScope = fork(domain, {
      values: [
        [
          $statEntriesHistory,
          [1, 2, 3].map((time) => ({
            start: todayNoonMs,
            end: todayNoonMs,
            time,
            type: IntervalType.WORK,
          })),
        ],
      ],
    });

    expect(statsScope.getState($totalToday)).toBe(6);
  });
});
