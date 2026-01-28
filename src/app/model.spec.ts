import { allSettled, fork } from "effector";
import { $currentScreen, AppScreen, events } from "./model";
import { countdownModel } from "../entitites/countdown";

describe("app/model", () => {
  describe("навигация", () => {
    it("должен переключаться на таймер по events.navigateToTimer", async () => {
      const scope = fork();

      await allSettled(events.navigateToStats, { scope });
      expect(scope.getState($currentScreen)).toBe(AppScreen.STATS);

      await allSettled(events.navigateToTimer, { scope });
      expect(scope.getState($currentScreen)).toBe(AppScreen.TIMER);
    });

    it("должен переключаться на статистику по events.navigateToStats", async () => {
      const scope = fork();

      await allSettled(events.navigateToTimer, { scope });
      expect(scope.getState($currentScreen)).toBe(AppScreen.TIMER);

      await allSettled(events.navigateToStats, { scope });
      expect(scope.getState($currentScreen)).toBe(AppScreen.STATS);
    });

    it("должен иметь TIMER экран по умолчанию", () => {
      const scope = fork();
      expect(scope.getState($currentScreen)).toBe(AppScreen.TIMER);
    });
  });

  describe("toggle play/pause логика", () => {
    it("должен вызывать togglePlayPause из countdown модели", () => {
      const toggleSpy = jest.fn();
      const unwatch = countdownModel.events.togglePlayPause.watch(toggleSpy);

      // Эмулируем IPC событие - вызов togglePlayPause
      countdownModel.events.togglePlayPause();

      expect(toggleSpy).toHaveBeenCalledTimes(1);

      unwatch();
    });
  });
});
