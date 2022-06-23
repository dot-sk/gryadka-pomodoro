import { PlayPauseButton } from "./PlayPause";
import { StopButton } from "./Stop";
import { NextActionGuess } from "./NextActionGuess";

export const TimeControls = () => {
  return (
    <div className="flex justify-center space-x-3">
      <div className="text-center">
        <PlayPauseButton />
      </div>
      <div className="text-center">
        <NextActionGuess />
      </div>
      <div className="text-center">
        <StopButton />
      </div>
    </div>
  );
};
