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

  // Размеры совпадают с canvas таймера (304x88)
  return (
    <div
      className="flex items-center justify-center"
      data-testid="success-message"
    >
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
  );
};
