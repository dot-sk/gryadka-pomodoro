import { countdownModel } from "../../entitites/countdown";
import { ipc } from "../../shared/ipc/ipc";
import { IpcChannels } from "../../shared/ipc/constants";

countdownModel.$time.watch((time) => {
  ipc.send(IpcChannels["countdown-tick"], time);
});
