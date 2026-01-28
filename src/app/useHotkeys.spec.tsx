import { renderHook } from "@testing-library/react";
import { allSettled, fork } from "effector";
import { useHotkeys } from "./useHotkeys";
import { events as appEvents, $currentScreen, AppScreen } from "./model";
import { countdownModel } from "../entitites/countdown";

describe("useHotkeys", () => {
  beforeEach(() => {
    // Очищаем все обработчики перед каждым тестом
    window.removeEventListener("keydown", jest.fn());
  });

  it("должен переключаться на таймер по Cmd+1", async () => {
    const scope = fork();

    // Устанавливаем начальный экран на статистику
    await allSettled(appEvents.navigateToStats, { scope });
    expect(scope.getState($currentScreen)).toBe(AppScreen.STATS);

    renderHook(() => useHotkeys());

    // Эмулируем нажатие Cmd+1
    const event = new KeyboardEvent("keydown", {
      key: "1",
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    await allSettled(appEvents.navigateToTimer, { scope });
    expect(scope.getState($currentScreen)).toBe(AppScreen.TIMER);
  });

  it("должен переключаться на статистику по Cmd+2", async () => {
    const scope = fork();

    // Устанавливаем начальный экран на таймер
    await allSettled(appEvents.navigateToTimer, { scope });
    expect(scope.getState($currentScreen)).toBe(AppScreen.TIMER);

    renderHook(() => useHotkeys());

    // Эмулируем нажатие Cmd+2
    const event = new KeyboardEvent("keydown", {
      key: "2",
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    await allSettled(appEvents.navigateToStats, { scope });
    expect(scope.getState($currentScreen)).toBe(AppScreen.STATS);
  });

  it("должен запускать таймер по Space когда он не запущен", async () => {
    const scope = fork();

    await allSettled(countdownModel.events.initFromSettings, {
      scope,
      params: 1500,
    });

    expect(scope.getState(countdownModel.$isRunning)).toBe(false);
    expect(scope.getState(countdownModel.$isPaused)).toBe(true);

    renderHook(() => useHotkeys());

    // Эмулируем нажатие Space
    const event = new KeyboardEvent("keydown", {
      code: "Space",
      bubbles: true,
    });
    window.dispatchEvent(event);

    await allSettled(countdownModel.events.togglePlayPause, { scope });
    expect(scope.getState(countdownModel.$isRunning)).toBe(true);
    expect(scope.getState(countdownModel.$isPaused)).toBe(false);
  });

  it("должен ставить таймер на паузу по Space когда он запущен", async () => {
    const scope = fork();

    await allSettled(countdownModel.events.initFromSettings, {
      scope,
      params: 1500,
    });

    await allSettled(countdownModel.events.resume, { scope });
    expect(scope.getState(countdownModel.$isRunning)).toBe(true);

    renderHook(() => useHotkeys());

    // Эмулируем нажатие Space
    const event = new KeyboardEvent("keydown", {
      code: "Space",
      bubbles: true,
    });
    window.dispatchEvent(event);

    await allSettled(countdownModel.events.togglePlayPause, { scope });
    expect(scope.getState(countdownModel.$isRunning)).toBe(false);
    expect(scope.getState(countdownModel.$isPaused)).toBe(true);
  });

  it("не должен срабатывать Space с модификаторами", async () => {
    const scope = fork();

    await allSettled(countdownModel.events.initFromSettings, {
      scope,
      params: 1500,
    });

    expect(scope.getState(countdownModel.$isRunning)).toBe(false);

    renderHook(() => useHotkeys());

    // Эмулируем нажатие Space с Cmd
    const event = new KeyboardEvent("keydown", {
      code: "Space",
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    // Состояние не должно измениться
    expect(scope.getState(countdownModel.$isRunning)).toBe(false);
  });

  it("должен удалять обработчик при размонтировании", () => {
    const removeEventListenerSpy = jest.spyOn(window as any, "removeEventListener");

    const { unmount } = renderHook(() => useHotkeys());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});
