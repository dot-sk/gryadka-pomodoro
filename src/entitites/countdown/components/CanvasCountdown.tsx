import { useEffect, useRef, useMemo } from "react";
import { useUnit } from "effector-react";
import { formatSeconds } from "../../../shared/utils";
import {
  $time,
  $currentInterval,
  $isRunning,
  $isPaused,
  $canEditTime,
  events,
} from "../model";
import { DotMatrixCanvas } from "../../../shared/components/DotMatrixCanvas/DotMatrixCanvas";
import { createTimerMatrix } from "../../../shared/utils/matrixUtils";

export const CanvasCountdown = () => {
  const { time, currentInterval: rawInterval, isRunning, isPaused, canEditTime } = useUnit({
    time: $time,
    currentInterval: $currentInterval,
    isRunning: $isRunning,
    isPaused: $isPaused,
    canEditTime: $canEditTime,
  });
  const currentInterval = rawInterval || 1;

  // Вычисляем прогресс: +1 к time т.к. показываем interval-1 при старте
  const progress = currentInterval > 0 ? Math.min(1, (time + 1) / currentInterval) : 1;

  // Форматируем время
  const timeString = formatSeconds(time);

  // Определяем нужен ли компактный режим для HH:MM:SS
  const isCompact = timeString.length >= 8;

  // Параметры в зависимости от формата
  const dotSize = isCompact ? 6 : 8;
  const dotGap = isCompact ? 3 : 4;

  // Параметры для layout в точках (не пикселях)
  const charGap = 1;
  const padding = 1;

  // Создаем матрицу для отображения
  const matrix = useMemo(
    () => createTimerMatrix(timeString, progress, { charGap, padding, isPaused }),
    [timeString, progress, charGap, padding, isPaused]
  );

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
      // Adjust time (only before first start)
      if (canEditTimeRef.current && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
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
    events.togglePlayPause();
  };

  const handleDoubleClick = () => {
    events.stop({ save: true });
  };

  return (
    <div
      className="flex items-center justify-center"
      data-testid="canvas-countdown-container"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: "pointer" }}
    >
      <DotMatrixCanvas
        matrix={matrix}
        dotSize={dotSize}
        dotGap={dotGap}
        data-testid="canvas-countdown-display"
        className="block"
      />
    </div>
  );
};
