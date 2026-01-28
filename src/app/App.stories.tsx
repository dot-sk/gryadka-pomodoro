import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState, useRef } from 'react';
import { fork, Scope, allSettled } from 'effector';
import { Provider } from 'effector-react';
import { countdownModel } from '../entitites/countdown';
import { TimerPage } from '../pages/TimerPage/TimerPage';
import { IpcChannels, IPC_WORLD } from '../shared/ipcWorld/constants';
import { IpcWorld } from '../shared/ipcWorld/typings';
import { renderStringToDataURL } from '../shared/renderStringToDataURL/renderStringToDataURL';
import { formatSeconds } from '../shared/utils';

const meta: Meta = {
  title: 'App/E2E Simulation',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Mock IpcWorld для симуляции Electron IPC
 */
class MockIpcWorld implements IpcWorld {
  private listeners: Map<IpcChannels, Array<(event: unknown, ...args: unknown[]) => void>> = new Map();

  send(_channel: IpcChannels, ..._args: any[]): void {
    // Просто логируем, что отправлено
  }

  on(channel: IpcChannels, listener: (event: unknown, ...args: unknown[]) => void): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel)!.push(listener);
  }

  emit(channel: IpcChannels, ...args: unknown[]): void {
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      channelListeners.forEach(listener => listener({}, ...args));
    }
  }
}

/**
 * Компонент отображает иконку трея, рендерит напрямую из scope
 */
const TrayIcon: React.FC<{ scope: Scope }> = ({ scope }) => {
  const [trayImage, setTrayImage] = useState<string>('');

  useEffect(() => {
    // Подписываемся на изменения в scope и рендерим трей
    const interval = setInterval(() => {
      const time = scope.getState(countdownModel.$time);
      const totalTime = scope.getState(countdownModel.$currentInterval);
      const isPaused = scope.getState(countdownModel.$isPaused);
      const hasActiveTimer = scope.getState(countdownModel.$hasActiveTimer);

      const progress = totalTime > 0 ? Math.min(1, (time + 1) / totalTime) : 1;
      const canvas = document.createElement('canvas');

      const imageUrl = renderStringToDataURL(
        formatSeconds(time),
        'light',
        canvas,
        isPaused,
        progress,
        hasActiveTimer
      );

      setTrayImage(imageUrl);
    }, 100);

    return () => clearInterval(interval);
  }, [scope]);

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-gray-100 rounded-lg">
      <div className="text-xs text-gray-400 uppercase">Tray</div>
      {trayImage ? (
        <img
          src={trayImage}
          alt="Tray"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <div className="text-gray-500 text-xs">...</div>
      )}
    </div>
  );
};

/**
 * Debug info
 */
const DebugInfo: React.FC<{ scope: Scope }> = ({ scope }) => {
  const [state, setState] = useState<any>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setState({
        time: scope.getState(countdownModel.$time),
        isRunning: scope.getState(countdownModel.$isRunning),
        hasActiveTimer: scope.getState(countdownModel.$hasActiveTimer),
      });
    }, 100);

    return () => clearInterval(interval);
  }, [scope]);

  return (
    <div className="text-xs font-mono text-gray-600 space-y-1">
      <div>time: {state.time}</div>
      <div>isRunning: {String(state.isRunning)}</div>
      <div>hasActiveTimer: {String(state.hasActiveTimer)}</div>
    </div>
  );
};

/**
 * E2E Story: Полная симуляция lifecycle
 */
export const FullLifecycle: Story = {
  name: 'Full Lifecycle',
  render: () => {
    const [scope, setScope] = useState<Scope | null>(null);
    const [mockIpc, setMockIpc] = useState<MockIpcWorld | null>(null);
    const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastTickRef = useRef<number>(Date.now());

    useEffect(() => {
      // Cleanup previous
      if ((window as any)[IPC_WORLD]) {
        delete (window as any)[IPC_WORLD];
      }

      // Setup mock IPC
      const newMockIpc = new MockIpcWorld();
      (window as any)[IPC_WORLD] = newMockIpc;
      setMockIpc(newMockIpc);

      // Create isolated scope
      const newScope = fork();
      setScope(newScope);

      // Start clock tick simulator (100ms intervals)
      clockIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const msSinceLastTick = now - lastTickRef.current;
        lastTickRef.current = now;

        // Emit clock tick через scope
        allSettled(countdownModel.events.clockInterval, {
          scope: newScope,
          params: msSinceLastTick
        });
      }, 100);

      // Lifecycle: screensaver -> setup -> running
      const lifecycle = async () => {
        // Screensaver (2s)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Setup 5 min
        await allSettled(countdownModel.events.setTime, {
          scope: newScope,
          params: 299
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Start timer
        await allSettled(countdownModel.events.start, {
          scope: newScope,
          params: { interval: 300 }
        });
      };

      lifecycle();

      return () => {
        if (clockIntervalRef.current) {
          clearInterval(clockIntervalRef.current);
        }
        delete (window as any)[IPC_WORLD];
      };
    }, []);

    if (!scope || !mockIpc) {
      return <div>Loading...</div>;
    }

    return (
      <div className="flex flex-col items-center gap-6 p-8">
        <h2 className="text-xl font-bold">E2E Simulation</h2>

        <div className="flex items-start gap-6">
          {/* App Window */}
          <div className="border-4 border-gray-300 rounded-lg overflow-hidden bg-white">
            <Provider value={scope}>
              <TimerPage />
            </Provider>
          </div>

          {/* Tray Icon */}
          <TrayIcon scope={scope} />
        </div>

        {/* Debug */}
        <DebugInfo scope={scope} />
      </div>
    );
  },
};

/**
 * Screensaver only
 */
export const Screensaver: Story = {
  name: 'Screensaver',
  render: () => {
    const [scope, setScope] = useState<Scope | null>(null);
    const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastTickRef = useRef<number>(Date.now());

    useEffect(() => {
      if ((window as any)[IPC_WORLD]) {
        delete (window as any)[IPC_WORLD];
      }

      const mockIpc = new MockIpcWorld();
      (window as any)[IPC_WORLD] = mockIpc;

      const newScope = fork();
      setScope(newScope);

      clockIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const ms = now - lastTickRef.current;
        lastTickRef.current = now;

        allSettled(countdownModel.events.clockInterval, {
          scope: newScope,
          params: ms
        });
      }, 100);

      return () => {
        if (clockIntervalRef.current) {
          clearInterval(clockIntervalRef.current);
        }
        delete (window as any)[IPC_WORLD];
      };
    }, []);

    if (!scope) return <div>Loading...</div>;

    return (
      <div className="flex items-center gap-6 p-8">
        <div className="border-4 border-gray-300 rounded-lg overflow-hidden bg-white">
          <Provider value={scope}>
            <TimerPage />
          </Provider>
        </div>
        <TrayIcon scope={scope} />
      </div>
    );
  },
};

/**
 * Running timer
 */
export const RunningTimer: Story = {
  name: 'Running Timer',
  render: () => {
    const [scope, setScope] = useState<Scope | null>(null);
    const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastTickRef = useRef<number>(Date.now());

    useEffect(() => {
      if ((window as any)[IPC_WORLD]) {
        delete (window as any)[IPC_WORLD];
      }

      const mockIpc = new MockIpcWorld();
      (window as any)[IPC_WORLD] = mockIpc;

      const newScope = fork();
      setScope(newScope);

      clockIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const ms = now - lastTickRef.current;
        lastTickRef.current = now;

        allSettled(countdownModel.events.clockInterval, {
          scope: newScope,
          params: ms
        });
      }, 100);

      // Start timer immediately
      allSettled(countdownModel.events.start, {
        scope: newScope,
        params: { interval: 300 }
      });

      return () => {
        if (clockIntervalRef.current) {
          clearInterval(clockIntervalRef.current);
        }
        delete (window as any)[IPC_WORLD];
      };
    }, []);

    if (!scope) return <div>Loading...</div>;

    return (
      <div className="flex items-center gap-6 p-8">
        <div className="border-4 border-gray-300 rounded-lg overflow-hidden bg-white">
          <Provider value={scope}>
            <TimerPage />
          </Provider>
        </div>
        <TrayIcon scope={scope} />
      </div>
    );
  },
};

/**
 * Paused timer - показывает иконку паузы в трее
 */
export const PausedTimer: Story = {
  name: 'Paused Timer',
  render: () => {
    const [scope, setScope] = useState<Scope | null>(null);
    const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastTickRef = useRef<number>(Date.now());

    useEffect(() => {
      if ((window as any)[IPC_WORLD]) {
        delete (window as any)[IPC_WORLD];
      }

      const mockIpc = new MockIpcWorld();
      (window as any)[IPC_WORLD] = mockIpc;

      const newScope = fork();
      setScope(newScope);

      clockIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const ms = now - lastTickRef.current;
        lastTickRef.current = now;

        allSettled(countdownModel.events.clockInterval, {
          scope: newScope,
          params: ms
        });
      }, 100);

      // Start timer and immediately pause
      const setup = async () => {
        await allSettled(countdownModel.events.start, {
          scope: newScope,
          params: { interval: 300 }
        });
        await allSettled(countdownModel.events.pause, {
          scope: newScope,
        });
      };
      setup();

      return () => {
        if (clockIntervalRef.current) {
          clearInterval(clockIntervalRef.current);
        }
        delete (window as any)[IPC_WORLD];
      };
    }, []);

    if (!scope) return <div>Loading...</div>;

    return (
      <div className="flex items-center gap-6 p-8">
        <div className="border-4 border-gray-300 rounded-lg overflow-hidden bg-white">
          <Provider value={scope}>
            <TimerPage />
          </Provider>
        </div>
        <TrayIcon scope={scope} />
      </div>
    );
  },
};
