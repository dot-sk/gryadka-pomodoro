/**
 * Dot matrix font - 3 columns x 5 rows для каждого символа
 * 1 = точка, 0 = пусто
 */
const DOT_MATRIX_FONT: Record<string, number[][]> = {
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
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ],
};

// Маленькая помидорка 5x5 для отображения с прогрессом
const TOMATO_SMALL: number[][] = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
];

// Увеличенные параметры для большого дисплея
const DOT_SIZE = 8;       // размер точки (в 2 раза больше чем для трея)
const DOT_GAP = 4;        // промежуток между точками
const CHAR_GAP = 8;       // промежуток между символами
const CHAR_WIDTH = 3;     // ширина символа в точках
const CHAR_HEIGHT = 5;    // высота символа в точках
const TOMATO_SIZE = 5;    // размер помидорки
const PADDING = 16;       // отступы вокруг содержимого

/**
 * Рендерит большой пиксельный таймер на canvas в стиле Flipper Zero
 * progress: 0-1, где 1 = полная помидорка, 0 = пустая
 */
export function renderLargeTimer(
  text: string,
  canvas: HTMLCanvasElement,
  progress: number = 1
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dotStep = DOT_SIZE + DOT_GAP;
  const charPixelWidth = CHAR_WIDTH * dotStep - DOT_GAP;
  const charPixelHeight = CHAR_HEIGHT * dotStep - DOT_GAP;
  const tomatoPixelWidth = TOMATO_SIZE * dotStep - DOT_GAP;
  const textWidth = text.length * (charPixelWidth + CHAR_GAP) - CHAR_GAP;
  const totalWidth = tomatoPixelWidth + CHAR_GAP * 3 + textWidth + PADDING * 2;
  const totalHeight = charPixelHeight + PADDING * 2;

  // Устанавливаем размеры canvas
  canvas.width = totalWidth;
  canvas.height = totalHeight;

  // Очищаем canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0, 1)";

  let offsetX = PADDING;
  const offsetY = PADDING;

  // Рисуем помидорку с прогрессом (заполняется снизу вверх)
  drawTomatoWithProgress(ctx, offsetX, offsetY, progress);
  offsetX += tomatoPixelWidth + CHAR_GAP * 3;

  // Рисуем таймер
  for (const char of text) {
    const matrix = DOT_MATRIX_FONT[char];
    if (matrix) {
      drawDotMatrix(ctx, matrix, offsetX, offsetY);
    }
    offsetX += charPixelWidth + CHAR_GAP;
  }
}

/**
 * Рисует помидорку с прогрессом - точки исчезают сверху вниз
 */
function drawTomatoWithProgress(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  progress: number
) {
  const dotStep = DOT_SIZE + DOT_GAP;

  // Собираем все точки помидорки сверху вниз, слева направо
  const allDots: { row: number; col: number }[] = [];
  for (let row = 0; row < TOMATO_SMALL.length; row++) {
    for (let col = 0; col < TOMATO_SMALL[row].length; col++) {
      if (TOMATO_SMALL[row][col] === 1) {
        allDots.push({ row, col });
      }
    }
  }

  // Сколько точек показывать (с конца - снизу)
  const visibleDots = Math.ceil(allDots.length * progress);

  // Рисуем только видимые точки (последние N точек = нижние)
  for (let i = allDots.length - visibleDots; i < allDots.length; i++) {
    const { row, col } = allDots[i];
    const x = startX + col * dotStep;
    const y = startY + row * dotStep;
    ctx.fillRect(x, y, DOT_SIZE, DOT_SIZE);
  }
}

/**
 * Рисует dot matrix на canvas
 */
function drawDotMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: number[][],
  startX: number,
  startY: number
) {
  const dotStep = DOT_SIZE + DOT_GAP;

  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] === 1) {
        const x = startX + col * dotStep;
        const y = startY + row * dotStep;
        ctx.fillRect(x, y, DOT_SIZE, DOT_SIZE);
      }
    }
  }
}
