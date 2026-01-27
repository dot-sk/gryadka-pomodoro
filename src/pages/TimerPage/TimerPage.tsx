import { useState } from "react";
import { useStore } from "effector-react";
import { TimeControls } from "../../widgets/timeControls";
import { ProgressToday } from "../../widgets/progressToday";
import { countdownModel } from "../../entitites/countdown";
import { IntervalType } from "../../entitites/countdown/constants";
import { minToSec } from "../../shared/utils";
import { NavBar } from "../../widgets/navBar";
import { Button } from "../../shared/components/Button";
import { SettingsPanel } from "../../entitites/settings/components/SettingsPanel";
import {
  CreateEntryForm,
  ListStatByDate,
  HeatmapActivity,
} from "../../features/stats";
import { settingsModel } from "../../entitites/settings";
import { ToggleVisibility } from "../../shared/components/ToggleVisibility";

const Countdown = () => {
  return (
    <div className="py-12">
      <ProgressToday />
      <div className="mt-14 text-center">
        <TimeControls />
        <div className="mt-2 flex justify-center space-x-2">
          <Button onClick={() => countdownModel.events.stop({ save: false })}>
            Назад
          </Button>
        </div>
      </div>
    </div>
  );
};

const IntervalSelector = () => {
  const workIntervals = useStore(settingsModel.$workIntervals);
  const restIntervals = useStore(settingsModel.$restIntervals);

  return (
    <div className="py-4">
      <div>
        <p className="font-sansWide text-2xl">Интервал работы:</p>
        <div className="flex flex-wrap mt-2">
          {workIntervals.map((interval) => {
            return (
              <button
                key={interval}
                className="rounded-full bg-black py-2 px-3 text-white shadow-lg mb-2 mr-2 font-mono"
                onClick={() =>
                  countdownModel.events.start({
                    type: IntervalType.WORK,
                    interval: minToSec(interval),
                  })
                }
              >
                {`${interval}`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <p className="font-sansWide text-2xl">Интервал отдыха:</p>
        <div className="flex flex-wrap mt-2">
          {restIntervals.map((interval) => {
            return (
              <button
                key={interval}
                className="rounded-full bg-black py-2 px-3 text-white shadow-lg mb-2 mr-2 font-mono"
                onClick={() =>
                  countdownModel.events.start({
                    type: IntervalType.REST,
                    interval: minToSec(interval),
                  })
                }
              >
                {`${interval}`}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TimerTab = () => {
  const isInitial = useStore(countdownModel.$isInitial);
  return isInitial ? <IntervalSelector /> : <Countdown />;
};

const StatsTab = () => {
  return (
    <div className="py-4">
      <div>
        <HeatmapActivity />
      </div>

      <ToggleVisibility title="Создать запись" appear={false}>
        <CreateEntryForm />
      </ToggleVisibility>

      <ToggleVisibility title={"Статистика по дням"} appear={false}>
        <ListStatByDate />
      </ToggleVisibility>
    </div>
  );
};

const SettingsTab = () => {
  return (
    <div className="py-4">
      <SettingsPanel />
    </div>
  );
};

enum TimerNavTabs {
  TIMER = "⏲",
  STATS = "📊",
  SETTINGS = "⚙️",
}
const TimerNavTabsArray = [
  TimerNavTabs.TIMER,
  TimerNavTabs.STATS,
  TimerNavTabs.SETTINGS,
];

export const TimerPage = () => {
  const [activeTab, setActiveTab] = useState<string>(TimerNavTabs.TIMER);

  return (
    <div>
      <NavBar
        onClick={(tab) => setActiveTab(tab)}
        tabs={TimerNavTabsArray}
        activeTab={activeTab}
        className="mt-4"
      />

      {activeTab === TimerNavTabs.TIMER && <TimerTab />}
      {activeTab === TimerNavTabs.STATS && <StatsTab />}
      {activeTab === TimerNavTabs.SETTINGS && <SettingsTab />}
    </div>
  );
};
