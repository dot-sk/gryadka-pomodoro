/**
 * Function receives a string of text and returns a data URL of the rendered text.
 * @param canvas
 */
export function renderStringToDataURL(
  text: string,
  canvas?: HTMLCanvasElement
): string {
  const canvasRender = canvas || document.createElement("canvas");
  const ctx = canvasRender.getContext("2d")!;
  ctx.font = "16px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(text, 0, 25);

  canvasRender.width = ctx.measureText(text).width;
  canvasRender.height = 25;
  canvasRender.style.width = canvasRender.width + "px";
  canvasRender.style.height = canvasRender.height + "px";

  return canvasRender.toDataURL();
}
