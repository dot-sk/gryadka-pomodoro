import { HeatmapActivity } from "../../features/stats";

export const StatsPage = () => {
  return (
    <div className="p-4">
      <div className="flex justify-center items-center">
        <HeatmapActivity />
      </div>
    </div>
  );
};
