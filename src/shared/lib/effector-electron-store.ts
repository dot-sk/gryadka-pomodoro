import { Store } from "effector";

declare global {
  interface Window {
    electronStore: {
      get: (key: string) => Promise<any>;
      set: (key: string, value: any) => Promise<void>;
    };
  }
}

export function connectElectronStore<T = any>(key: string) {
  return {
    init: (defaultValue: T): T => {
      return defaultValue;
    },
    // Функция для подписки на изменения store
    subscribe: (store: Store<T>) => {
      store.watch(async (state) => {
        try {
          await window.electronStore.set(key, state);
        } catch (e) {
          console.error(`Failed to save to electron-store: ${key}`, e);
        }
      });
    },
  };
}

// Функция для загрузки данных из electron-store при старте
export async function loadFromElectronStore<T>(
  key: string,
  defaultValue: T
): Promise<T> {
  try {
    const value = await window.electronStore.get(key);
    return value !== undefined ? value : defaultValue;
  } catch (e) {
    console.error(`Failed to load from electron-store: ${key}`, e);
    return defaultValue;
  }
}
