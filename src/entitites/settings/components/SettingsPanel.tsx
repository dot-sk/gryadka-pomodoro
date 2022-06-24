import React, { useCallback, useState } from "react";
import { useStore } from "effector-react";
import { $settings, events } from "../model";
import { formatSeconds, parseSeconds } from "../../../shared/utils";

export const SettingsPanel = () => {
  const settings = useStore($settings);

  const [dailyGoal, setDailyGoal] = useState(
    formatSeconds(settings.dailyGoalSeconds)
  );
  const [workInterval, setWorkInterval] = useState(settings.workIntervals);
  const [restInterval, setRestInterval] = useState(settings.restIntervals);

  // checkbox handler for "sound"
  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      events.set({ key: "sound", value: e.target.checked });
    },
    []
  );

  const handleGoalChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setDailyGoal(value);

      const seconds = parseSeconds(value);
      if (seconds !== null && seconds > 0) {
        events.set({ key: "dailyGoalSeconds", value: parseSeconds(value) });
      }
    },
    []
  );

  const handleIntervalsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value, name } = e.target;

      const isValidIntervals = !value
        .split(";")
        .map((v) => parseFloat(v))
        .some(isNaN);

      if (isValidIntervals) {
        events.set({ key: name, value });
      }

      switch (name) {
        case "workIntervals":
          setWorkInterval(value);
          break;
        case "restIntervals":
          setRestInterval(value);
      }
    },
    []
  );

  return (
    <div className="flex flex-col space-y-2">
      <div>
        <label className="flex items-center">
          <span className="mr-2">Цель на день</span>
          <input
            name="dailyTargetSeconds"
            type="text"
            value={dailyGoal}
            onChange={handleGoalChange}
            className="flex-1"
          />
        </label>
      </div>

      <div>
        <label className="flex items-center">
          <span className="mr-2">Динь</span>
          <input
            name="sound"
            type="checkbox"
            onChange={handleCheckboxChange}
            checked={settings.sound}
          />
        </label>
      </div>

      <div>
        <label className="flex flex-col">
          <span>Интервалы работы</span>
          <input
            name="workIntervals"
            type="text"
            onChange={handleIntervalsChange}
            value={workInterval}
          />
        </label>
      </div>

      <div>
        <label className="flex flex-col">
          <span>Интервалы отдыха</span>
          <input
            name="restIntervals"
            type="text"
            onChange={handleIntervalsChange}
            value={restInterval}
          />
        </label>
      </div>
    </div>
  );
};
