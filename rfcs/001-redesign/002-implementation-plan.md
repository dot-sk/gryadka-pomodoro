# План: Рефакторинг UI по Sequence Diagram

## Принципы проектирования

При реализации придерживаемся следующих принципов:

1. **TDD (Test-Driven Development)** - всегда начинаем с тестов:
   - Сначала пишем failing тест
   - Затем пишем минимальный код для прохождения теста
   - Рефакторим код, сохраняя тесты зелеными
   - Используем watch mode (`npm test -- --watch`) для быстрой обратной связи

2. **SRP (Single Responsibility Principle)** - каждый компонент/модуль должен иметь одну ответственность

3. **Open/Closed Principle** - открыт для расширения, закрыт для модификации

4. **Размещение компонентов:**
   - Компоненты размещаем близко к бизнес-контексту (features/entities)
   - В `shared/` выносим только переиспользуемые UI компоненты и утилиты
   - Специфичные для домена компоненты остаются в своем контексте

5. **Автоматизация тестирования:**
   - Максимально автоматизируем через unit и integration тесты
   - Ручное тестирование только для невозможных к автоматизации сценариев (Electron tray, visual checks)
   - Coverage > 80% для критичных модулей

6. **Стилизация:**
   - Используем Tailwind CSS для всех стилей
   - Не создаём отдельные CSS модули (`.module.css`)
   - Все стили инлайн через className с Tailwind утилитами

**Примеры:**
- ✅ `SuccessMessage` → `src/entitites/countdown/components/` (специфичен для countdown)
- ✅ `HeatmapActivity` → `src/features/stats/components/` (специфичен для stats)
- ✅ `Button` → `src/shared/components/` (переиспользуемый UI)

## Обзор

Привести UI приложения в соответствие с sequence diagram ([rfcs/002-timer-sequence-diagram.puml](rfcs/002-timer-sequence-diagram.puml)). Упростить архитектуру: одно popup окно с двумя экранами (Timer/Stats), навигация через контекстное меню трея, убрать вкладки и лишние кнопки управления.

**Ключевые изменения:**
- ✅ Убрать вкладки (NavBar) из TimerPage
- ✅ Убрать виджет TimeControls (кнопки play/pause/stop)
- ✅ Добавить экран статистики (только HeatmapActivity)
- ✅ Навигация через tray context menu ("Таймер" / "Статистика")
- ✅ SUCCESS состояние с сообщением "Время сохранено! ✓" и автоматическим скрытием окна
- ✅ Keyboard shortcuts: пробел/enter для toggle, стрелки ←/→ для изменения времени
- ✅ Двойной клик должен сохранять (save: true, а не false)
- ✅ Удалить неиспользуемые компоненты: NavBar, TimeControls, ProgressToday, CreateEntryForm, ListStatByDate

## Текущая vs Целевая Архитектура

### Текущая
```
Popup Window
├── NavBar (вкладки: ⏲ / ⚙️)
├── TimerTab
│   ├── ProgressToday (переключает HeatmapActivity ↔ CanvasCountdown)
│   ├── TimeControls (кнопки play/pause/stop)
│   ├── Button "Назад"
│   └── IntervalSelector
└── SettingsTab
    └── SettingsPanel
```

### Целевая
```
Popup Window
├── App Router (state: 'timer' | 'stats')
├── Timer Screen (when state='timer')
│   ├── [INITIAL] IntervalSelector
│   ├── [RUNNING/PAUSED] CanvasCountdown
│   └── [SUCCESS] SuccessMessage → auto-hide
└── Stats Screen (when state='stats')
    └── HeatmapActivity

Tray Context Menu
├── Таймер → set state='timer'
├── Статистика → set state='stats'
└── Выйти → app.quit()
```

## Пошаговая Реализация (TDD)

### Фаза 1: Подготовка инфраструктуры

#### 1.1 Создать тесты для keyboard shortcuts
**Файл:** [src/entitites/countdown/components/CanvasCountdown.spec.tsx](src/entitites/countdown/components/CanvasCountdown.spec.tsx)

Добавить тесты:
- `it("should toggle play/pause on Space key")`
- `it("should toggle play/pause on Enter key")`
- `it("should decrease time by 60s on ArrowLeft when paused")`
- `it("should increase time by 60s on ArrowRight when paused")`
- `it("should ignore keyboard events in INITIAL state")`
- `it("should ignore arrow keys when RUNNING")`
- `it("should not allow time below 0")`

#### 1.2 Изменить тест для double-click
**Файл:** [src/entitites/countdown/components/CanvasCountdown.spec.tsx](src/entitites/countdown/components/CanvasCountdown.spec.tsx):192

Изменить ожидание:
```typescript
expect(events.stop).toHaveBeenCalledWith({ save: true });
```

#### 1.3 Создать тесты для SuccessMessage
**Файл:** `src/entitites/countdown/components/SuccessMessage.spec.tsx` (создать)

Тесты:
- `it("should render message with checkmark")`
- `it("should call onComplete after duration")`
- `it("should have data-testid='success-message'")`

**Обоснование размещения:** SuccessMessage используется только в контексте countdown для отображения успешного сохранения интервала. Это не переиспользуемый UI компонент, а часть бизнес-логики countdown. Следуя SRP, размещаем его рядом с другими countdown компонентами.

### Фаза 2: Реализация keyboard shortcuts

#### 2.1 Добавить keyboard handlers в CanvasCountdown
**Файл:** [src/entitites/countdown/components/CanvasCountdown.tsx](src/entitites/countdown/components/CanvasCountdown.tsx)

Добавить useEffect:
```typescript
useEffect(() => {
  if (isInitial) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    if ([' ', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    // Toggle play/pause
    if (e.key === ' ' || e.key === 'Enter') {
      if (isRunning) {
        events.pause();
      } else {
        events.resume();
      }
    }

    // Adjust time (only when paused)
    if (!isRunning) {
      if (e.key === 'ArrowLeft') {
        events.setTime(Math.max(0, time - 60));
      } else if (e.key === 'ArrowRight') {
        events.setTime(Math.min(currentInterval, time + 60));
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isInitial, isRunning, time, currentInterval]);
```

#### 2.2 Изменить double-click на save: true
**Файл:** [src/entitites/countdown/components/CanvasCountdown.tsx](src/entitites/countdown/components/CanvasCountdown.tsx):46

```typescript
events.stop({ save: true }); // было: { save: false }
```

#### 2.3 Запустить тесты
```bash
npm test -- CanvasCountdown.spec.tsx
```

### Фаза 3: Добавить SUCCESS state

#### 3.1 Добавить SUCCESS в CountdownState enum
**Файл:** [src/entitites/countdown/constants.ts](src/entitites/countdown/constants.ts)

```typescript
export enum CountdownState {
  INITIAL = "INITIAL",
  RUNNING = "RUNNING",
  PAUSED = "PAUSED",
  SUCCESS = "SUCCESS",
}
```

#### 3.2 Обновить countdown model
**Файл:** [src/entitites/countdown/model.ts](src/entitites/countdown/model.ts)

Добавить событие:
```typescript
export const events = {
  // ... existing
  showSuccess: domain.event(),
};
```

Обновить $countdownState:
```typescript
export const $countdownState = domain
  .store(CountdownState.INITIAL)
  .on(startTimeGuard, () => CountdownState.RUNNING)
  .on(events.pause, () => CountdownState.PAUSED)
  .on(events.resume, () => CountdownState.RUNNING)
  .on(events.showSuccess, () => CountdownState.SUCCESS)
  .reset(events.reset);
```

Добавить derived store:
```typescript
export const $isSuccess = $countdownState.map(
  (state) => state === CountdownState.SUCCESS
);
```

Изменить логику после save:
```typescript
// После save -> переход в SUCCESS
sample({
  clock: merge([stopAndSaveGuard, timeNegative]),
  fn: () => null,
  target: events.showSuccess,
});
```

#### 3.3 Экспортировать $isSuccess
**Файл:** [src/entitites/countdown/index.ts](src/entitites/countdown/index.ts)

```typescript
export { $isSuccess } from "./model";
```

### Фаза 4: Создать SuccessMessage компонент

#### 4.1 Реализовать SuccessMessage
**Файл:** `src/entitites/countdown/components/SuccessMessage.tsx` (создать)

```typescript
import { useEffect } from "react";

interface SuccessMessageProps {
  message: string;
  duration?: number;
  onComplete?: () => void;
}

export const SuccessMessage = ({
  message,
  duration = 2000,
  onComplete
}: SuccessMessageProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      className="flex flex-col items-center justify-center h-[330px]"
      data-testid="success-message"
    >
      <p className="text-3xl font-sansWide text-green-600">
        {message} ✓
      </p>
    </div>
  );
};
```

#### 4.2 Запустить тесты
```bash
npm test -- SuccessMessage.spec.tsx
```

### Фаза 5: Добавить App Router для экранов

#### 5.1 Создать app router model
**Файл:** `src/app/model.ts` (создать)

```typescript
import { createDomain } from "effector";

export enum AppScreen {
  TIMER = "timer",
  STATS = "stats",
}

export const appDomain = createDomain();

export const events = {
  navigateToTimer: appDomain.event(),
  navigateToStats: appDomain.event(),
};

export const $currentScreen = appDomain
  .store<AppScreen>(AppScreen.TIMER)
  .on(events.navigateToTimer, () => AppScreen.TIMER)
  .on(events.navigateToStats, () => AppScreen.STATS);
```

#### 5.2 Добавить IPC каналы для навигации
**Файл:** [src/shared/ipcWorld/constants.ts](src/shared/ipcWorld/constants.ts)

```typescript
export enum IpcChannels {
  "countdown-tick" = "countdown-tick",
  "countdown-tick-as-image" = "countdown-tick-as-image",
  "clock:tick" = "clock:tick",
  "navigate-to-timer" = "navigate-to-timer",
  "navigate-to-stats" = "navigate-to-stats",
  "window:hide-after-save" = "window:hide-after-save",
}
```

#### 5.3 Подключить IPC к app router
**Файл:** `src/app/model.ts`

```typescript
import { ipcWorld } from "../shared/ipcWorld/ipcWorld";
import { IpcChannels } from "../shared/ipcWorld/constants";

ipcWorld.on(IpcChannels["navigate-to-timer"], () => {
  events.navigateToTimer();
});

ipcWorld.on(IpcChannels["navigate-to-stats"], () => {
  events.navigateToStats();
});
```

### Фаза 6: Рефакторинг TimerPage

#### 6.1 Упростить TimerPage
**Файл:** [src/pages/TimerPage/TimerPage.tsx](src/pages/TimerPage/TimerPage.tsx)

Полная замена:
```typescript
import { useStore } from "effector-react";
import { countdownModel } from "../../entitites/countdown";
import { IntervalType } from "../../entitites/countdown/constants";
import { minToSec } from "../../shared/utils";
import { settingsModel } from "../../entitites/settings";
import { CanvasCountdown } from "../../entitites/countdown/components/CanvasCountdown";
import { SuccessMessage } from "../../entitites/countdown/components/SuccessMessage";
import { ipcWorld } from "../../shared/ipcWorld/ipcWorld";
import { IpcChannels } from "../../shared/ipcWorld/constants";

const IntervalSelector = () => {
  const workIntervals = useStore(settingsModel.$workIntervals);
  const restIntervals = useStore(settingsModel.$restIntervals);

  return (
    <div className="py-4" data-testid="interval-selector">
      <div>
        <p className="font-sansWide text-2xl">Интервал работы:</p>
        <div className="flex flex-wrap mt-2">
          {workIntervals.map((interval) => (
            <button
              key={interval}
              data-testid={`work-interval-${interval}`}
              className="rounded-full bg-black py-2 px-3 text-white shadow-lg mb-2 mr-2 font-mono"
              onClick={() =>
                countdownModel.events.start({
                  type: IntervalType.WORK,
                  interval: minToSec(interval),
                })
              }
            >
              {interval}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="font-sansWide text-2xl">Интервал отдыха:</p>
        <div className="flex flex-wrap mt-2">
          {restIntervals.map((interval) => (
            <button
              key={interval}
              data-testid={`rest-interval-${interval}`}
              className="rounded-full bg-black py-2 px-3 text-white shadow-lg mb-2 mr-2 font-mono"
              onClick={() =>
                countdownModel.events.start({
                  type: IntervalType.REST,
                  interval: minToSec(interval),
                })
              }
            >
              {interval}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TimerPage = () => {
  const isInitial = useStore(countdownModel.$isInitial);
  const isSuccess = useStore(countdownModel.$isSuccess);

  const handleSuccessComplete = () => {
    countdownModel.events.reset();
    ipcWorld.send(IpcChannels["window:hide-after-save"]);
  };

  return (
    <div className="py-12">
      <div className="relative flex flex-col items-center">
        <div className="relative flex justify-center items-center w-[330px] h-[330px]">
          <div className="relative z-[2]">
            {isSuccess ? (
              <SuccessMessage
                message="Время сохранено!"
                onComplete={handleSuccessComplete}
              />
            ) : isInitial ? (
              <IntervalSelector />
            ) : (
              <CanvasCountdown />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### 6.2 Создать тесты для TimerPage
**Файл:** `src/pages/TimerPage/TimerPage.spec.tsx` (создать)

Тесты:
- `it("should render IntervalSelector in INITIAL state")`
- `it("should render CanvasCountdown in RUNNING/PAUSED state")`
- `it("should render SuccessMessage in SUCCESS state")`
- `it("should hide window after success message timeout")`

### Фаза 7: Создать StatsPage

#### 7.1 Реализовать StatsPage
**Файл:** `src/pages/StatsPage/StatsPage.tsx` (создать)

```typescript
import { HeatmapActivity } from "../../features/stats";

export const StatsPage = () => {
  return (
    <div className="py-12">
      <div className="relative flex flex-col items-center">
        <div className="relative flex justify-center items-center w-[330px] h-[330px]">
          <div className="relative z-[2]">
            <HeatmapActivity />
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### 7.2 Создать тесты для StatsPage
**Файл:** `src/pages/StatsPage/StatsPage.spec.tsx` (создать)

Тесты:
- `it("should render HeatmapActivity")`
- `it("should have proper data-testid")`

### Фаза 8: Обновить App для роутинга

#### 8.1 Добавить роутинг в App
**Файл:** [src/app/index.tsx](src/app/index.tsx)

```typescript
import { useStore } from "effector-react";
import { TimerPage } from "../pages/TimerPage/TimerPage";
import { StatsPage } from "../pages/StatsPage/StatsPage";
import { $currentScreen, AppScreen } from "./model";
import { withProviders } from "./providers";
import "../features/mainThread";
import "../features/ding";
import "./styles/index.css";

function App() {
  const currentScreen = useStore($currentScreen);

  return (
    <div className="App">
      {currentScreen === AppScreen.TIMER ? <TimerPage /> : <StatsPage />}
    </div>
  );
}

export default withProviders(App);
```

### Фаза 9: Обновить Electron Main

#### 9.1 Добавить контекстное меню трея
**Файл:** [electron/main.ts](electron/main.ts):75-77

Заменить:
```typescript
const contextMenu = Menu.buildFromTemplate([
  {
    label: "Таймер",
    type: "normal",
    click: () => {
      window?.webContents.send(IpcChannels["navigate-to-timer"]);
      if (!window?.isVisible()) {
        // Show window at tray position
        const bounds = tray.getBounds();
        window?.setBounds({
          x: bounds.x,
          y: bounds.y + bounds.height,
          width: window?.getBounds().width || 375,
          height: window?.getBounds().height || 630,
        });
        window?.show();
      }
    }
  },
  {
    label: "Статистика",
    type: "normal",
    click: () => {
      window?.webContents.send(IpcChannels["navigate-to-stats"]);
      if (!window?.isVisible()) {
        const bounds = tray.getBounds();
        window?.setBounds({
          x: bounds.x,
          y: bounds.y + bounds.height,
          width: window?.getBounds().width || 375,
          height: window?.getBounds().height || 630,
        });
        window?.show();
      }
    }
  },
  { type: "separator" },
  {
    label: "Выйти",
    type: "normal",
    click: () => app.quit()
  },
]);
```

#### 9.2 Добавить IPC handler для скрытия окна
**Файл:** [electron/main.ts](electron/main.ts)

После строки 146, добавить:
```typescript
ipcMain.on(IpcChannels["window:hide-after-save"], () => {
  window?.hide();
});
```

### Фаза 10: Удаление неиспользуемых компонентов

#### 10.1 Удалить виджеты
```bash
rm -rf src/widgets/navBar
rm -rf src/widgets/timeControls
rm -rf src/widgets/progressToday
```

#### 10.2 Удалить CreateEntryForm и ListStatByDate
**Файл:** [src/features/stats/index.ts](src/features/stats/index.ts)

Удалить экспорты (если есть):
```typescript
// export { CreateEntryForm } from "./components/CreateEntryForm";
// export { ListStatByDate } from "./components/ListStatByDate";
```

Можно оставить файлы на случай, если понадобятся позже, но не экспортировать их.

#### 10.3 Проверить импорты
Найти и удалить все импорты удаленных компонентов:
```bash
grep -r "from.*navBar" src/
grep -r "from.*timeControls" src/
grep -r "from.*progressToday" src/
```

### Фаза 11: Автоматизированное тестирование

#### 11.1 Unit тесты для countdown model SUCCESS state
**Файл:** `src/entitites/countdown/model.spec.ts` (создать или расширить)

```typescript
describe('countdown model - SUCCESS state', () => {
  it('should transition to SUCCESS on stopAndSave', () => {
    // Arrange: start timer
    events.start({ type: IntervalType.WORK, interval: 300 });

    // Act: stop with save
    events.stop({ save: true });

    // Assert
    expect($countdownState.getState()).toBe(CountdownState.SUCCESS);
  });

  it('should transition to SUCCESS when time reaches zero', () => {
    // Arrange: mock time reaching zero
    events.start({ type: IntervalType.WORK, interval: 1 });

    // Act: tick until time < 0
    events.clockInterval(2000);

    // Assert
    expect($countdownState.getState()).toBe(CountdownState.SUCCESS);
  });

  it('should reset to INITIAL from SUCCESS', () => {
    // Arrange: reach SUCCESS state
    events.start({ type: IntervalType.WORK, interval: 300 });
    events.stop({ save: true });

    // Act: reset
    events.reset();

    // Assert
    expect($countdownState.getState()).toBe(CountdownState.INITIAL);
  });
});
```

#### 11.2 Integration тест: Полный цикл таймера
**Файл:** `src/pages/TimerPage/TimerPage.integration.spec.tsx` (создать)

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimerPage } from './TimerPage';
import { countdownModel } from '../../entitites/countdown';

describe('TimerPage - Full Timer Flow', () => {
  beforeEach(() => {
    countdownModel.events.reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should complete full timer cycle: INITIAL → RUNNING → PAUSED → SUCCESS', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TimerPage />);

    // INITIAL: should show interval selector
    expect(screen.getByTestId('interval-selector')).toBeInTheDocument();

    // Click work interval (5 min)
    const workInterval = screen.getByTestId('work-interval-5');
    await user.click(workInterval);

    // RUNNING: should show canvas countdown
    await waitFor(() => {
      expect(screen.getByTestId('canvas-countdown')).toBeInTheDocument();
    });

    // Click canvas to pause
    const canvas = screen.getByTestId('canvas-countdown');
    await user.click(canvas);

    // PAUSED: state should be paused
    await waitFor(() => {
      expect(countdownModel.$isPaused.getState()).toBe(true);
    });

    // Double-click to stop with save
    await user.dblClick(canvas);

    // SUCCESS: should show success message
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByText(/Время сохранено!/)).toBeInTheDocument();
    });

    // After 2 seconds, should return to INITIAL
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('interval-selector')).toBeInTheDocument();
    });
  });

  it('should handle keyboard shortcuts correctly', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TimerPage />);

    // Start timer
    await user.click(screen.getByTestId('work-interval-5'));
    await waitFor(() => {
      expect(screen.getByTestId('canvas-countdown')).toBeInTheDocument();
    });

    // Press Space to pause
    await user.keyboard(' ');
    await waitFor(() => {
      expect(countdownModel.$isPaused.getState()).toBe(true);
    });

    // Press ArrowLeft to decrease time
    const initialTime = countdownModel.$time.getState();
    await user.keyboard('{ArrowLeft}');
    await waitFor(() => {
      expect(countdownModel.$time.getState()).toBe(initialTime - 60);
    });

    // Press ArrowRight to increase time
    await user.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(countdownModel.$time.getState()).toBe(initialTime);
    });

    // Press Enter to resume
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(countdownModel.$isRunning.getState()).toBe(true);
    });
  });

  it('should auto-complete timer and show success', async () => {
    const user = userEvent.setup({ delay: null });
    render(<TimerPage />);

    // Start very short timer (1 second)
    countdownModel.events.start({
      type: IntervalType.WORK,
      interval: 1
    });

    await waitFor(() => {
      expect(screen.getByTestId('canvas-countdown')).toBeInTheDocument();
    });

    // Simulate time passing (1 second + buffer)
    jest.advanceTimersByTime(1500);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });

    // After 2 more seconds, should hide and reset
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByTestId('interval-selector')).toBeInTheDocument();
    });
  });
});
```

#### 11.3 Integration тест: App navigation
**Файл:** `src/app/App.integration.spec.tsx` (создать)

```typescript
import { render, screen } from '@testing-library/react';
import App from './index';
import { appModel } from './model';

describe('App - Navigation', () => {
  beforeEach(() => {
    appModel.events.navigateToTimer();
  });

  it('should show TimerPage by default', () => {
    render(<App />);

    // TimerPage shows interval selector in INITIAL state
    expect(screen.getByTestId('interval-selector')).toBeInTheDocument();
  });

  it('should switch to StatsPage on navigation event', async () => {
    render(<App />);

    // Navigate to stats
    appModel.events.navigateToStats();

    // Should show HeatmapActivity
    await waitFor(() => {
      expect(screen.getByTestId('heatmap-activity')).toBeInTheDocument();
    });
  });

  it('should switch back to TimerPage from StatsPage', async () => {
    render(<App />);

    // Navigate to stats
    appModel.events.navigateToStats();
    await waitFor(() => {
      expect(screen.getByTestId('heatmap-activity')).toBeInTheDocument();
    });

    // Navigate back to timer
    appModel.events.navigateToTimer();
    await waitFor(() => {
      expect(screen.getByTestId('interval-selector')).toBeInTheDocument();
    });
  });
});
```

#### 11.4 Integration тест: IPC communication (с моками)
**Файл:** `src/app/ipc.integration.spec.ts` (создать)

```typescript
import { appModel } from './model';
import { ipcWorld } from '../shared/ipcWorld/ipcWorld';
import { IpcChannels } from '../shared/ipcWorld/constants';

// Mock ipcWorld
jest.mock('../shared/ipcWorld/ipcWorld', () => ({
  ipcWorld: {
    on: jest.fn(),
    send: jest.fn(),
  },
}));

describe('IPC Integration', () => {
  it('should navigate to timer on IPC event', () => {
    // Arrange: get the registered callback
    const onCalls = (ipcWorld.on as jest.Mock).mock.calls;
    const timerCallback = onCalls.find(
      call => call[0] === IpcChannels['navigate-to-timer']
    )?.[1];

    // Act: trigger IPC event
    timerCallback?.();

    // Assert
    expect(appModel.$currentScreen.getState()).toBe(appModel.AppScreen.TIMER);
  });

  it('should navigate to stats on IPC event', () => {
    // Arrange
    const onCalls = (ipcWorld.on as jest.Mock).mock.calls;
    const statsCallback = onCalls.find(
      call => call[0] === IpcChannels['navigate-to-stats']
    )?.[1];

    // Act
    statsCallback?.();

    // Assert
    expect(appModel.$currentScreen.getState()).toBe(appModel.AppScreen.STATS);
  });

  it('should send hide-window IPC on success complete', () => {
    // Arrange
    const { SuccessMessage } = require('../../entitites/countdown/components/SuccessMessage');
    const onComplete = jest.fn(() => {
      ipcWorld.send(IpcChannels['window:hide-after-save']);
    });

    render(<SuccessMessage message="Test" onComplete={onComplete} />);

    // Act: wait for timeout
    jest.advanceTimersByTime(2000);

    // Assert
    expect(ipcWorld.send).toHaveBeenCalledWith(
      IpcChannels['window:hide-after-save']
    );
  });
});
```

#### 11.5 Unit тесты для StatsPage
**Файл:** `src/pages/StatsPage/StatsPage.spec.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { StatsPage } from './StatsPage';

describe('StatsPage', () => {
  it('should render HeatmapActivity', () => {
    render(<StatsPage />);
    expect(screen.getByTestId('heatmap-activity')).toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    render(<StatsPage />);

    const container = screen.getByTestId('heatmap-activity').closest('.relative');
    expect(container).toHaveClass('w-[330px]', 'h-[330px]');
  });
});
```

#### 11.6 Запустить все тесты
```bash
# Все тесты
npm test

# Только интеграционные
npm test -- integration.spec

# С coverage
npm test -- --coverage

# Watch mode для TDD
npm test -- --watch
```

#### 11.7 Минимальное ручное тестирование (Electron-специфичное)

**Только для проверки Electron интеграции (невозможно автоматизировать без E2E):**

1. **Tray behavior**
   - Левый клик → окно показывается/скрывается
   - Правый клик → контекстное меню

2. **Visual rendering**
   - Tray иконка обновляется (canvas image)
   - Окно позиционируется корректно под tray

3. **Production build**
   ```bash
   npm run build
   npm run start
   ```

**Все остальные сценарии покрыты автоматизированными тестами выше.**

## Критические Файлы

### Для модификации
1. **[src/entitites/countdown/components/CanvasCountdown.tsx](src/entitites/countdown/components/CanvasCountdown.tsx)** - keyboard handlers, double-click fix
2. **[src/entitites/countdown/model.ts](src/entitites/countdown/model.ts)** - SUCCESS state logic
3. **[src/entitites/countdown/constants.ts](src/entitites/countdown/constants.ts)** - SUCCESS enum
4. **[src/pages/TimerPage/TimerPage.tsx](src/pages/TimerPage/TimerPage.tsx)** - упрощение структуры
5. **[src/app/index.tsx](src/app/index.tsx)** - роутинг между экранами
6. **[electron/main.ts](electron/main.ts)** - tray menu, IPC handlers

### Для создания
7. **`src/entitites/countdown/components/SuccessMessage.tsx`** - компонент сообщения (размещен в countdown, т.к. специфичен для этого контекста)
8. **`src/app/model.ts`** - app router store (управляет навигацией всего приложения)
9. **`src/pages/StatsPage/StatsPage.tsx`** - экран статистики (отдельная страница)
10. **Тестовые файлы** - `.spec.tsx` для всех новых компонентов

### Для удаления
11. **`src/widgets/navBar/`** - весь каталог
12. **`src/widgets/timeControls/`** - весь каталог
13. **`src/widgets/progressToday/`** - весь каталог

## Верификация

### Автоматизированное тестирование (TDD подход)

#### Unit тесты
```bash
# Countdown компоненты и модель
npm test -- CanvasCountdown.spec.tsx
npm test -- SuccessMessage.spec.tsx
npm test -- countdown/model.spec.ts

# Pages
npm test -- TimerPage.spec.tsx
npm test -- StatsPage.spec.tsx

# App router
npm test -- app/model.spec.ts
```

#### Integration тесты
```bash
# Полный цикл таймера
npm test -- TimerPage.integration.spec.tsx

# App navigation
npm test -- App.integration.spec.tsx

# IPC communication
npm test -- ipc.integration.spec.ts
```

#### Coverage
```bash
npm test -- --coverage --coverageThreshold='{"global":{"statements":80,"branches":75,"functions":80,"lines":80}}'
```

#### TDD workflow
```bash
# Watch mode для разработки
npm test -- --watch

# Запускать тесты перед каждым коммитом
git add . && npm test && git commit -m "..."
```

### Минимальное ручное тестирование

**Только Electron-специфичные сценарии (невозможно автоматизировать без E2E):**

**Tray & Window Management:**
- Левый клик трея → окно показывается/скрывается под tray
- Правый клик трея → контекстное меню с пунктами
- Окно blur → автоматически скрывается
- Tray иконка обновляется canvas изображением таймера

**Production Build:**
```bash
npm run build
npm run start
# Проверить, что всё работает в production режиме
```

**Все функциональные сценарии (навигация, таймер, keyboard shortcuts, etc.) покрыты автоматизированными тестами.**

## Потенциальные Проблемы

1. **Keyboard events в тестах** - использовать `@testing-library/user-event` для симуляции
2. **Timing в SUCCESS state** - убедиться, что timeout не пересекается с другими таймерами
3. **IPC синхронизация** - проверить, что навигация работает до показа окна
4. **Focus management** - убедиться, что keyboard events работают когда окно активно

## Rollback Plan

Если что-то пойдет не так:
1. Откатить изменения в main.ts
2. Восстановить TimerPage из git
3. Проверить, что старая версия работает: `git checkout HEAD -- src/pages/TimerPage/TimerPage.tsx electron/main.ts`
