import React, { useState } from "react";
import { useUnit } from "effector-react";
import { $statEntriesByDayForHeatmap } from "../model";
import { HeatmapDayData } from "../utils";
import { formatSeconds } from "../../../shared/utils";

// Утилита для получения интенсивности цвета на основе времени
function getIntensityLevel(totalSeconds: number): number {
  if (totalSeconds === 0) return 0;
  // Уровни в часах: 0, 1+, 2+, 4+, 6+
  const hours = totalSeconds / 3600;
  if (hours >= 6) return 4;
  if (hours >= 4) return 3;
  if (hours >= 2) return 2;
  if (hours >= 1) return 1;
  return 1;
}

// Компонент для одного дня
type DaySquareProps = {
  day: HeatmapDayData;
  onHover: (day: HeatmapDayData | null, event?: React.MouseEvent) => void;
};

const DaySquare = ({ day, onHover }: DaySquareProps) => {
  const intensity = getIntensityLevel(day.totalSeconds);

  // Цвета в стиле Flipper Zero (оранжевые) и Claude Code (технический вид)
  const colors = [
    "bg-gray-200 border-gray-300", // нет активности - светло-серый
    "bg-orange-200 border-orange-300", // 1+ час - светло-оранжевый
    "bg-orange-400 border-orange-500", // 2+ часа - оранжевый
    "bg-orange-600 border-orange-700", // 4+ часа - темно-оранжевый
    "bg-orange-800 border-orange-900", // 6+ часов - очень темный оранжевый
  ];

  return (
    <div
      data-testid="heatmap-day-square"
      data-intensity={intensity}
      data-date={day.dateStr}
      data-seconds={day.totalSeconds}
      className={`w-[10px] h-[10px] ${colors[intensity]} border rounded-[1px] cursor-pointer hover:ring-1 hover:ring-orange-400 transition-all`}
      onMouseEnter={(e) => onHover(day, e)}
      onMouseLeave={() => onHover(null)}
    />
  );
};

// Тултип
type TooltipProps = {
  day: HeatmapDayData | null;
  position: { x: number; y: number };
};

const Tooltip = ({ day, position }: TooltipProps) => {
  if (!day) return null;

  const hours = day.totalSeconds / 3600;
  const timeStr = formatSeconds(day.totalSeconds, { omitEmpty: false });

  return (
    <div
      className="fixed z-50 bg-black border border-orange-500 text-orange-100 text-xs px-3 py-2 rounded shadow-lg pointer-events-none font-mono"
      data-testid="heatmap-tooltip"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%) translateY(-8px)",
      }}
    >
      <div className="font-semibold text-orange-400">{day.dateStr}</div>
      <div className="text-orange-200">
        {day.totalSeconds === 0
          ? "NO DATA"
          : `${timeStr} (${hours.toFixed(1)}h)`}
      </div>
    </div>
  );
};

export const HeatmapActivity = () => {
  const { heatmapData } = useUnit({
    heatmapData: $statEntriesByDayForHeatmap,
  });
  const [hoveredDay, setHoveredDay] = useState<HeatmapDayData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleHover = (day: HeatmapDayData | null, event?: React.MouseEvent) => {
    setHoveredDay(day);
    if (event) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  // Группируем дни по неделям
  const weeks: HeatmapDayData[][] = [];
  const numberOfWeeks = heatmapData.length / 7;

  for (let i = 0; i < numberOfWeeks; i++) {
    const weekData = heatmapData.slice(i * 7, (i + 1) * 7);
    weeks.push(weekData);
  }

  // Названия дней недели (показываем только пн, ср, пт)
  const dayLabels = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const visibleDayIndices = [1, 3, 5]; // пн, ср, пт

  // Общая статистика
  const totalSeconds = heatmapData.reduce(
    (sum, day) => sum + day.totalSeconds,
    0
  );
  const daysWithActivity = heatmapData.filter(
    (day) => day.totalSeconds > 0
  ).length;

  return (
    <div className="flex flex-col items-center gap-3" data-testid="heatmap-activity">
      {/* Заголовок и статистика */}
      <div className="text-center">
        <h2 className="text-xl font-sansWide mb-2 text-black" data-testid="heatmap-title">ACTIVITY</h2>
        <div className="text-sm text-gray-700 font-mono" data-testid="heatmap-summary">
          {formatSeconds(totalSeconds, { omitEmpty: false })} in {daysWithActivity} {daysWithActivity === 1 ? "day" : "days"}
        </div>
      </div>

      {/* Сетка с рамкой в стиле CanvasCountdown */}
      <div
        className="relative p-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-lg"
      >
        <div className="relative px-6 py-5 bg-white rounded-lg shadow-inner">
          {/* Терминальные уголки - верхний левый */}
          <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-gray-300 rounded-tl" />
          {/* Верхний правый */}
          <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-gray-300 rounded-tr" />
          {/* Нижний левый */}
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-gray-300 rounded-bl" />
          {/* Нижний правый */}
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-gray-300 rounded-br" />

          {/* Сетка недель */}
          <div className="flex gap-[2px]" data-testid="heatmap-grid">
            {/* Метки дней недели */}
            <div className="flex flex-col gap-[2px] text-[10px] text-gray-600 mr-1 font-mono" data-testid="heatmap-day-labels">
              {dayLabels.map((label, index) => (
                <div
                  key={index}
                  className="w-6 h-[10px] flex items-center justify-end"
                  style={{
                    visibility: visibleDayIndices.includes(index)
                      ? "visible"
                      : "hidden",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Колонки недель */}
            <div className="flex gap-[2px]" data-testid="heatmap-weeks">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]" data-testid={`heatmap-week-${weekIndex}`}>
                  {week.map((day) => (
                    <DaySquare
                      key={day.dateStr}
                      day={day}
                      onHover={handleHover}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Легенда */}
      <div className="flex items-center gap-2 text-xs text-gray-600 font-mono" data-testid="heatmap-legend">
        <span>LESS</span>
        <div className="flex gap-[2px]">
          <div className="w-[10px] h-[10px] bg-gray-200 border border-gray-300 rounded-[1px]" data-testid="legend-level-0" />
          <div className="w-[10px] h-[10px] bg-orange-200 border border-orange-300 rounded-[1px]" data-testid="legend-level-1" />
          <div className="w-[10px] h-[10px] bg-orange-400 border border-orange-500 rounded-[1px]" data-testid="legend-level-2" />
          <div className="w-[10px] h-[10px] bg-orange-600 border border-orange-700 rounded-[1px]" data-testid="legend-level-3" />
          <div className="w-[10px] h-[10px] bg-orange-800 border border-orange-900 rounded-[1px]" data-testid="legend-level-4" />
        </div>
        <span>MORE</span>
      </div>

      <Tooltip day={hoveredDay} position={tooltipPosition} />
    </div>
  );
};
