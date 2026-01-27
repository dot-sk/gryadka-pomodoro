import React from "react";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { HeatmapActivity } from "./HeatmapActivity";
import { HeatmapDayData } from "../utils";
import * as effectorReact from "effector-react";

// Мокаем effector-react
jest.mock("effector-react", () => ({
  useStore: jest.fn(),
}));

const mockUseStore = effectorReact.useStore as jest.MockedFunction<
  typeof effectorReact.useStore
>;

describe("HeatmapActivity", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  const generateMockHeatmapData = (
    numberOfWeeks: number,
    customData?: Partial<HeatmapDayData>[]
  ): HeatmapDayData[] => {
    const days: HeatmapDayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < numberOfWeeks * 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (numberOfWeeks * 7 - i));

      const defaultDay: HeatmapDayData = {
        date,
        dateStr: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
        totalSeconds: 0,
        weekIndex: Math.floor(i / 7),
        dayOfWeek: date.getDay(),
      };

      const customDay = customData?.find((d) => d.weekIndex === defaultDay.weekIndex && d.dayOfWeek === defaultDay.dayOfWeek);
      days.push({ ...defaultDay, ...customDay });
    }

    return days;
  };

  it("должен рендерить компонент с пустыми данными", () => {
    const emptyData = generateMockHeatmapData(26);
    mockUseStore.mockReturnValue(emptyData);

    const { getByText, getByTestId } = render(<HeatmapActivity />);

    // Проверяем наличие заголовка
    expect(getByTestId("heatmap-title")).toHaveTextContent("ACTIVITY");

    // Проверяем наличие легенды
    expect(getByText("LESS")).toBeInTheDocument();
    expect(getByText("MORE")).toBeInTheDocument();

    // Проверяем статистику (должна показывать 0)
    expect(getByTestId("heatmap-summary")).toHaveTextContent(/00:00:00 in 0 days/);

    // Проверяем количество недель (26 колонок)
    const weeks = getByTestId("heatmap-weeks");
    const weekColumns = weeks.querySelectorAll('[data-testid^="heatmap-week-"]');
    expect(weekColumns.length).toBe(26);
  });

  it("должен рендерить компонент с данными", () => {
    const dataWithActivity = generateMockHeatmapData(26, [
      { weekIndex: 0, dayOfWeek: 1, totalSeconds: 3600 }, // 1 час
      { weekIndex: 1, dayOfWeek: 3, totalSeconds: 7200 }, // 2 часа
      { weekIndex: 2, dayOfWeek: 5, totalSeconds: 14400 }, // 4 часа
      { weekIndex: 3, dayOfWeek: 0, totalSeconds: 21600 }, // 6 часов
    ]);
    mockUseStore.mockReturnValue(dataWithActivity);

    const { getByTestId, getAllByTestId } = render(<HeatmapActivity />);

    // Проверяем статистику - 4 дня с активностью
    expect(getByTestId("heatmap-summary")).toHaveTextContent(/4 days/);

    // Проверяем, что есть клетки с активностью (intensity > 0)
    const allSquares = getAllByTestId("heatmap-day-square");
    const activeSquares = allSquares.filter(sq => sq.getAttribute("data-intensity") !== "0");
    expect(activeSquares.length).toBe(4);
  });

  it("должен отображать правильные метки дней недели", () => {
    const emptyData = generateMockHeatmapData(26);
    mockUseStore.mockReturnValue(emptyData);

    const { getByTestId } = render(<HeatmapActivity />);

    const dayLabels = getByTestId("heatmap-day-labels");

    // Проверяем видимые метки (пн, ср, пт)
    expect(dayLabels).toHaveTextContent("MO");
    expect(dayLabels).toHaveTextContent("WE");
    expect(dayLabels).toHaveTextContent("FR");
  });

  it("должен показывать tooltip при наведении на клетку", () => {
    // Создаем простые данные с одной неделей
    const testData: HeatmapDayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Генерируем 7 дней с активностью в первый день
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));

      testData.push({
        date,
        dateStr: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
        totalSeconds: i === 0 ? 3600 : 0, // 1 час в первый день
        weekIndex: 0,
        dayOfWeek: i,
      });
    }

    mockUseStore.mockReturnValue(testData);

    const { getAllByTestId, queryByTestId } = render(<HeatmapActivity />);

    // Находим первую клетку с активностью
    const allSquares = getAllByTestId("heatmap-day-square");
    const activeSquare = allSquares.find(sq =>
      sq.getAttribute("data-seconds") === "3600"
    );

    expect(activeSquare).toBeDefined();

    // Tooltip не должен быть виден до наведения
    expect(queryByTestId("heatmap-tooltip")).not.toBeInTheDocument();

    // Наводим на клетку
    if (activeSquare) {
      fireEvent.mouseEnter(activeSquare);

      // Tooltip должен появиться
      const tooltip = queryByTestId("heatmap-tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent(/1.0h/);

      // Убираем курсор
      fireEvent.mouseLeave(activeSquare);

      // Tooltip должен исчезнуть
      expect(queryByTestId("heatmap-tooltip")).not.toBeInTheDocument();
    }
  });

  it("должен показывать 'NO DATA' в tooltip для пустых дней", () => {
    const emptyData = generateMockHeatmapData(26);
    mockUseStore.mockReturnValue(emptyData);

    const { getAllByTestId, queryByTestId } = render(<HeatmapActivity />);

    const allSquares = getAllByTestId("heatmap-day-square");
    const emptySquare = allSquares[0]; // первая клетка всегда пустая

    fireEvent.mouseEnter(emptySquare);

    const tooltip = queryByTestId("heatmap-tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("NO DATA");

    fireEvent.mouseLeave(emptySquare);

    expect(queryByTestId("heatmap-tooltip")).not.toBeInTheDocument();
  });

  it("должен применять правильные цвета в зависимости от времени", () => {
    // Создаем данные для первой недели с разными уровнями активности
    const testData: HeatmapDayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Генерируем 7 дней для одной недели с разными уровнями активности
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));

      const seconds = [0, 3600, 7200, 14400, 21600, 0, 0][i]; // разные уровни

      testData.push({
        date,
        dateStr: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
        totalSeconds: seconds,
        weekIndex: 0,
        dayOfWeek: i,
      });
    }

    mockUseStore.mockReturnValue(testData);

    const { getByTestId } = render(<HeatmapActivity />);

    // Находим первую неделю по data-testid
    const firstWeek = getByTestId("heatmap-week-0");
    const squares = firstWeek.querySelectorAll('[data-testid="heatmap-day-square"]');

    // Проверяем intensity уровни по data-атрибуту
    expect(squares[0].getAttribute("data-intensity")).toBe("0"); // 0ч -> intensity 0
    expect(squares[1].getAttribute("data-intensity")).toBe("1"); // 1ч -> intensity 1
    expect(squares[2].getAttribute("data-intensity")).toBe("2"); // 2ч -> intensity 2
    expect(squares[3].getAttribute("data-intensity")).toBe("3"); // 4ч -> intensity 3
    expect(squares[4].getAttribute("data-intensity")).toBe("4"); // 6ч -> intensity 4
    expect(squares[5].getAttribute("data-intensity")).toBe("0"); // 0ч -> intensity 0
    expect(squares[6].getAttribute("data-intensity")).toBe("0"); // 0ч -> intensity 0
  });

  it("должен отображать легенду с правильными цветами", () => {
    const emptyData = generateMockHeatmapData(26);
    mockUseStore.mockReturnValue(emptyData);

    const { getByTestId } = render(<HeatmapActivity />);

    // Проверяем наличие всех уровней легенды
    expect(getByTestId("legend-level-0")).toBeInTheDocument();
    expect(getByTestId("legend-level-1")).toBeInTheDocument();
    expect(getByTestId("legend-level-2")).toBeInTheDocument();
    expect(getByTestId("legend-level-3")).toBeInTheDocument();
    expect(getByTestId("legend-level-4")).toBeInTheDocument();

    // Проверяем текст легенды
    const legend = getByTestId("heatmap-legend");
    expect(legend).toHaveTextContent("LESS");
    expect(legend).toHaveTextContent("MORE");
  });

  it("должен корректно рассчитывать общую статистику", () => {
    const dataWithActivity = generateMockHeatmapData(26, [
      { weekIndex: 0, dayOfWeek: 1, totalSeconds: 3600 }, // 1 час
      { weekIndex: 1, dayOfWeek: 2, totalSeconds: 3600 }, // 1 час
      { weekIndex: 2, dayOfWeek: 3, totalSeconds: 3600 }, // 1 час
    ]);
    mockUseStore.mockReturnValue(dataWithActivity);

    const { getByTestId } = render(<HeatmapActivity />);

    // 3 часа = 03:00:00, 3 дня
    expect(getByTestId("heatmap-summary")).toHaveTextContent(/03:00:00 in 3 days/);
  });

  it("должен рендерить правильное количество недель", () => {
    const data = generateMockHeatmapData(26);
    mockUseStore.mockReturnValue(data);

    const { getByTestId } = render(<HeatmapActivity />);

    // Проверяем количество недель (26)
    const weeks = getByTestId("heatmap-weeks");
    const weekColumns = weeks.querySelectorAll('[data-testid^="heatmap-week-"]');
    expect(weekColumns.length).toBe(26);
  });
});
