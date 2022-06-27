import React from "react";

export const LINEAR_PROGRESS_STEPS = 30;

export enum LinearProgressDirection {
  VERTICAL = "vertical",
  HORIZONTAL = "horizontal",
}

type LinearProgressProps = {
  value: number;
  max: number;
  direction?: LinearProgressDirection;
};

// function that return a stepped value
function step(t: number, steps: number) {
  return Math.ceil(t * steps) / steps;
}

const directionToClassNameRootMap = {
  [LinearProgressDirection.HORIZONTAL]: "w-full",
  [LinearProgressDirection.VERTICAL]: "h-full",
};

const directionToClassNameMap = {
  [LinearProgressDirection.HORIZONTAL]: "w-full h-[4px] origin-left",
  [LinearProgressDirection.VERTICAL]: "w-[4px] h-full origin-bottom",
};

/**
 * рендерит линейный прогресс в 30 шагов
 * шаги нужны для того, чтобы не было слишком гранулярного прогресса,
 * и в общем случае так красивее
 */
export const LinearProgress = ({
  value,
  max,
  direction = LinearProgressDirection.HORIZONTAL,
}: LinearProgressProps) => {
  const min = 0; // лень покрывать тестами кейсы с min, поэтому фиксирую на нуле
  const progress = (value - min) / (max - min);
  const steppedProgress = step(progress, LINEAR_PROGRESS_STEPS);

  return (
    <div
      className={`flex rounded-full overflow-hidden ${directionToClassNameRootMap[direction]}`}
      style={{ background: "#eaeaea" }}
      data-testid="lineProgressContainer"
    >
      <div
        style={{ transform: `scaleX(${steppedProgress})` }}
        className={`bg-black ${directionToClassNameMap[direction]}`}
        data-testid="lineProgress"
      />
    </div>
  );
};
