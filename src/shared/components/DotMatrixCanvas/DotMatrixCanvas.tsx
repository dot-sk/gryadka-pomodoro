import React, { useEffect, useRef } from "react";

export interface DotMatrixCanvasProps {
  /** Матрица точек для отрисовки (1 = рисовать, 0 = пустое место) */
  matrix: number[][];
  /** Размер одной точки в пикселях */
  dotSize: number;
  /** Промежуток между точками в пикселях */
  dotGap: number;
  /** Дополнительные CSS классы */
  className?: string;
  /** CSS стили */
  style?: React.CSSProperties;
  /** data-testid для тестов */
  "data-testid"?: string;
}

/**
 * Компонент для отрисовки dot matrix на canvas
 * Принимает матрицу точек и рисует квадратики
 *
 * В будущем может поддерживать эффекты (гравитация, разлет и т.д.)
 */
export const DotMatrixCanvas: React.FC<DotMatrixCanvasProps> = ({
  matrix,
  dotSize,
  dotGap,
  className = "",
  style = {},
  "data-testid": dataTestId = "dot-matrix-canvas",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dotStep = dotSize + dotGap;

    // Вычисляем размеры canvas
    const rows = matrix.length;
    const cols = Math.max(...matrix.map((row) => row.length));

    canvas.width = cols * dotStep - dotGap;
    canvas.height = rows * dotStep - dotGap;

    // Очищаем и настраиваем стиль
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 1)";

    // Рисуем точки
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 1) {
          const x = col * dotStep;
          const y = row * dotStep;
          ctx.fillRect(x, y, dotSize, dotSize);
        }
      }
    }
  }, [matrix, dotSize, dotGap]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ imageRendering: "pixelated", ...style }}
      data-testid={dataTestId}
    />
  );
};
