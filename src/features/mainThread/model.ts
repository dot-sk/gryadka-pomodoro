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

export const events = {
  setFontsReady: domain.event<boolean>(),
  render: domain.event<{ time: number; totalTime: number; isPaused: boolean; hasActiveTimer: boolean }>(),
};

export const $fontReady = domain
  .store(false)
  .on(events.setFontsReady, (_, fontIsReady) => fontIsReady);

whenFontsReady().then(() => {
  events.setFontsReady(true);
});

const $renderData = combine({
  time: countdownModel.$time,
  totalTime: countdownModel.$currentInterval,
  isPaused: countdownModel.$isPaused,
  isRunning: countdownModel.$isRunning,
  hasActiveTimer: countdownModel.$hasActiveTimer,
  fontReady: $fontReady,
});

const trayCanvas = document.createElement("canvas");

// Рендер таймера когда время меняется (таймер ЗАПУЩЕН, не на паузе)
sample({
  clock: countdownModel.$time,
  source: $renderData,
  filter: ({ fontReady, isRunning }) => fontReady && isRunning,
  fn: ({ time, totalTime, isPaused, hasActiveTimer }) => ({ time, totalTime, isPaused, hasActiveTimer }),
  target: events.render,
});

// Во время паузы НЕ рендерим на каждый тик - время в трее остаётся статичным
// Рендер при паузе происходит один раз через merge ниже

// Рендер анимации помидорки когда таймер НЕ активен (на каждый тик часов)
sample({
  clock: countdownModel.events.clockInterval,
  source: $renderData,
  filter: ({ fontReady, hasActiveTimer }) => fontReady && !hasActiveTimer,
  fn: ({ time, totalTime, isPaused, hasActiveTimer }) => ({ time, totalTime, isPaused, hasActiveTimer }),
  target: events.render,
});

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
  fn: ({ time, totalTime, isPaused, hasActiveTimer }) => ({ time, totalTime, isPaused, hasActiveTimer }),
  target: events.render,
});

// Рендер при инициализации из настроек (при первом запуске приложения)
sample({
  clock: countdownModel.events.initFromSettings,
  source: $renderData,
  filter: ({ fontReady }) => fontReady,
  fn: ({ time, totalTime, isPaused, hasActiveTimer }) => ({ time, totalTime, isPaused, hasActiveTimer }),
  target: events.render,
});

// Рендер когда шрифты загружены (независимо от времени - покажем что есть)
sample({
  clock: events.setFontsReady,
  source: $renderData,
  filter: ({ fontReady }) => fontReady,
  fn: ({ time, totalTime, isPaused, hasActiveTimer }) => ({ time, totalTime, isPaused, hasActiveTimer }),
  target: events.render,
});

// Подписка на событие рендера для отправки в IPC
events.render.watch(({ time, totalTime, isPaused, hasActiveTimer }) => {
  // +1 к time т.к. показываем interval-1 при старте, но progress должен быть 100%
  const progress = totalTime > 0 ? Math.min(1, (time + 1) / totalTime) : 1;
  ipcWorld.send(
    IpcChannels["countdown-tick-as-image"],
    renderStringToDataURL(formatSeconds(time), 'light', trayCanvas, isPaused, progress, hasActiveTimer)
  );
});
