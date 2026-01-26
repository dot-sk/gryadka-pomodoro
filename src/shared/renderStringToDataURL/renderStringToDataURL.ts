/**
 * Function receives a string of text and returns a data URL of the rendered text.
 * Рисует залитый скруглённый прямоугольник с вырезанным (прозрачным) текстом.
 * Для template image на macOS: фон адаптируется к теме, текст показывает цвет трея.
 */
export function renderStringToDataURL(
  text: string,
  _theme: 'dark' | 'light' = 'dark',
  canvas?: HTMLCanvasElement
): string {
  const canvasRender = canvas || document.createElement("canvas");

  canvasRender.width = 100;
  canvasRender.height = 36;

  const ctx = canvasRender.getContext("2d");

  if (!ctx) {
    return "";
  }

  // Очищаем canvas
  ctx.clearRect(0, 0, canvasRender.width, canvasRender.height);

  // Рисуем залитый скруглённый прямоугольник
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  roundRectFill(ctx, 2, 2, canvasRender.width - 4, canvasRender.height - 4, 8);

  // Вырезаем текст (делаем прозрачным)
  ctx.globalCompositeOperation = 'destination-out';
  ctx.font = '24px "IBM Plex Mono"';
  ctx.textAlign = "center";
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  ctx.fillText(text, canvasRender.width * 0.5, 27);

  // Возвращаем режим по умолчанию
  ctx.globalCompositeOperation = 'source-over';

  return canvasRender.toDataURL("image/png");
}

function roundRectFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}
