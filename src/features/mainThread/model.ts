import { countdownModel } from "../../entitites/countdown";
import { ipc } from "../../shared/ipc/ipc";
import { IpcChannels } from "../../shared/ipc/constants";
import { renderStringToDataURL } from "../../shared/renderStringToDataURL/renderStringToDataURL";
import { formatSeconds, whenFontsReady } from "../../shared/utils";
import { createDomain, merge, sample } from "effector";

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
  ipc.send(
    IpcChannels["countdown-tick-as-image"],
    renderStringToDataURL(formatSeconds(time))
  );
});
