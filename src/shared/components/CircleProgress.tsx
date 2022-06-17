// function clamps between min and max
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

type CircleProgressProps = {
  progress: number;
  radius?: number;
  strokeWidth?: number;
  strokeColor?: string;
  shadowOpacity?: number;
  shadowColor?: string;
  inverse?: boolean;
  animate?: boolean;
};

// A react component that displays svg circle progress
export const CircleProgress = ({
  progress,
  radius = 50,
  strokeWidth = 10,
  strokeColor = "#000",
  shadowOpacity = 0.3,
  shadowColor = "#000",
  inverse = false,
  animate = true,
}: CircleProgressProps) => {
  const progressInverse = progress === 0 ? 0 : 1 - progress;
  const circumference = 2 * Math.PI * radius;
  const progressInDegrees = (inverse ? progressInverse : progress) * 360;
  const progressInDegreesClamped = clamp(progressInDegrees, 0, 360);
  const strokeDashoffset =
    circumference - (progressInDegreesClamped * circumference) / 360;
  const strokeDasharray = `${circumference} ${circumference}`;

  return (
    <svg
      width={radius * 2}
      height={radius * 2}
      className="transform -rotate-90 origin-center block"
    >
      <circle
        cx={radius}
        cy={radius}
        r={radius - strokeWidth}
        fill="none"
        strokeWidth={strokeWidth}
        stroke={shadowColor}
        opacity={shadowOpacity}
      />

      <circle
        cx={radius}
        cy={radius}
        r={radius - strokeWidth}
        fill="none"
        strokeWidth={strokeWidth}
        stroke={strokeColor}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        className={animate ? "transition-all ease-linear duration-1000" : ""}
      />
    </svg>
  );
};
