# Gryadka — Pomodoro Timer для macOS

Electron menubar app с таймером в системном трее. Док скрыт.

## Стек

Electron 28 + React 18 + TypeScript + Effector + Vite + Tailwind

## Структура

```
electron/
  main.ts              # Main process: tray, IPC, clock ticks
  preload.ts           # Context bridge
src/
  entitites/
    countdown/model.ts # $time, $isRunning — логика таймера
    settings/model.ts  # $settings — конфиг (persisted)
  features/
    mainThread/model.ts # Координация tray-рендеринга
    ding/              # Звук по окончании
    stats/             # Статистика
  shared/
    ipcWorld/          # IPC абстракция + constants
    renderStringToDataURL/ # Canvas → PNG для трея
```

## Архитектура трея

### Поток данных

```
Main: setInterval(1s) → IPC 'clock:tick'
         ↓
Renderer: countdown/$time--
         ↓
Renderer: mainThread watches $time
         ↓
Canvas: renderStringToDataURL() → PNG base64
         ↓
IPC 'countdown-tick-as-image' → Main
         ↓
tray.setImage()
```

### Почему тики в main process

`backgroundThrottling: true` в окне экономит CPU когда окно скрыто. Но throttling замедляет setInterval в renderer. Поэтому тики генерируются в main и шлются через IPC.

### Template Images

```typescript
// electron/main.ts
image.setTemplateImage(true)
```

macOS автоматически инвертирует цвета template image под тему трея. Рисуем чёрным → на тёмном фоне будет белым.

## IPC Channels

```typescript
"clock:tick"              // main → renderer, ms since last tick
"countdown-tick-as-image" // renderer → main, PNG DataURL
"countdown-tick"          // renderer → main, секунды (legacy, не используется)
```

## Canvas рендеринг

`src/shared/renderStringToDataURL/renderStringToDataURL.ts`

- 100x36px canvas
- IBM Plex Mono 24px
- Скруглённый прямоугольник + текст по центру
- Возвращает `canvas.toDataURL("image/png")`

## Effector модели

### countdown
- `$time` — секунды до конца
- `$isRunning` — активен ли отсчёт
- Декремент на каждый `clock:tick` когда running

### settings
- Persisted через effector-localstorage
- `theme`, `sound`, `dailyGoalSeconds`, `workIntervals`, `restIntervals`

### mainThread
- `$fontReady` — ждёт загрузки IBM Plex Mono
- `willRender` — sample от $time когда шрифт готов
- watch отправляет PNG в main process
