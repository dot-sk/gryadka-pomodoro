import React from "react";
import { render, cleanup, fireEvent, act } from "@testing-library/react";
import { CanvasCountdown } from "./CanvasCountdown";
import * as effectorReact from "effector-react";
import { events } from "../model";

// Мокаем effector-react
jest.mock("effector-react", () => ({
  useUnit: jest.fn(),
}));

// Мокаем события модели
jest.mock("../model", () => ({
  ...jest.requireActual("../model"),
  events: {
    pause: jest.fn(),
    resume: jest.fn(),
    stop: jest.fn(),
    setTime: jest.fn(),
  },
}));

// Создаем правильно типизированный мок для useUnit
const mockUseUnit = effectorReact.useUnit as jest.MockedFunction<
  <T>(shape: T) => T
>;

describe("CanvasCountdown", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("должен рендерить canvas с пиксельным таймером", () => {
    mockUseUnit.mockReturnValue({
      time: 1500,
      currentInterval: 1500,
      isRunning: false,
      canEditTime: true,
    });

    const { getByTestId } = render(<CanvasCountdown />);

    const container = getByTestId("canvas-countdown-container");
    expect(container).toBeInTheDocument();

    const canvas = getByTestId("canvas-countdown-display");
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe("CANVAS");
  });

  it("должен обновлять canvas при изменении времени", () => {
    mockUseUnit.mockReturnValue({
      time: 1500,
      currentInterval: 1500,
      isRunning: false,
      canEditTime: true,
    });

    const { getByTestId, rerender } = render(<CanvasCountdown />);

    const canvas = getByTestId("canvas-countdown-display") as HTMLCanvasElement;

    mockUseUnit.mockReturnValue({
      time: 1499,
      currentInterval: 1500,
      isRunning: false,
      canEditTime: true,
    });

    rerender(<CanvasCountdown />);

    expect(canvas).toBeInTheDocument();
  });

  it("должен корректно работать с нулевым временем", () => {
    mockUseUnit.mockReturnValue({
      time: 0,
      currentInterval: 1500,
      isRunning: false,
      canEditTime: true,
    });

    const { getByTestId } = render(<CanvasCountdown />);

    const canvas = getByTestId("canvas-countdown-display");
    expect(canvas).toBeInTheDocument();
  });

  describe("Обработка кликов", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("должен вызывать resume при одинарном клике в состоянии паузы", () => {
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 1500,
        isRunning: false,
        canEditTime: true,
      });

      const { getByTestId } = render(<CanvasCountdown />);
      const container = getByTestId("canvas-countdown-container");

      fireEvent.click(container);

      expect(events.resume).toHaveBeenCalledTimes(1);
      expect(events.pause).not.toHaveBeenCalled();
    });

    it("должен вызывать pause при одинарном клике в состоянии выполнения", () => {
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 1500,
        isRunning: true,
        canEditTime: false,
      });

      const { getByTestId } = render(<CanvasCountdown />);
      const container = getByTestId("canvas-countdown-container");

      fireEvent.click(container);

      expect(events.pause).toHaveBeenCalledTimes(1);
      expect(events.resume).not.toHaveBeenCalled();
    });

    it("должен вызывать stop при двойном клике", () => {
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 1500,
        isRunning: true,
        canEditTime: false,
      });

      const { getByTestId } = render(<CanvasCountdown />);
      const container = getByTestId("canvas-countdown-container");

      fireEvent.doubleClick(container);

      expect(events.stop).toHaveBeenCalledTimes(1);
      expect(events.stop).toHaveBeenCalledWith({ save: true });
    });

    it("должен вызывать stop при двойном клике в состоянии паузы", () => {
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 1500,
        isRunning: false,
        canEditTime: false, // Таймер был запущен, сейчас на паузе
      });

      const { getByTestId } = render(<CanvasCountdown />);
      const container = getByTestId("canvas-countdown-container");

      fireEvent.doubleClick(container);

      expect(events.stop).toHaveBeenCalledTimes(1);
      expect(events.stop).toHaveBeenCalledWith({ save: true });
    });
  });

  describe("Keyboard shortcuts", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should toggle play/pause on Space key", () => {
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 1500,
        isRunning: true,
        canEditTime: false,
      });

      render(<CanvasCountdown />);

      fireEvent.keyDown(window, { key: " " });

      expect(events.pause).toHaveBeenCalledTimes(1);
    });

    it("should toggle play/pause on Enter key", () => {
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 1500,
        isRunning: false,
        canEditTime: true,
      });

      render(<CanvasCountdown />);

      fireEvent.keyDown(window, { key: "Enter" });

      expect(events.resume).toHaveBeenCalledTimes(1);
    });

    it("should decrease time by 60s on ArrowLeft when can edit", () => {
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 1500,
        isRunning: false,
        canEditTime: true,
      });

      render(<CanvasCountdown />);

      fireEvent.keyDown(window, { key: "ArrowLeft" });

      expect(events.setTime).toHaveBeenCalledWith(1140);
    });

    it("should increase time by 60s on ArrowRight when can edit", () => {
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 1500,
        isRunning: false,
        canEditTime: true,
      });

      render(<CanvasCountdown />);

      fireEvent.keyDown(window, { key: "ArrowRight" });

      expect(events.setTime).toHaveBeenCalledWith(1260);
    });

    it("should allow increasing time beyond currentInterval up to 2 hours", () => {
      mockUseUnit.mockReturnValue({
        time: 60,
        currentInterval: 60,
        isRunning: false,
        canEditTime: true,
      });

      render(<CanvasCountdown />);

      fireEvent.keyDown(window, { key: "ArrowRight" });

      expect(events.setTime).toHaveBeenCalledWith(120);
    });

    it("should ignore arrow keys when RUNNING", () => {
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 1500,
        isRunning: true,
        canEditTime: false,
      });

      render(<CanvasCountdown />);

      fireEvent.keyDown(window, { key: "ArrowLeft" });
      fireEvent.keyDown(window, { key: "ArrowRight" });

      expect(events.setTime).not.toHaveBeenCalled();
    });

    it("should ignore arrow keys when paused but already started", () => {
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 1500,
        isRunning: false,
        canEditTime: false, // Таймер был запущен
      });

      render(<CanvasCountdown />);

      fireEvent.keyDown(window, { key: "ArrowLeft" });
      fireEvent.keyDown(window, { key: "ArrowRight" });

      expect(events.setTime).not.toHaveBeenCalled();
    });

    it("should not allow time below 0", () => {
      mockUseUnit.mockReturnValue({
        time: 30,
        currentInterval: 1500,
        isRunning: false,
        canEditTime: true,
      });

      render(<CanvasCountdown />);

      fireEvent.keyDown(window, { key: "ArrowLeft" });

      expect(events.setTime).toHaveBeenCalledWith(0);
    });

    it("should stop adjusting time on keyup", () => {
      jest.useFakeTimers();
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 1500,
        isRunning: false,
        canEditTime: true,
      });

      render(<CanvasCountdown />);

      fireEvent.keyDown(window, { key: "ArrowRight" });
      expect(events.setTime).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(window, { key: "ArrowRight" });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(events.setTime).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it("should repeat time adjustment when key is held", () => {
      jest.useFakeTimers();
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 3600,
        isRunning: false,
        canEditTime: true,
      });

      render(<CanvasCountdown />);

      fireEvent.keyDown(window, { key: "ArrowRight", repeat: false });
      expect(events.setTime).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(events.setTime).toHaveBeenCalledTimes(2);

      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(events.setTime).toHaveBeenCalledTimes(3);

      fireEvent.keyUp(window, { key: "ArrowRight" });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(events.setTime).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });

    it("should ignore repeat keydown events from browser auto-repeat", () => {
      jest.useFakeTimers();
      mockUseUnit.mockReturnValue({
        time: 1200,
        currentInterval: 1500,
        isRunning: false,
        canEditTime: true,
      });

      render(<CanvasCountdown />);

      fireEvent.keyDown(window, { key: "ArrowLeft", repeat: false });
      expect(events.setTime).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: "ArrowLeft", repeat: true });
      fireEvent.keyDown(window, { key: "ArrowLeft", repeat: true });

      expect(events.setTime).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe("Canvas размеры для разных форматов времени", () => {
    it("должен использовать компактный размер для HH:MM:SS и влезать в 360px", () => {
      // 7199 секунд = 01:59:59 - максимальное значение перед 2 часами
      mockUseUnit.mockReturnValue({
        time: 7199,
        currentInterval: 7200,
        isRunning: false,
        canEditTime: true,
      });

      const { getByTestId } = render(<CanvasCountdown />);
      const canvas = getByTestId("canvas-countdown-display") as HTMLCanvasElement;

      // Проверяем что canvas влезает в окно 360x136
      expect(canvas.width).toBeLessThanOrEqual(360);
      expect(canvas.width).toBeGreaterThan(0);
    });

    it("должен влезать в 360px даже при максимальном времени (2 часа)", () => {
      // 7200 секунд = 02:00:00 - максимальное значение
      mockUseUnit.mockReturnValue({
        time: 7200,
        currentInterval: 7200,
        isRunning: false,
        canEditTime: true,
      });

      const { getByTestId } = render(<CanvasCountdown />);
      const canvas = getByTestId("canvas-countdown-display") as HTMLCanvasElement;

      expect(canvas.width).toBeLessThanOrEqual(360);
    });
  });
});
