type LineProgressProps = {
  value: number;
  min?: number;
  max: number;
};

// function that return a stepped value
function step(t: number, steps: number) {
  return Math.ceil(t * steps) / steps;
}

export const LineProgress = ({ value, max, min = 0 }: LineProgressProps) => {
  const progress = (value - min) / (max - min);
  const steppedProgress = step(progress, 30);

  return (
    <div
      className="flex flex-col space-y-2 w-full rounded-full overflow-hidden"
      style={{ background: "#eaeaea" }}
    >
      <div
        style={{ transform: `scaleX(${steppedProgress})` }}
        className="bg-black w-full h-[4px] origin-left"
      />
    </div>
  );
};
