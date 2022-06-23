// function clamps between min and max
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type CircleProgressProps = {
  progress: number;
  radius?: number;
  strokeWidth?: number;
  inverse?: boolean;
  animate?: boolean;
  className?: string;
  shadow?: boolean;
};

// A react component that displays svg circle progress
export const CircleProgress = ({
  progress,
  radius = 50,
  strokeWidth = 10,
  inverse = false,
  animate = true,
  className = "",
  shadow = true,
}: CircleProgressProps) => {
  const progressInverse = progress === 0 ? 0 : 1 - progress;
  const radiusMinusStrokeWidth = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * radiusMinusStrokeWidth;
  const progressInDegrees = (inverse ? progressInverse : progress) * 360;
  const progressInDegreesClamped = clamp(progressInDegrees, 0, 360);
  const strokeDashoffset =
    circumference - (progressInDegreesClamped * circumference) / 360;
  const strokeDasharray = `${circumference} ${circumference}`;

  return (
    <div className={`rounded-full overflow-hidden ${className}`}>
      <svg
        width={radius * 2}
        height={radius * 2}
        className="transform -rotate-90 origin-center block"
      >
        <foreignObject x="0" y="0" width={radius * 2} height={radius * 2}>
          <div
            className="w-full h-full"
            style={{
              background: "var(--progress-ring-background)",
            }}
          />
        </foreignObject>

        <g className="mix-blend-lighten">
          <rect x="0" y="0" width="100%" height="100%" fill="var(--bg-color)" />
          {shadow && (
            <circle
              cx={radius}
              cy={radius}
              r={radiusMinusStrokeWidth}
              fill="none"
              strokeWidth={strokeWidth}
              stroke="#eaeaea"
              strokeLinecap="round"
            />
          )}
          <circle
            cx={radius}
            cy={radius}
            r={radiusMinusStrokeWidth}
            fill="none"
            strokeWidth={strokeWidth}
            stroke="#000000"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={
              animate ? "transition-all ease-linear duration-1000" : ""
            }
          />
        </g>
      </svg>
    </div>
  );
};
