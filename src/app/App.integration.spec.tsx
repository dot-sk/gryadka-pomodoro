import React from "react";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
import { allSettled } from "effector";
import { TimerPage } from "../pages/TimerPage/TimerPage";
import { countdownModel } from "../entitites/countdown";
import { useHotkeys } from "./useHotkeys";

/**
 * Интеграционные тесты для проверки взаимодействия компонентов
 * Эти тесты гарантируют, что баг с дублированием обработчиков не повторится
 *
 * ВАЖНО: Эти тесты проверяют РЕАЛЬНОЕ взаимодействие через UI (fireEvent),
 * а не только изолированную логику модели. Используют глобальное состояние effector.
 */

// Компонент-обертка для тестирования с хуками
const AppWithHotkeys: React.FC = () => {
  useHotkeys();
  return <TimerPage />;
};

describe("App Integration: Real UI interaction", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Сбрасываем состояние перед каждым тестом
    countdownModel.events.reset();
    countdownModel.events.initFromSettings(1500);
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  it("РЕГРЕССИЯ: первый Space должен запускать таймер с первого раза", async () => {
    expect(countdownModel.$isRunning.getState()).toBe(false);
    expect(countdownModel.$hasActiveTimer.getState()).toBe(false);

    render(<AppWithHotkeys />);

    // Нажимаем Space первый раз
    await act(async () => {
      fireEvent.keyDown(window, { code: "Space", bubbles: true });
      await jest.runAllTimersAsync();
    });

    // Проверяем, что таймер РЕАЛЬНО запустился с ПЕРВОГО раза (это был баг!)
    expect(countdownModel.$isRunning.getState()).toBe(true);
    expect(countdownModel.$hasActiveTimer.getState()).toBe(true);
    expect(countdownModel.$isPaused.getState()).toBe(false);
  });

  it("РЕГРЕССИЯ: первый клик должен запускать таймер с первого раза", async () => {
    expect(countdownModel.$isRunning.getState()).toBe(false);

    const { getByTestId } = render(<AppWithHotkeys />);
    const container = getByTestId("canvas-countdown-container");

    // Кликаем первый раз
    await act(async () => {
      fireEvent.click(container);
      await jest.runAllTimersAsync();
    });

    // Проверяем, что таймер запустился
    expect(countdownModel.$isRunning.getState()).toBe(true);
    expect(countdownModel.$hasActiveTimer.getState()).toBe(true);
  });

  it("РЕГРЕССИЯ: Space и клик должны работать одинаково (не должно быть конфликта обработчиков)", async () => {
    const { getByTestId } = render(<AppWithHotkeys />);
    const container = getByTestId("canvas-countdown-container");

    // Запускаем через Space
    await act(async () => {
      fireEvent.keyDown(window, { code: "Space", bubbles: true });
      await jest.runAllTimersAsync();
    });
    expect(countdownModel.$isRunning.getState()).toBe(true);

    // Паузим через клик
    await act(async () => {
      fireEvent.click(container);
      await jest.runAllTimersAsync();
    });
    expect(countdownModel.$isRunning.getState()).toBe(false);

    // Возобновляем через Space
    await act(async () => {
      fireEvent.keyDown(window, { code: "Space", bubbles: true });
      await jest.runAllTimersAsync();
    });
    expect(countdownModel.$isRunning.getState()).toBe(true);

    // Паузим через клик
    await act(async () => {
      fireEvent.click(container);
      await jest.runAllTimersAsync();
    });
    expect(countdownModel.$isRunning.getState()).toBe(false);

    // Все переключения работают корректно, нет конфликтов
    expect(countdownModel.$hasActiveTimer.getState()).toBe(true);
    expect(countdownModel.$isPaused.getState()).toBe(true);
  });

  it("РЕГРЕССИЯ: не должно быть двойного вызова при нажатии Space", async () => {
    // Отслеживаем вызовы событий
    let startCalls = 0;
    let resumeCalls = 0;
    let pauseCalls = 0;

    const unwatch1 = countdownModel.events.start.watch(() => startCalls++);
    const unwatch2 = countdownModel.events.resume.watch(() => resumeCalls++);
    const unwatch3 = countdownModel.events.pause.watch(() => pauseCalls++);

    render(<AppWithHotkeys />);

    // Нажимаем Space
    await act(async () => {
      fireEvent.keyDown(window, { code: "Space", bubbles: true });
      await jest.runAllTimersAsync();
    });

    // Должен быть ровно один вызов start, и НИ ОДНОГО resume/pause
    // (баг был в том, что вызывалось и start, и resume одновременно)
    expect(startCalls).toBe(1);
    expect(resumeCalls).toBe(0);
    expect(pauseCalls).toBe(0);
    expect(countdownModel.$isRunning.getState()).toBe(true);

    unwatch1();
    unwatch2();
    unwatch3();
  });

  it("должен корректно переключаться при повторных нажатиях Space", async () => {
    render(<AppWithHotkeys />);

    // Space #1: start
    await act(async () => {
      fireEvent.keyDown(window, { code: "Space", bubbles: true });
      await jest.runAllTimersAsync();
    });
    expect(countdownModel.$isRunning.getState()).toBe(true);

    // Space #2: pause
    await act(async () => {
      fireEvent.keyDown(window, { code: "Space", bubbles: true });
      await jest.runAllTimersAsync();
    });
    expect(countdownModel.$isRunning.getState()).toBe(false);
    expect(countdownModel.$isPaused.getState()).toBe(true);

    // Space #3: resume
    await act(async () => {
      fireEvent.keyDown(window, { code: "Space", bubbles: true });
      await jest.runAllTimersAsync();
    });
    expect(countdownModel.$isRunning.getState()).toBe(true);
  });

  it("должен корректно переключаться при повторных кликах", async () => {
    const { getByTestId } = render(<AppWithHotkeys />);
    const container = getByTestId("canvas-countdown-container");

    // Click #1: start
    await act(async () => {
      fireEvent.click(container);
      await jest.runAllTimersAsync();
    });
    expect(countdownModel.$isRunning.getState()).toBe(true);

    // Click #2: pause
    await act(async () => {
      fireEvent.click(container);
      await jest.runAllTimersAsync();
    });
    expect(countdownModel.$isRunning.getState()).toBe(false);
    expect(countdownModel.$isPaused.getState()).toBe(true);

    // Click #3: resume
    await act(async () => {
      fireEvent.click(container);
      await jest.runAllTimersAsync();
    });
    expect(countdownModel.$isRunning.getState()).toBe(true);
  });
});
