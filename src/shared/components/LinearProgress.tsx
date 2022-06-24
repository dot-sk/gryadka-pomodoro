import React from "react";

export const LINEAR_PROGRESS_STEPS = 30;

type LineProgressProps = {
  value: number;
  max: number;
};

// function that return a stepped value
function step(t: number, steps: number) {
  return Math.ceil(t * steps) / steps;
}

/**
 * рендерит линейный прогресс в 30 шагов
 * шаги нужны для того, чтобы не было слишком гранулярного прогресса,
 * и в общем случае так красивее
 */
export const LinearProgress = ({ value, max }: LineProgressProps) => {
  const min = 0; // лень покрывать тестами кейсы с min, поэтому фиксирую на нуле
  const progress = (value - min) / (max - min);
  const steppedProgress = step(progress, LINEAR_PROGRESS_STEPS);

  return (
    <div
      className="flex flex-col space-y-2 w-full rounded-full overflow-hidden"
      style={{ background: "#eaeaea" }}
      data-testid="lineProgressContainer"
    >
      <div
        style={{ transform: `scaleX(${steppedProgress})` }}
        className="bg-black w-full h-[4px] origin-left"
        data-testid="lineProgress"
      />
    </div>
  );
};
