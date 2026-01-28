import React, { useRef } from "react";
import { useUnit } from "effector-react";
import { $statEntriesByDayForHeatmap } from "../model";
import { HeatmapDayData } from "../utils";
import { formatSeconds } from "../../../shared/utils";
import { Tooltip } from "../../../shared/components/Tooltip";

const INTENSITY_COLORS = [
  "bg-gray-200 border-gray-300",
  "bg-orange-200 border-orange-300",
  "bg-orange-400 border-orange-500",
  "bg-orange-600 border-orange-700",
  "bg-orange-800 border-orange-900",
];

const HOUR_THRESHOLDS = [6, 4, 2, 0];
const DAYS_PER_WEEK = 7;
const DAY_LABELS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const VISIBLE_DAY_INDICES = [0, 2, 4];

function getIntensityLevel(totalSeconds: number): number {
  if (totalSeconds === 0) return 0;
  const hours = totalSeconds / 3600;
  const index = HOUR_THRESHOLDS.findIndex((threshold) => hours >= threshold);
  return HOUR_THRESHOLDS.length - index;
}

type DaySquareProps = {
  day: HeatmapDayData;
  containerRef: React.RefObject<HTMLDivElement>;
};

function DaySquare({ day, containerRef }: DaySquareProps): React.ReactElement {
  const intensity = getIntensityLevel(day.totalSeconds);
  const hours = day.totalSeconds / 3600;
  const timeStr = formatSeconds(day.totalSeconds, { omitEmpty: false });
  const hasActivity = day.totalSeconds > 0;

  return (
    <Tooltip containerRef={containerRef}>
      <Tooltip.Target>
        <div
          data-testid="heatmap-day-square"
          data-intensity={intensity}
          data-date={day.dateStr}
          data-seconds={day.totalSeconds}
          className={`w-[11px] h-[11px] ${INTENSITY_COLORS[intensity]} border rounded-[1px] cursor-pointer hover:ring-1 hover:ring-orange-400 transition-all`}
        />
      </Tooltip.Target>
      <Tooltip.Content>
        <div className="bg-black border border-orange-500 text-orange-100 text-xs px-3 py-2 rounded shadow-lg font-mono">
          <div className="font-semibold text-orange-400">{day.dateStr}</div>
          <div className="text-orange-200">
            {hasActivity ? `${timeStr} (${hours.toFixed(1)}h)` : "NO DATA"}
          </div>
        </div>
      </Tooltip.Content>
    </Tooltip>
  );
}

export function HeatmapActivity(): React.ReactElement {
  const { heatmapData } = useUnit({
    heatmapData: $statEntriesByDayForHeatmap,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const numberOfWeeks = heatmapData.length / DAYS_PER_WEEK;
  const weeks = Array.from({ length: numberOfWeeks }, (_, i) =>
    heatmapData.slice(i * DAYS_PER_WEEK, (i + 1) * DAYS_PER_WEEK)
  );

  return (
    <div className="w-full h-full flex items-center justify-center" data-testid="heatmap-activity">
      <div
        ref={containerRef}
        className="relative p-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-lg w-full h-full"
      >
        <div className="relative px-4 py-3 bg-white rounded-lg shadow-inner w-full h-full flex items-center justify-center">
          <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-l-2 border-t-2 border-gray-300 rounded-tl" />
          <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-r-2 border-t-2 border-gray-300 rounded-tr" />
          <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-l-2 border-b-2 border-gray-300 rounded-bl" />
          <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-r-2 border-b-2 border-gray-300 rounded-br" />

          <div className="flex gap-[3px]" data-testid="heatmap-grid">
            <div className="flex flex-col gap-[3px] text-[9px] text-gray-600 mr-0.5 font-mono" data-testid="heatmap-day-labels">
              {DAY_LABELS.map((label, index) => (
                <div
                  key={index}
                  className="w-5 h-[11px] flex items-center justify-end"
                  style={{
                    visibility: VISIBLE_DAY_INDICES.includes(index)
                      ? "visible"
                      : "hidden",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="flex gap-[3px]" data-testid="heatmap-weeks">
              {weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="flex flex-col gap-[3px]"
                  data-testid={`heatmap-week-${weekIndex}`}
                >
                  {week.map((day) => (
                    <DaySquare
                      key={day.dateStr}
                      day={day}
                      containerRef={containerRef}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
