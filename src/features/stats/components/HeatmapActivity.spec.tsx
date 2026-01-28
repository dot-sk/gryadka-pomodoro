import { render, cleanup, fireEvent } from "@testing-library/react";
import { HeatmapActivity } from "./HeatmapActivity";
import { HeatmapDayData } from "../utils";
import * as effectorReact from "effector-react";

// Мокаем effector-react
jest.mock("effector-react", () => ({
  useUnit: jest.fn(),
}));

// Создаем правильно типизированный мок для useUnit
const mockUseUnit = effectorReact.useUnit as jest.MockedFunction<
  <T>(shape: T) => T
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
        dayOfWeek: (date.getDay() + 6) % 7, // 0 = Monday, 6 = Sunday
      };

      const customDay = customData?.find((d) => d.weekIndex === defaultDay.weekIndex && d.dayOfWeek === defaultDay.dayOfWeek);
      days.push({ ...defaultDay, ...customDay });
    }

    return days;
  };

  it("должен рендерить компонент с пустыми данными", () => {
    const emptyData = generateMockHeatmapData(18);
    mockUseUnit.mockReturnValue({ heatmapData: emptyData });

    const { getByTestId } = render(<HeatmapActivity />);

    // Проверяем наличие основного контейнера
    expect(getByTestId("heatmap-activity")).toBeInTheDocument();

    // Проверяем количество недель (18 колонок)
    const weeks = getByTestId("heatmap-weeks");
    const weekColumns = weeks.querySelectorAll('[data-testid^="heatmap-week-"]');
    expect(weekColumns.length).toBe(18);
  });

  it("должен рендерить компонент с данными", () => {
    const dataWithActivity = generateMockHeatmapData(18, [
      { weekIndex: 0, dayOfWeek: 0, totalSeconds: 3600 }, // 1 час - понедельник
      { weekIndex: 1, dayOfWeek: 2, totalSeconds: 7200 }, // 2 часа - среда
      { weekIndex: 2, dayOfWeek: 4, totalSeconds: 14400 }, // 4 часа - пятница
      { weekIndex: 3, dayOfWeek: 6, totalSeconds: 21600 }, // 6 часов - воскресенье
    ]);
    mockUseUnit.mockReturnValue({ heatmapData: dataWithActivity });

    const { getAllByTestId } = render(<HeatmapActivity />);

    // Проверяем, что есть клетки с активностью (intensity > 0)
    const allSquares = getAllByTestId("heatmap-day-square");
    const activeSquares = allSquares.filter(sq => sq.getAttribute("data-intensity") !== "0");
    expect(activeSquares.length).toBe(4);
  });

  it("должен отображать правильные метки дней недели", () => {
    const emptyData = generateMockHeatmapData(18);
    mockUseUnit.mockReturnValue({ heatmapData: emptyData });

    const { getByTestId } = render(<HeatmapActivity />);

    const dayLabels = getByTestId("heatmap-day-labels");

    // Проверяем видимые метки (пн, ср, пт)
    expect(dayLabels).toHaveTextContent("MO");
    expect(dayLabels).toHaveTextContent("WE");
    expect(dayLabels).toHaveTextContent("FR");
  });

  it("должен показывать tooltip при наведении на клетку", () => {
    const testData = generateMockHeatmapData(1, [
      { weekIndex: 0, dayOfWeek: 0, totalSeconds: 3600 },
    ]);

    mockUseUnit.mockReturnValue({ heatmapData: testData });

    const { getAllByTestId, queryByTestId } = render(<HeatmapActivity />);

    const allSquares = getAllByTestId("heatmap-day-square");
    const activeSquare = allSquares.find(sq =>
      sq.getAttribute("data-seconds") === "3600"
    );

    expect(activeSquare).toBeDefined();
    expect(queryByTestId("tooltip")).not.toBeInTheDocument();

    if (activeSquare) {
      const targetWrapper = activeSquare.parentElement;
      if (targetWrapper) {
        fireEvent.mouseEnter(targetWrapper);

        const tooltip = queryByTestId("tooltip");
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent(/1.0h/);

        fireEvent.mouseLeave(targetWrapper);

        expect(queryByTestId("tooltip")).not.toBeInTheDocument();
      }
    }
  });

  it("должен показывать 'NO DATA' в tooltip для пустых дней", () => {
    const emptyData = generateMockHeatmapData(18);
    mockUseUnit.mockReturnValue({ heatmapData: emptyData });

    const { getAllByTestId, queryByTestId } = render(<HeatmapActivity />);

    const allSquares = getAllByTestId("heatmap-day-square");
    const emptySquare = allSquares[0]; // первая клетка всегда пустая

    // Наводим на обертку (Tooltip.Target)
    const targetWrapper = emptySquare.parentElement;
    if (targetWrapper) {
      fireEvent.mouseEnter(targetWrapper);

      const tooltip = queryByTestId("tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent("NO DATA");

      fireEvent.mouseLeave(targetWrapper);

      expect(queryByTestId("tooltip")).not.toBeInTheDocument();
    }
  });

  it("должен применять правильные цвета в зависимости от времени", () => {
    const testData = generateMockHeatmapData(1, [
      { weekIndex: 0, dayOfWeek: 0, totalSeconds: 0 },
      { weekIndex: 0, dayOfWeek: 1, totalSeconds: 3600 },
      { weekIndex: 0, dayOfWeek: 2, totalSeconds: 7200 },
      { weekIndex: 0, dayOfWeek: 3, totalSeconds: 14400 },
      { weekIndex: 0, dayOfWeek: 4, totalSeconds: 21600 },
      { weekIndex: 0, dayOfWeek: 5, totalSeconds: 0 },
      { weekIndex: 0, dayOfWeek: 6, totalSeconds: 0 },
    ]);

    mockUseUnit.mockReturnValue({ heatmapData: testData });

    const { getAllByTestId } = render(<HeatmapActivity />);

    const squares = getAllByTestId("heatmap-day-square");

    const findIntensityBySeconds = (seconds: number) => {
      const square = squares.find(sq => sq.getAttribute("data-seconds") === String(seconds));
      return square?.getAttribute("data-intensity");
    };

    expect(findIntensityBySeconds(0)).toBe("0");
    expect(findIntensityBySeconds(3600)).toBe("1");
    expect(findIntensityBySeconds(7200)).toBe("2");
    expect(findIntensityBySeconds(14400)).toBe("3");
    expect(findIntensityBySeconds(21600)).toBe("4");
  });

  it("должен рендерить правильное количество недель", () => {
    const data = generateMockHeatmapData(18);
    mockUseUnit.mockReturnValue({ heatmapData: data });

    const { getByTestId } = render(<HeatmapActivity />);

    // Проверяем количество недель (18)
    const weeks = getByTestId("heatmap-weeks");
    const weekColumns = weeks.querySelectorAll('[data-testid^="heatmap-week-"]');
    expect(weekColumns.length).toBe(18);
  });
});
