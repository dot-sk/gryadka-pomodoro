export type TooltipPosition = "top" | "bottom" | "left" | "right";

export type AvailableSpace = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type PositionConfig = {
  targetRect: DOMRect;
  tooltipRect: DOMRect;
  position: TooltipPosition;
  offset: number;
};

export type Coordinates = {
  x: number;
  y: number;
};

export function calculateAvailableSpace(
  targetRect: DOMRect,
  containerRect: DOMRect,
  tooltipRect: DOMRect,
  offset: number = 8
): AvailableSpace {
  return {
    top: targetRect.top - containerRect.top - tooltipRect.height - offset,
    bottom: containerRect.bottom - targetRect.bottom - tooltipRect.height - offset,
    left: targetRect.left - containerRect.left - tooltipRect.width - offset,
    right: containerRect.right - targetRect.right - tooltipRect.width - offset,
  };
}

export function resolveOptimalPosition(space: AvailableSpace): TooltipPosition {
  const hasVerticalSpace = space.top >= 0 || space.bottom >= 0;

  if (hasVerticalSpace) {
    return space.top >= space.bottom ? "top" : "bottom";
  }

  const hasHorizontalSpace = space.left >= 0 || space.right >= 0;

  if (hasHorizontalSpace) {
    return space.left >= space.right ? "left" : "right";
  }

  return "top";
}

export function calculateTooltipCoordinates(config: PositionConfig): Coordinates {
  const { targetRect, tooltipRect, position, offset } = config;
  const centerX = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
  const centerY = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;

  switch (position) {
    case "top":
      return { x: centerX, y: targetRect.top - tooltipRect.height - offset };
    case "bottom":
      return { x: centerX, y: targetRect.bottom + offset };
    case "left":
      return { x: targetRect.left - tooltipRect.width - offset, y: centerY };
    case "right":
      return { x: targetRect.right + offset, y: centerY };
  }
}

export function clampTooltipToContainer(
  coordinates: Coordinates,
  tooltipRect: DOMRect,
  containerRect: DOMRect
): Coordinates {
  const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));

  return {
    x: clamp(coordinates.x, containerRect.left, containerRect.right - tooltipRect.width),
    y: clamp(coordinates.y, containerRect.top, containerRect.bottom - tooltipRect.height),
  };
}
