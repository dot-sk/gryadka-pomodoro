import { useUnit } from "effector-react";
import { countdownModel } from "../../entitites/countdown";
import { CanvasCountdown } from "../../entitites/countdown/components/CanvasCountdown";
import { SuccessMessage } from "../../entitites/countdown/components/SuccessMessage";
import { ipcWorld } from "../../shared/ipcWorld/ipcWorld";
import { IpcChannels } from "../../shared/ipcWorld/constants";

const SUCCESS_MESSAGE_DURATION = 2000;
const HIDE_WINDOW_DELAY = 1500; // Скрываем окно раньше, чтобы анимация закрытия была плавной

export const TimerPage = () => {
  const { isSuccess } = useUnit({
    isSuccess: countdownModel.$isSuccess,
  });

  const handleSuccessComplete = () => {
    countdownModel.events.reset();
  };

  const handleHideWindow = () => {
    ipcWorld.send(IpcChannels["window:hide-after-save"]);
  };

  return (
    <div className="flex justify-center items-center">
      {isSuccess ? (
        <SuccessMessage
          message="Время сохранено!"
          duration={SUCCESS_MESSAGE_DURATION}
          hideWindowDelay={HIDE_WINDOW_DELAY}
          onComplete={handleSuccessComplete}
          onHideWindow={handleHideWindow}
        />
      ) : (
        <CanvasCountdown />
      )}
    </div>
  );
};
