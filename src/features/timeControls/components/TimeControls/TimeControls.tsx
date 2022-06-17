import { PlayPauseButton } from "./PlayPause";
import { StopButton } from "./Stop";

export const TimeControls = () => {
  return (
    <div className="flex flex-col justify-center space-y-3">
      <div className="text-center">
        <PlayPauseButton />
      </div>
      <div className="text-center">
        <StopButton />
      </div>
    </div>
  );
};
