import { countdownModel } from "../../../../entitites/countdown";

export const StopButton = () => {
  return (
    <button
      className="rounded-full bg-gray-300 py-2 px-3 text-white w-48 shadow"
      onClick={() => countdownModel.events.stop()}
    >
      Stop
    </button>
  );
};
