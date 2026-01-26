import { countdownModel } from "../../entitites/countdown";
import { ipcWorld } from "../../shared/ipcWorld/ipcWorld";
import { IpcChannels } from "../../shared/ipcWorld/constants";
import { renderStringToDataURL } from "../../shared/renderStringToDataURL/renderStringToDataURL";
import { formatSeconds, whenFontsReady } from "../../shared/utils";
import { createDomain, combine, sample, merge } from "effector";

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

const $renderData = combine({
  time: countdownModel.$time,
  totalTime: countdownModel.$currentInterval,
  isInitial: countdownModel.$isInitial,
  isRunning: countdownModel.$isRunning,
  fontReady: $fontReady,
});

const trayCanvas = document.createElement("canvas");

function render({ time, totalTime, isInitial }: { time: number; totalTime: number; isInitial: boolean }) {
  // +1 к time т.к. показываем interval-1 при старте, но progress должен быть 100%
  const progress = totalTime > 0 ? Math.min(1, (time + 1) / totalTime) : 1;
  ipcWorld.send(
    IpcChannels["countdown-tick-as-image"],
    renderStringToDataURL(formatSeconds(time), 'light', trayCanvas, isInitial, progress)
  );
}

// Рендер таймера когда время меняется (таймер ЗАПУЩЕН, не на паузе)
sample({
  clock: countdownModel.$time,
  source: $renderData,
  filter: ({ fontReady, isRunning }) => fontReady && isRunning,
}).watch(render);

// Рендер скринсейвера на каждый тик когда isInitial (нет активного таймера)
sample({
  clock: countdownModel.events.clockInterval,
  source: $renderData,
  filter: ({ fontReady, isInitial }) => fontReady && isInitial,
}).watch(render);

// Немедленный рендер при смене состояния (старт/пауза/резюм/стоп)
sample({
  clock: merge([
    countdownModel.events.start,
    countdownModel.events.pause,
    countdownModel.events.resume,
    countdownModel.events.reset,
  ]),
  source: $renderData,
  filter: ({ fontReady }) => fontReady,
}).watch(render);
