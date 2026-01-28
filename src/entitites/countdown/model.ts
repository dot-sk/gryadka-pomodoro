import { combine, createDomain, merge, sample } from "effector";
import { CountdownState } from "./constants";
import {
  CountdownStartPayload,
  CountdownEndPayload,
  CountdownStopPayload,
} from "./typings";
import { ipcWorld } from "../../shared/ipcWorld/ipcWorld";
import { IpcChannels } from "../../shared/ipcWorld/constants";
import { settingsModel } from "../settings";

export const domain = createDomain();

export const events = {
  start: domain.event<CountdownStartPayload>(),
  pause: domain.event(),
  resume: domain.event(),
  stop: domain.event<CountdownStopPayload>(), // external event
  end: domain.event<CountdownEndPayload>(), // internal event
  reset: domain.event(),
  setTime: domain.event<number>(),
  clockInterval: domain.event<number>(),
  showSuccess: domain.event(),
  initFromSettings: domain.event<number>(),
  togglePlayPause: domain.event(),
};

ipcWorld.on(IpcChannels["clock:tick"], (_, msSinceLastTick) => {
  events.clockInterval(Number(msSinceLastTick))
})

// Guards: фильтруют невалидные значения
const startTimeGuard = events.start.filterMap(({ interval }) =>
  interval > 0 ? interval : undefined
);
const setTimeGuard = events.setTime.filter({ fn: (time) => time >= 0 });

export const $countdownState = domain
  .store(CountdownState.PAUSED)
  .on(startTimeGuard, () => CountdownState.RUNNING)
  .on(events.pause, () => CountdownState.PAUSED)
  .on(events.resume, () => CountdownState.RUNNING)
  .on(events.showSuccess, () => CountdownState.SUCCESS)
  .reset(events.reset);

const stopGuard = sample({
  source: events.stop,
  filter: $countdownState.map((state) => state !== CountdownState.INITIAL),
});

const stopAndSaveGuard = stopGuard.filter({ fn: ({ save }) => save === true });
const stopWithoutSaveGuard = stopGuard.filter({ fn: ({ save }) => save !== true });

export const $isRunning = $countdownState.map(
  (state) => state === CountdownState.RUNNING
);

export const $isPaused = $countdownState.map(
  (state) => state === CountdownState.PAUSED
);

export const $isSuccess = $countdownState.map(
  (state) => state === CountdownState.SUCCESS
);

// Флаг: таймер "в процессе" (запущен или на паузе после запуска)
// Используется чтобы заблокировать редактирование времени после первого старта
// Сбрасывается при reset/stop
export const $hasActiveTimer = domain
  .store(false)
  .on(events.resume, () => true)
  .on(startTimeGuard, () => true)
  .reset(events.reset);

// Редактировать интервал можно только если нет активного таймера
// (до первого запуска или после полного сброса)
export const $canEditTime = $hasActiveTimer.map((hasActive) => !hasActive);

export const $currentInterval = domain
  .store<number>(0)
  .on(startTimeGuard, (_, time) => time)
  .on(events.initFromSettings, (_, interval) => interval);

// Когда можно редактировать время - currentInterval = time
sample({
  clock: setTimeGuard,
  filter: $canEditTime,
  target: $currentInterval,
});

// Timestamp когда стартовали/возобновили текущий отрезок
// Используется для drift-free расчета времени (не накапливаем погрешность)
const $startedAt = domain
  .store<number>(0)
  .on(startTimeGuard, () => Date.now())
  .on(events.resume, () => Date.now())
  .reset(events.reset);

// Эффективное время на момент старта/возобновления текущего отрезка
// При паузе сюда сохраняется текущее $time (см. строку 115), чтобы при resume продолжить с той же позиции
// ВАЖНО: При старте = interval-1, т.к. первая секунда считается уже начавшейся (UX решение)
const $effectiveInterval = domain
  .store<number>(0)
  .on(startTimeGuard, (_, interval) => interval - 1)
  .on(events.initFromSettings, (_, interval) => interval - 1)
  .on(setTimeGuard, (_, time) => time)
  .reset(events.reset);

// Обрабатываем clockInterval только когда таймер запущен (игнорируем во время паузы)
const clockIntervalIsRunning = sample({
  source: events.clockInterval,
  filter: $isRunning
});

// Текущее отображаемое время
// ВАЖНО: инициализируется как interval-1, т.к. первая секунда считается уже начавшейся
export const $time = domain
  .store(0)
  .on(setTimeGuard, (_, time) => time)
  .on(startTimeGuard, (_, interval) => interval - 1)
  .on(events.initFromSettings, (_, interval) => interval - 1);

// При паузе: сохраняем текущее $time в $effectiveInterval
// Чтобы при resume продолжить с той же позиции
sample({
  clock: events.pause,
  source: $time,
  target: $effectiveInterval,
});

// DRIFT-FREE расчет времени: вычисляем из реального timestamp, а не накапливаем тики
// Это гарантирует что таймер не отстает и не убегает вперед
sample({
  clock: clockIntervalIsRunning,
  source: combine($startedAt, $effectiveInterval),
  fn: ([startedAt, effectiveInterval]) => {
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    return effectiveInterval - elapsedSeconds;
  },
  target: $time,
});

// Таймер закончился: время стало отрицательным
const timeNegative = sample({
  source: $time,
  filter: (time) => time < 0,
});

// Переход в SUCCESS: либо юзер остановил с save=true, либо время вышло
sample({
  clock: merge([stopAndSaveGuard, timeNegative]),
  target: events.showSuccess,
});

// Stop без сохранения -> полный reset
sample({
  clock: stopWithoutSaveGuard,
  target: events.reset,
});

// Вычисляем сколько времени реально прошло (для статистики)
const $elapsedTime = combine($time, $currentInterval, (time, currentInterval) => ({
  elapsedTime: currentInterval - Math.max(0, time),
}));

// При завершении таймера отправляем событие end с прошедшим временем
sample({
  clock: merge([stopAndSaveGuard, timeNegative]),
  source: $elapsedTime,
  target: events.end,
});

// restore interval on reset
sample({
  clock: events.reset,
  source: $currentInterval,
  target: events.setTime,
});

// Save last interval to settings when starting a timer
sample({
  clock: events.start,
  fn: ({ interval }) => ({ key: "lastInterval", value: interval }),
  target: settingsModel.events.set,
});

// Load last interval from settings on init
sample({
  source: settingsModel.$lastInterval,
  filter: (interval) => interval > 0,
  target: events.initFromSettings,
});

// ============ Toggle play/pause logic ============
// Определяем какое действие выполнить при toggle в зависимости от текущего состояния
const togglePayload = sample({
  clock: events.togglePlayPause,
  source: combine({
    isRunning: $isRunning,
    isPaused: $isPaused,
    hasActiveTimer: $hasActiveTimer,
    currentInterval: $currentInterval,
  }),
  fn: (state) => {
    // Если таймер запущен -> ставим на паузу
    if (state.isRunning) {
      return { action: 'pause' as const };
    }

    // Если таймер на паузе после запуска -> возобновляем
    if (state.isPaused && state.hasActiveTimer) {
      return { action: 'resume' as const };
    }

    // Если таймер не был запущен вообще -> стартуем
    if (state.isPaused && !state.hasActiveTimer) {
      return { action: 'start' as const, interval: state.currentInterval };
    }

    return { action: 'none' as const };
  },
});

// Диспетчеризация действий
sample({
  clock: togglePayload,
  filter: ({ action }) => action === 'pause',
  target: events.pause,
});

sample({
  clock: togglePayload,
  filter: ({ action }) => action === 'resume',
  target: events.resume,
});

sample({
  clock: togglePayload,
  filter: ({ action, interval }) => action === 'start' && interval !== undefined,
  fn: ({ interval }) => ({ interval: interval! }),
  target: events.start,
});
