import React, { useEffect } from "react";

interface SuccessMessageProps {
  message: string;
  duration?: number;
  hideWindowDelay?: number;
  onComplete?: () => void;
  onHideWindow?: () => void;
}

export const SuccessMessage = ({
  message,
  duration = 2000,
  hideWindowDelay,
  onComplete,
  onHideWindow
}: SuccessMessageProps) => {
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Таймер на скрытие окна (раньше чем завершение)
    if (hideWindowDelay !== undefined && onHideWindow) {
      timers.push(setTimeout(() => {
        onHideWindow();
      }, hideWindowDelay));
    }

    // Таймер на завершение
    timers.push(setTimeout(() => {
      onComplete?.();
    }, duration));

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [duration, hideWindowDelay, onComplete, onHideWindow]);

  // Размеры совпадают с canvas таймера (304x88) + padding px-6 py-5 (24px, 20px)
  // Итого внутренняя область: 304px x 88px
  return (
    <div
      className="relative flex flex-col items-center gap-3"
      data-testid="success-message"
    >
      {/* Терминальная рамка с градиентом (как у CanvasCountdown) */}
      <div
        className="relative p-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-lg"
        data-testid="success-message-border"
      >
        {/* Внутренняя рамка - px-6 py-5 как у CanvasCountdown */}
        <div className="relative px-6 py-5 bg-white rounded-lg shadow-inner">
          {/* Терминальные уголки - верхний левый */}
          <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-gray-300 rounded-tl" />
          {/* Верхний правый */}
          <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-gray-300 rounded-tr" />
          {/* Нижний левый */}
          <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-gray-300 rounded-bl" />
          {/* Нижний правый */}
          <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-gray-300 rounded-br" />

          {/* Контент - фиксированный размер как у canvas таймера */}
          <div 
            className="flex flex-col items-center justify-center gap-2"
            style={{ width: 304, height: 88 }}
          >
            {/* Пиксельная галочка */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 48 48"
              className="text-green-600"
              style={{ imageRendering: "pixelated" }}
            >
              {/* Пиксельная галочка в стиле dot matrix */}
              <rect x="32" y="8" width="8" height="8" fill="currentColor" />
              <rect x="24" y="16" width="8" height="8" fill="currentColor" />
              <rect x="32" y="16" width="8" height="8" fill="currentColor" />
              <rect x="16" y="24" width="8" height="8" fill="currentColor" />
              <rect x="24" y="24" width="8" height="8" fill="currentColor" />
              <rect x="8" y="16" width="8" height="8" fill="currentColor" />
              <rect x="16" y="16" width="8" height="8" fill="currentColor" />
            </svg>

            {/* Текст в моноширинном шрифте */}
            <p className="text-xs font-mono text-gray-800 tracking-wide uppercase">
              {message} ✓
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
