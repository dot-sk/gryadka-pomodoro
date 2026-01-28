import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import {
  calculateAvailableSpace,
  resolveOptimalPosition,
  calculateTooltipCoordinates,
  clampTooltipToContainer,
  type TooltipPosition,
} from "./tooltipPositioning";

type TooltipContextValue = {
  targetRef: React.RefObject<HTMLElement>;
  containerRef: React.RefObject<HTMLElement> | null;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  offset: number;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext(): TooltipContextValue {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error(
      "Tooltip compound components must be used within a Tooltip component"
    );
  }
  return context;
}

type TooltipRootProps = {
  containerRef?: React.RefObject<HTMLElement> | null;
  offset?: number;
  children: ReactNode;
};

function TooltipRoot({
  containerRef = null,
  offset = 8,
  children,
}: TooltipRootProps): React.ReactElement {
  const targetRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TooltipContext.Provider
      value={{
        targetRef,
        containerRef,
        isVisible,
        setIsVisible,
        offset,
      }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

type TooltipTargetProps = {
  children: ReactNode;
  className?: string;
};

function TooltipTarget({
  children,
  className = "",
}: TooltipTargetProps): React.ReactElement {
  const { targetRef, setIsVisible } = useTooltipContext();

  return (
    <div
      ref={targetRef as React.RefObject<HTMLDivElement>}
      className={className}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
    </div>
  );
}

type TooltipContentProps = {
  children: ReactNode;
  className?: string;
};

function TooltipContent({
  children,
  className = "",
}: TooltipContentProps): React.ReactElement | null {
  const { targetRef, containerRef, isVisible, offset } = useTooltipContext();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TooltipPosition>("top");
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isVisible || !targetRef.current || !tooltipRef.current) {
      return;
    }

    const calculatePositionAndCoordinates = () => {
      if (!targetRef.current || !tooltipRef.current) return;

      const targetRect = targetRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      const containerRect = containerRef?.current
        ? containerRef.current.getBoundingClientRect()
        : ({
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
            width: window.innerWidth,
            height: window.innerHeight,
          } as DOMRect);

      const availableSpace = calculateAvailableSpace(
        targetRect,
        containerRect,
        tooltipRect,
        offset
      );

      const optimalPosition = resolveOptimalPosition(availableSpace);

      const coords = calculateTooltipCoordinates({
        targetRect,
        tooltipRect,
        position: optimalPosition,
        offset,
      });

      // Ограничиваем координаты тултипа границами контейнера
      const clampedCoords = clampTooltipToContainer(
        coords,
        tooltipRect,
        containerRect
      );

      setPosition(optimalPosition);
      setCoordinates(clampedCoords);
    };

    calculatePositionAndCoordinates();

    window.addEventListener("resize", calculatePositionAndCoordinates);
    window.addEventListener("scroll", calculatePositionAndCoordinates, true);

    return () => {
      window.removeEventListener("resize", calculatePositionAndCoordinates);
      window.removeEventListener("scroll", calculatePositionAndCoordinates, true);
    };
  }, [isVisible, targetRef, containerRef, offset]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={tooltipRef}
      data-testid="tooltip"
      data-position={position}
      className={`fixed z-50 pointer-events-none ${className}`}
      style={{
        left: `${coordinates.x}px`,
        top: `${coordinates.y}px`,
      }}
    >
      {children}
    </div>
  );
}

export const Tooltip = Object.assign(TooltipRoot, {
  Target: TooltipTarget,
  Content: TooltipContent,
});

export type { TooltipRootProps as TooltipProps };
