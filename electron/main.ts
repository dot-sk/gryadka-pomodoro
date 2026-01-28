import { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu } from "electron";
import * as path from "path";
import * as os from "os";
import { IpcChannels } from "../src/shared/ipcWorld/constants";
import { formatTime } from "../src/shared/utils";
import { store } from "./store";
import { setupAutoUpdater } from "./updater";
import liquidGlass, { GlassOptions } from "electron-liquid-glass";

/**
 * Check if Liquid Glass is available
 * Requires macOS 26+ (Tahoe)
 */
function isLiquidGlassAvailable(): boolean {
  if (process.platform !== "darwin") return false;

  const release = os.release(); // e.g. "25.0.0" for macOS 26
  const majorVersion = parseInt(release.split(".")[0], 10);
  // Darwin 25.x = macOS 26.x (Tahoe)
  return majorVersion >= 25;
}

const liquidGlassEnabled = isLiquidGlassAvailable();

const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 136;
const TICK_INTERVAL_MS = 1000;

let window: BrowserWindow | null;
let tray: Tray | null = null;

function createWindow() {
  window = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: liquidGlassEnabled,
    webPreferences: {
      backgroundThrottling: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  window.webContents.once("did-finish-load", () => {
    if (!window) return;

    // Send liquid glass state to renderer
    window.webContents.send(IpcChannels["liquid-glass-state"], liquidGlassEnabled);

    if (liquidGlassEnabled) {
      // 🪄 Apply Liquid Glass effect
      const glassOptions: GlassOptions = {
        cornerRadius: 16,
      };
      const glassId = liquidGlass.addView(window.getNativeWindowHandle(), glassOptions);
      liquidGlass.unstable_setVariant(glassId, 1);
    }
  });

  window.on("blur", () => {
    if (!window?.webContents.isDevToolsOpened()) {
      window?.hide();
    }
  });

  window.on("close", () => {
    window = null;
  });

  if (app.isPackaged) {
    window.loadURL(`file://${__dirname}/../index.html`);
  } else {
    window.loadURL(process.env.VITE_DEV_SERVER_URL || "http://localhost:5173");
  }
}

function showWindowAtTray(): void {
  if (!window || !tray) return;

  const trayBounds = tray.getBounds();
  const windowBounds = window.getBounds();

  window.setBounds({
    x: trayBounds.x,
    y: trayBounds.y + trayBounds.height,
    width: windowBounds.width || DEFAULT_WIDTH,
    height: windowBounds.height || DEFAULT_HEIGHT,
  });
  window.show();
}

function ensureWindowVisible(): void {
  if (!window?.isVisible()) {
    showWindowAtTray();
  }
}

app.whenReady().then(() => {
  app.dock?.hide();

  if (!app.isPackaged) {
    const { default: installExtension, REACT_DEVELOPER_TOOLS } = require("electron-devtools-installer");
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name: string) => console.log(`Added Extension:  ${name}`))
      .catch((err: Error) => console.log("An error occurred: ", err));
  }

  createWindow();
  const updater = setupAutoUpdater(window);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  const placeholderIcon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAADklEQVQ4jWNgGAWjAAcAAAQQAAHBu5uzAAAAAElFTkSuQmCC"
  );
  placeholderIcon.setTemplateImage(true);
  tray = new Tray(placeholderIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Старт/Пауза",
      type: "normal",
      accelerator: "Space",
      click: () => {
        window?.webContents.send(IpcChannels["toggle-play-pause"]);
        ensureWindowVisible();
      }
    },
    { type: "separator" },
    {
      label: "Таймер",
      type: "normal",
      accelerator: "CommandOrControl+1",
      click: () => {
        window?.webContents.send(IpcChannels["navigate-to-timer"]);
        ensureWindowVisible();
      }
    },
    {
      label: "Статистика",
      type: "normal",
      accelerator: "CommandOrControl+2",
      click: () => {
        window?.webContents.send(IpcChannels["navigate-to-stats"]);
        ensureWindowVisible();
      }
    },
    { type: "separator" },
    {
      label: "Проверить обновления",
      type: "normal",
      click: () => updater.checkForUpdates()
    },
    {
      label: "Выйти",
      type: "normal",
      click: () => app.quit()
    },
  ]);

  tray.on("click", (e, bounds) => {
    if (!window) {
      createWindow();
    }

    if (window?.isVisible()) {
      return window?.hide();
    }

    const { x, y, height: trayHeight } = bounds;
    const { width, height } = window?.getBounds() || {};

    window?.setBounds({ x, y: y + trayHeight, width, height });
    window?.show();

    if (window?.isVisible() && process.defaultApp && e.metaKey) {
      window?.webContents.openDevTools({ mode: "detach" });
    }
  });

  tray.on("right-click", () => {
    tray?.popUpContextMenu(contextMenu);
  });

  tray.setTitle("...");

  ipcMain.on(IpcChannels["countdown-tick-as-image"], (_, dataURL: string) => {
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const image = nativeImage.createFromBuffer(buffer, { scaleFactor: 2 });
    image.setTemplateImage(true);

    tray?.setTitle("");
    tray?.setImage(image);
  });

  // Tick from main process to save CPU with backgroundThrottling enabled
  let prevTime = Date.now();
  setInterval(() => {
    const now = Date.now();
    const msSinceLastTick = now - prevTime;
    prevTime = now;
    window?.webContents.send(IpcChannels["clock:tick"], msSinceLastTick);
  }, TICK_INTERVAL_MS);

  ipcMain.on(IpcChannels["countdown-tick"], (_, seconds: string) => {
    tray?.setTitle(formatTime(parseInt(seconds, 10)));
  });

  ipcMain.on(IpcChannels["window:hide-after-save"], () => {
    window?.hide();
  });

  ipcMain.handle("store:get", (_, key: string) => store.get(key));
  ipcMain.handle("store:set", (_, key: string, value: any) => store.set(key, value));

  ipcMain.on(IpcChannels["download-update"], () => updater.downloadUpdate());
  ipcMain.on(IpcChannels["install-update"], () => updater.quitAndInstall());
});


