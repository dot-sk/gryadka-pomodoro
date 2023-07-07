const getColor = (theme: 'dark' | 'light') => {
  if (theme === 'dark') {
    return 'rgba(255, 255, 255, 0.85)';
  }

  return 'rgba(0, 0, 0, 0.85)';
}

/**
 * Function receives a string of text and returns a data URL of the rendered text.
 * @param canvas
 */
export function renderStringToDataURL(
  text: string,
  theme: 'dark' | 'light' = 'dark',
  canvas?: HTMLCanvasElement
): string {
  const canvasRender = canvas || document.createElement("canvas");

  canvasRender.width = 100;
  canvasRender.height = 36;

  const ctx = canvasRender.getContext("2d");

  if (!ctx) {
    return "";
  }

  const color = getColor(theme);

  ctx.font = '24px "IBM Plex Mono"';
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  roundRect(
    ctx,
    ctx.lineWidth,
    ctx.lineWidth,
    canvasRender.width - ctx.lineWidth * 2,
    canvasRender.height - ctx.lineWidth * 2,
    8
  );

  // draw text
  ctx.fillText(text, canvasRender.width * 0.5, 27);

  const dataURL = canvasRender.toDataURL("image/png");

  return dataURL;
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  var r = x + w;
  var b = y + h;
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(r - radius, y);
  context.quadraticCurveTo(r, y, r, y + radius);
  context.lineTo(r, y + h - radius);
  context.quadraticCurveTo(r, b, r - radius, b);
  context.lineTo(x + radius, b);
  context.quadraticCurveTo(x, b, x, b - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.stroke();
}
