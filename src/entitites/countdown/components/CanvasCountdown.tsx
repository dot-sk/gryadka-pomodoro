import React, { useEffect, useRef } from "react";
import { useStore } from "effector-react";
import { formatSeconds } from "../../../shared/utils";
import { $countdownType, $time, $currentInterval } from "../model";
import { IntervalTypeEmoji } from "../constants";
import { renderLargeTimer } from "../../../shared/renderLargeTimer/renderLargeTimer";

export const CanvasCountdown = () => {
  const time = useStore($time);
  const type = useStore($countdownType);
  const currentInterval = useStore($currentInterval) || 1;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Вычисляем прогресс: +1 к time т.к. показываем interval-1 при старте
  const progress = currentInterval > 0 ? Math.min(1, (time + 1) / currentInterval) : 1;

  useEffect(() => {
    if (!canvasRef.current) return;

    const timeString = formatSeconds(time);
    renderLargeTimer(timeString, canvasRef.current, progress);
  }, [time, progress]);

  return (
    <div
      className="relative flex flex-col items-center gap-3"
      data-testid="canvas-countdown-container"
    >
      {/* Терминальная рамка с градиентом */}
      <div
        className="relative p-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-lg"
        data-testid="canvas-countdown-border"
      >
        {/* Внутренняя рамка */}
        <div className="relative px-6 py-5 bg-white rounded-lg shadow-inner">
          {/* Терминальные уголки - верхний левый */}
          <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-gray-300 rounded-tl" />
          {/* Верхний правый */}
          <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-gray-300 rounded-tr" />
          {/* Нижний левый */}
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-gray-300 rounded-bl" />
          {/* Нижний правый */}
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-gray-300 rounded-br" />

          {/* Canvas дисплей */}
          <canvas
            ref={canvasRef}
            data-testid="canvas-countdown-display"
            className="block"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      {/* Эмодзи типа интервала */}
      <span
        className="text-2xl text-center font-mono select-none opacity-80"
        data-testid="canvas-countdown-emoji"
      >
        {IntervalTypeEmoji[type]}
      </span>
    </div>
  );
};
