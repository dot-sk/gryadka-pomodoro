/**
 * Dot matrix font - 3 columns x 5 rows для каждого символа
 * 1 = точка, 0 = пусто
 */
export const DOT_MATRIX_FONT: Record<string, number[][]> = {
  "0": [
    [1, 1, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  "1": [
    [0, 1, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 1],
  ],
  "2": [
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
  ],
  "3": [
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  "4": [
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  "5": [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  "6": [
    [1, 1, 1],
    [1, 0, 0],
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  "7": [
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
  ],
  "8": [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ],
  "9": [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 0, 1],
    [1, 1, 1],
  ],
  ":": [
    [0],
    [1],
    [0],
    [1],
    [0],
  ],
};

// Маленькая помидорка 5x5 для отображения с прогрессом
export const TOMATO_MATRIX: number[][] = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
];

// Иконка паузы 5x5 - две вертикальные палочки
export const PAUSE_MATRIX: number[][] = [
  [1, 1, 0, 1, 1],
  [1, 1, 0, 1, 1],
  [1, 1, 0, 1, 1],
  [1, 1, 0, 1, 1],
  [1, 1, 0, 1, 1],
];

export interface MatrixLayoutOptions {
  /** Промежуток между символами в точках */
  charGap: number;
  /** Отступы в точках */
  padding: number;
  /** Таймер на паузе - показывать иконку паузы вместо помидорки */
  isPaused?: boolean;
}

/**
 * Создает матрицу для таймера (помидорка/пауза + текст + padding)
 */
export function createTimerMatrix(
  text: string,
  progress: number,
  options: MatrixLayoutOptions
): number[][] {
  const { charGap, padding, isPaused } = options;

  const charHeightDots = 5;
  const tomatoSizeDots = 5;

  // Вычисляем реальную ширину текста с учетом разных ширин символов
  let textWidth = 0;
  for (let i = 0; i < text.length; i++) {
    const charMatrix = DOT_MATRIX_FONT[text[i]];
    if (charMatrix) {
      textWidth += charMatrix[0].length;
      if (i < text.length - 1) {
        textWidth += charGap;
      }
    }
  }

  // Вычисляем размеры матрицы в точках
  const tomatoWidth = tomatoSizeDots;
  const totalWidth = padding + tomatoWidth + 2 + textWidth + padding;
  const totalHeight = padding + charHeightDots + padding;

  // Создаем пустую матрицу
  const matrix: number[][] = Array(totalHeight)
    .fill(0)
    .map(() => Array(totalWidth).fill(0));

  let offsetX = padding;
  const offsetY = padding;

  // При паузе - иконка паузы, иначе помидорка с прогрессом
  if (isPaused) {
    mergeMatrix(matrix, PAUSE_MATRIX, offsetX, offsetY);
  } else {
    addTomatoWithProgress(matrix, offsetX, offsetY, progress);
  }
  offsetX += tomatoWidth + 2;

  // Добавляем символы
  for (const char of text) {
    const charMatrix = DOT_MATRIX_FONT[char];
    if (charMatrix) {
      mergeMatrix(matrix, charMatrix, offsetX, offsetY);
      offsetX += charMatrix[0].length + charGap;
    }
  }

  return matrix;
}

/**
 * Объединяет две матрицы (добавляет source в target со смещением)
 */
export function mergeMatrix(
  target: number[][],
  source: number[][],
  offsetX: number,
  offsetY: number
): void {
  for (let row = 0; row < source.length; row++) {
    for (let col = 0; col < source[row].length; col++) {
      if (source[row][col] === 1) {
        target[offsetY + row][offsetX + col] = 1;
      }
    }
  }
}

/**
 * Добавляет помидорку с прогрессом (заполнение снизу вверх)
 */
export function addTomatoWithProgress(
  target: number[][],
  offsetX: number,
  offsetY: number,
  progress: number
): void {
  // Собираем все точки помидорки
  const allDots: { row: number; col: number }[] = [];
  for (let row = 0; row < TOMATO_MATRIX.length; row++) {
    for (let col = 0; col < TOMATO_MATRIX[row].length; col++) {
      if (TOMATO_MATRIX[row][col] === 1) {
        allDots.push({ row, col });
      }
    }
  }

  // Вычисляем сколько точек показывать (заполнение снизу вверх)
  const visibleDots = Math.ceil(allDots.length * progress);

  // Добавляем видимые точки (последние N = нижние)
  for (let i = allDots.length - visibleDots; i < allDots.length; i++) {
    const { row, col } = allDots[i];
    target[offsetY + row][offsetX + col] = 1;
  }
}
