import { countdownModel } from "../../entitites/countdown";
import { ipcWorld } from "../../shared/ipcWorld/ipcWorld";
import { IpcChannels } from "../../shared/ipcWorld/constants";
import { renderStringToDataURL } from "../../shared/renderStringToDataURL/renderStringToDataURL";
import { formatSeconds, whenFontsReady } from "../../shared/utils";
import { createDomain, merge, sample } from "effector";

/**
 * основная модель для App
 */
const domain = createDomain("mainThread");

const events = {
  setFontsReady: domain.event<boolean>(),
};

const $fontReady = domain
  .store(false)
  .on(events.setFontsReady, (_, fontIsReady) => fontIsReady);

whenFontsReady().then(() => {
  events.setFontsReady(true);
});

const willRender = sample({
  source: merge([countdownModel.$time, $fontReady]),
  filter: $fontReady,
  fn: () => countdownModel.$time.getState(),
});

willRender.watch((time) => {
  ipcWorld.send(
    IpcChannels["countdown-tick-as-image"],
    renderStringToDataURL(formatSeconds(time), 'light')
  );
});
