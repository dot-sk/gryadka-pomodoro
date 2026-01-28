import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
}

/**
 * Общий контейнер для страниц приложения
 * Стилизован в соответствии с Apple HIG для HUD-окон:
 * - Терминальная рамка с градиентом
 * - Белый фон с shadow-inner
 * - Закругленные углы
 * - Терминальные уголки в углах
 * (Тень настраивается на уровне Electron окна, не здесь)
 */
export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return (
    <div className="w-[360px] h-[136px] rounded-2xl">
      {/* Терминальная рамка с градиентом */}
      <div className="relative p-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl w-full h-full">
        {/* Внутренняя рамка */}
        <div className="relative bg-white rounded-lg shadow-inner w-full h-full flex items-center justify-center">
          {/* Терминальные уголки - верхний левый */}
          <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-l-2 border-t-2 border-gray-300 rounded-tl" />
          {/* Верхний правый */}
          <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-r-2 border-t-2 border-gray-300 rounded-tr" />
          {/* Нижний левый */}
          <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-l-2 border-b-2 border-gray-300 rounded-bl" />
          {/* Нижний правый */}
          <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-r-2 border-b-2 border-gray-300 rounded-br" />

          {children}
        </div>
      </div>
    </div>
  );
};
