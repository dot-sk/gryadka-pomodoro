/**
 * Dot matrix font - 3 columns x 5 rows для каждого символа (компактный вариант)
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

/**
 * Пиксельная помидорка - кадры анимации для скринсейвера в стиле Flipper Zero
 * Помидорка с глазками, моргает и покачивается
 */
const TOMATO_FRAMES: number[][][] = [
  // Кадр 1 - обычный, смотрит прямо
  [
    [0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
  ],
  // Кадр 2 - моргает
  [
    [0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 1, 1, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
  ],
  // Кадр 3 - смотрит прямо (повтор для ритма)
  [
    [0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
  ],
  // Кадр 4 - смотрит влево
  [
    [0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
  ],
  // Кадр 5 - смотрит прямо
  [
    [0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
  ],
  // Кадр 6 - смотрит вправо
  [
    [0, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0],
  ],
];

const DOT_SIZE = 4;       // размер точки
const DOT_GAP = 2;        // промежуток между точками
const CHAR_GAP = 4;       // промежуток между символами
const CHAR_WIDTH = 3;     // ширина символа в точках
const CHAR_HEIGHT = 5;    // высота символа в точках
const TOMATO_SMALL_SIZE = 5; // размер маленькой помидорки
const PADDING = 4;        // отступы

// Маленькая помидорка 5x5 для отображения рядом с таймером
const TOMATO_SMALL: number[][] = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
];

let animationFrame = 0;

interface RenderOptions {
  text: string;
  isPaused?: boolean;
  canvas?: HTMLCanvasElement;
}

/**
 * Рисует dot matrix на canvas в стиле Flipper Zero.
 * Всегда показывает таймер с помидоркой (прогрессом).
 * progress: 0-1, где 1 = полная помидорка, 0 = пустая
 * isPaused: не влияет на рендер, время всегда отображается
 */
export function renderStringToDataURL(
  text: string,
  _theme: 'dark' | 'light' = 'dark',
  canvas?: HTMLCanvasElement,
  _isPaused?: boolean,
  progress: number = 1
): string {
  return renderTimer(text, canvas, progress);
}

/**
 * Рендер таймера с помидоркой слева (помидорка уменьшается как прогресс-бар)
 */
function renderTimer(text: string, canvas?: HTMLCanvasElement, progress: number = 1): string {
  const canvasRender = canvas || document.createElement("canvas");

  const dotStep = DOT_SIZE + DOT_GAP;
  const charPixelWidth = CHAR_WIDTH * dotStep - DOT_GAP;
  const charPixelHeight = CHAR_HEIGHT * dotStep - DOT_GAP;
  const tomatoPixelWidth = TOMATO_SMALL_SIZE * dotStep - DOT_GAP;
  const textWidth = text.length * (charPixelWidth + CHAR_GAP) - CHAR_GAP;
  const totalWidth = tomatoPixelWidth + CHAR_GAP * 2 + textWidth + PADDING * 2;

  canvasRender.width = totalWidth;
  canvasRender.height = charPixelHeight + PADDING * 2;

  const ctx = canvasRender.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, canvasRender.width, canvasRender.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';

  let offsetX = PADDING;
  const offsetY = PADDING;

  // Помидорка с прогрессом (заполняется снизу вверх)
  drawTomatoWithProgress(ctx, offsetX, offsetY, progress);
  offsetX += tomatoPixelWidth + CHAR_GAP * 2;

  // Таймер
  for (const char of text) {
    const matrix = DOT_MATRIX_FONT[char];
    if (matrix) {
      drawDotMatrix(ctx, matrix, offsetX, offsetY);
    }
    offsetX += charPixelWidth + CHAR_GAP;
  }

  return canvasRender.toDataURL("image/png");
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
 * Рендер анимированной помидорки (скринсейвер при паузе)
 */
function renderTomatoScreensaver(canvas?: HTMLCanvasElement): string {
  const canvasRender = canvas || document.createElement("canvas");

  const dotStep = DOT_SIZE + DOT_GAP;
  const tomatoWidth = 9;
  const tomatoHeight = 9;
  const pixelWidth = tomatoWidth * dotStep - DOT_GAP;
  const pixelHeight = tomatoHeight * dotStep - DOT_GAP;

  canvasRender.width = pixelWidth + PADDING * 2;
  canvasRender.height = pixelHeight + PADDING * 2;

  const ctx = canvasRender.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, canvasRender.width, canvasRender.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';

  // Переключаем кадр анимации
  animationFrame = (animationFrame + 1) % TOMATO_FRAMES.length;
  drawDotMatrix(ctx, TOMATO_FRAMES[animationFrame], PADDING, PADDING);

  return canvasRender.toDataURL("image/png");
}

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
