import React, { useEffect, useRef } from "react";
import { useUnit } from "effector-react";
import { formatSeconds } from "../../../shared/utils";
import {
  $time,
  $currentInterval,
  $isRunning,
  $canEditTime,
  events,
} from "../model";
import { renderLargeTimer } from "../../../shared/renderLargeTimer/renderLargeTimer";

export const CanvasCountdown = () => {
  const { time, currentInterval: rawInterval, isRunning, canEditTime } = useUnit({
    time: $time,
    currentInterval: $currentInterval,
    isRunning: $isRunning,
    canEditTime: $canEditTime,
  });
  const currentInterval = rawInterval || 1;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Вычисляем прогресс: +1 к time т.к. показываем interval-1 при старте
  const progress = currentInterval > 0 ? Math.min(1, (time + 1) / currentInterval) : 1;

  useEffect(() => {
    if (!canvasRef.current) return;

    const timeString = formatSeconds(time);
    renderLargeTimer(timeString, canvasRef.current, progress);
  }, [time, progress]);

  // Refs для отслеживания состояния зажатых клавиш
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdDirectionRef = useRef<"left" | "right" | null>(null);
  const holdCountRef = useRef(0);
  // Ref для актуального значения time (чтобы интервал видел актуальное значение)
  const timeRef = useRef(time);
  timeRef.current = time;
  // Ref для canEditTime
  const canEditTimeRef = useRef(canEditTime);
  canEditTimeRef.current = canEditTime;

  useEffect(() => {
    const clearHoldInterval = () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
      }
      holdDirectionRef.current = null;
      holdCountRef.current = 0;
    };

    const adjustTime = (direction: "left" | "right") => {
      // Ускорение: после нескольких повторов увеличиваем шаг
      const count = holdCountRef.current;
      let step = 60; // базовый шаг 1 минута
      if (count > 10) {
        step = 300; // после 10 повторов - 5 минут
      } else if (count > 5) {
        step = 120; // после 5 повторов - 2 минуты
      }

      const MAX_TIME = 2 * 60 * 60; // 2 часа максимум
      const currentTime = timeRef.current; // Берём актуальное значение из ref
      if (direction === "left") {
        events.setTime(Math.max(0, currentTime - step));
      } else {
        events.setTime(Math.min(MAX_TIME, currentTime + step));
      }
      holdCountRef.current++;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ([" ", "Enter", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }

      // Toggle play/pause
      if (e.key === " " || e.key === "Enter") {
        if (isRunning) {
          events.pause();
        } else {
          events.resume();
        }
      }

      // Adjust time (only before first start)
      if (canEditTimeRef.current && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const direction = e.key === "ArrowLeft" ? "left" : "right";
        
        // Первое нажатие - сразу меняем время
        if (!e.repeat) {
          holdDirectionRef.current = direction;
          holdCountRef.current = 0;
          adjustTime(direction);
          
          // Запускаем интервал для удержания
          clearHoldInterval();
          holdIntervalRef.current = setInterval(() => {
            adjustTime(direction);
          }, 150); // Повторять каждые 150ms при удержании
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        clearHoldInterval();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearHoldInterval();
    };
  }, [isRunning]);

  const handleClick = () => {
    if (isRunning) {
      events.pause();
    } else {
      events.resume();
    }
  };

  const handleDoubleClick = () => {
    events.stop({ save: true });
  };

  return (
    <div
      className="relative flex flex-col items-center gap-3"
      data-testid="canvas-countdown-container"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: "pointer" }}
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

    </div>
  );
};
