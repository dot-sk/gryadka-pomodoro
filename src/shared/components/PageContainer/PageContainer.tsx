import React from "react";
import { useLiquidGlass } from "../../liquidGlass";

interface PageContainerProps {
  children: React.ReactNode;
}

/**
 * Общий контейнер для страниц приложения
 * Стилизован в соответствии с Apple HIG для HUD-окон:
 * - Прозрачный фон для поддержки Liquid Glass эффекта (macOS 26+)
 * - Fallback на классические стили для других систем
 * - Терминальные уголки в углах
 * - Закругленные углы
 */
export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  const { isLiquidGlassEnabled } = useLiquidGlass();

  // Стили для Liquid Glass режима (прозрачный фон)
  const liquidGlassStyles = {
    outer: "relative p-1 rounded-xl w-full h-full",
    inner: "relative rounded-lg w-full h-full flex items-center justify-center",
    corners: "border-gray-400/50",
  };

  // Классические стили (белый фон с градиентом)
  const classicStyles = {
    outer: "relative p-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl w-full h-full",
    inner: "relative bg-white rounded-lg shadow-inner w-full h-full flex items-center justify-center",
    corners: "border-gray-300",
  };

  const styles = isLiquidGlassEnabled ? liquidGlassStyles : classicStyles;

  return (
    <div className="w-[360px] h-[136px] rounded-2xl">
      <div className={styles.outer}>
        <div className={styles.inner}>
          {/* Терминальные уголки - верхний левый */}
          <div className={`absolute top-1.5 left-1.5 w-2.5 h-2.5 border-l-2 border-t-2 ${styles.corners} rounded-tl`} />
          {/* Верхний правый */}
          <div className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 border-r-2 border-t-2 ${styles.corners} rounded-tr`} />
          {/* Нижний левый */}
          <div className={`absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-l-2 border-b-2 ${styles.corners} rounded-bl`} />
          {/* Нижний правый */}
          <div className={`absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-r-2 border-b-2 ${styles.corners} rounded-br`} />

          {children}
        </div>
      </div>
    </div>
  );
};
