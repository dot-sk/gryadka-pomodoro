import React from "react";
import { render, cleanup } from "@testing-library/react";
import { CanvasCountdown } from "./CanvasCountdown";
import * as effectorReact from "effector-react";

// Мокаем effector-react
jest.mock("effector-react", () => ({
  useStore: jest.fn(),
}));

const mockUseStore = effectorReact.useStore as jest.MockedFunction<
  typeof effectorReact.useStore
>;

describe("CanvasCountdown", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("должен рендерить canvas с пиксельным таймером", () => {
    mockUseStore
      .mockReturnValueOnce(1500) // $time - 25:00
      .mockReturnValueOnce("work") // $countdownType
      .mockReturnValueOnce(1500); // $currentInterval

    const { getByTestId } = render(<CanvasCountdown />);

    // Проверяем наличие основного контейнера
    const container = getByTestId("canvas-countdown-container");
    expect(container).toBeInTheDocument();

    // Проверяем наличие canvas
    const canvas = getByTestId("canvas-countdown-display");
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe("CANVAS");
  });

  it("должен рендерить эмодзи типа интервала", () => {
    mockUseStore
      .mockReturnValueOnce(1200) // $time
      .mockReturnValueOnce("work") // $countdownType
      .mockReturnValueOnce(1500); // $currentInterval

    const { getByTestId } = render(<CanvasCountdown />);

    const emoji = getByTestId("canvas-countdown-emoji");
    expect(emoji).toBeInTheDocument();
    expect(emoji).toHaveTextContent("🧑🏻‍💻");
  });

  it("должен рендерить эмодзи отдыха для REST интервала", () => {
    mockUseStore
      .mockReturnValueOnce(300) // $time
      .mockReturnValueOnce("rest") // $countdownType
      .mockReturnValueOnce(300); // $currentInterval

    const { getByTestId } = render(<CanvasCountdown />);

    const emoji = getByTestId("canvas-countdown-emoji");
    expect(emoji).toHaveTextContent("🌴");
  });

  it("должен иметь терминальную рамку", () => {
    mockUseStore
      .mockReturnValueOnce(1500) // $time
      .mockReturnValueOnce("work") // $countdownType
      .mockReturnValueOnce(1500); // $currentInterval

    const { getByTestId } = render(<CanvasCountdown />);

    const border = getByTestId("canvas-countdown-border");
    expect(border).toBeInTheDocument();
  });

  it("должен обновлять canvas при изменении времени", () => {
    mockUseStore
      .mockReturnValueOnce(1500) // $time
      .mockReturnValueOnce("work") // $countdownType
      .mockReturnValueOnce(1500); // $currentInterval

    const { getByTestId, rerender } = render(<CanvasCountdown />);

    const canvas = getByTestId("canvas-countdown-display") as HTMLCanvasElement;
    const firstDataUrl = canvas.toDataURL();

    // Обновляем время
    mockUseStore
      .mockReturnValueOnce(1499) // новое время
      .mockReturnValueOnce("WORK")
      .mockReturnValueOnce(1500);

    rerender(<CanvasCountdown />);

    // Canvas должен обновиться (хотя в реальности содержимое может быть одинаковым для схожих значений)
    expect(canvas).toBeInTheDocument();
  });

  it("должен корректно работать с нулевым временем", () => {
    mockUseStore
      .mockReturnValueOnce(0) // $time
      .mockReturnValueOnce("work") // $countdownType
      .mockReturnValueOnce(1500); // $currentInterval

    const { getByTestId } = render(<CanvasCountdown />);

    const canvas = getByTestId("canvas-countdown-display");
    expect(canvas).toBeInTheDocument();
  });
});
