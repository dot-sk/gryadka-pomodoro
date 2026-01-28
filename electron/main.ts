import { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu } from "electron";
import * as path from "path";
import { IpcChannels } from "../src/shared/ipcWorld/constants";
import { formatTime } from "../src/shared/utils";
import { store } from "./store";

let window: BrowserWindow | null;

function createWindow() {
  window = new BrowserWindow({
    width: 376,
    height: 152,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      // contextIsolation: false,
      backgroundThrottling: true,
      preload: path.join(__dirname, "preload.js"),
    },
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
    // vite-plugin-electron передаёт URL через env
    window.loadURL(process.env.VITE_DEV_SERVER_URL || "http://localhost:5173");
  }
}

app.whenReady().then(() => {
  app.dock?.hide();

  // DevTools only in development
  if (!app.isPackaged) {
    const { default: installExtension, REACT_DEVELOPER_TOOLS } = require("electron-devtools-installer");
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name: string) => console.log(`Added Extension:  ${name}`))
      .catch((err: Error) => console.log("An error occurred: ", err));
  }

  createWindow();

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

  // Создаём placeholder иконку 16x16 (пустая иконка может не работать в dev)
  const placeholderIcon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAADklEQVQ4jWNgGAWjAAcAAAQQAAHBu5uzAAAAAElFTkSuQmCC"
  );
  placeholderIcon.setTemplateImage(true);
  const tray = new Tray(placeholderIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Старт/Пауза",
      type: "normal",
      accelerator: "Space",
      click: () => {
        window?.webContents.send(IpcChannels["toggle-play-pause"]);
        if (!window?.isVisible()) {
          const bounds = tray.getBounds();
          window?.setBounds({
            x: bounds.x,
            y: bounds.y + bounds.height,
            width: window?.getBounds().width || 376,
            height: window?.getBounds().height || 152,
          });
          window?.show();
        }
      }
    },
    { type: "separator" },
    {
      label: "Таймер",
      type: "normal",
      accelerator: "CommandOrControl+1",
      click: () => {
        window?.webContents.send(IpcChannels["navigate-to-timer"]);
        if (!window?.isVisible()) {
          // Show window at tray position
          const bounds = tray.getBounds();
          window?.setBounds({
            x: bounds.x,
            y: bounds.y + bounds.height,
            width: window?.getBounds().width || 376,
            height: window?.getBounds().height || 152,
          });
          window?.show();
        }
      }
    },
    {
      label: "Статистика",
      type: "normal",
      accelerator: "CommandOrControl+2",
      click: () => {
        window?.webContents.send(IpcChannels["navigate-to-stats"]);
        if (!window?.isVisible()) {
          const bounds = tray.getBounds();
          window?.setBounds({
            x: bounds.x,
            y: bounds.y + bounds.height,
            width: window?.getBounds().width || 376,
            height: window?.getBounds().height || 152,
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

  tray.on("click", (e, bounds) => {
    if (!window) {
      createWindow();
    }

    const { x, y, height: trayHeight } = bounds;
    const { width, height } = window?.getBounds() || {};

    if (window?.isVisible()) {
      return window?.hide();
    }

    window?.setBounds({
      x,
      y: y + trayHeight,
      width,
      height,
    });
    window?.show();

    // Show devtools when command clicked
    if (window?.isVisible() && process.defaultApp && e.metaKey) {
      window?.webContents.openDevTools({ mode: "detach" });
    }
  });

  tray.on("right-click", (e, bounds) => {
    tray.popUpContextMenu(contextMenu);
  });

  tray.setTitle("...");

  ipcMain.on(
    IpcChannels["countdown-tick-as-image"],
    (event, dataURL: string) => {
      // Извлекаем base64 данные из dataURL и создаём buffer
      const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // scaleFactor: 2 говорит Electron что это Retina-картинка
      const image = nativeImage.createFromBuffer(buffer, { scaleFactor: 2 });

      // Template image автоматически адаптируется к теме системного трея на macOS
      image.setTemplateImage(true);

      tray.setTitle("");
      tray.setImage(image);
    }
  );

  /**
   * Тикаем в процессе электрона,
   * чтобы выставить "backgroundThrottling: true" у окна,
   * чтобы сэкономить cpu
   */
  let prevTime = Date.now()
  setInterval(() => {
    const now = Date.now()
    const msSinceLastTick = now - prevTime
    prevTime = now
    window?.webContents.send(IpcChannels['clock:tick'], msSinceLastTick)
  }, 1000)

  ipcMain.on(IpcChannels["countdown-tick"], (event, seconds: string) => {
    const secNumber = parseInt(seconds, 10);

    tray.setTitle(formatTime(secNumber));
  });

  ipcMain.on(IpcChannels["window:hide-after-save"], () => {
    window?.hide();
  });

  // Electron-store IPC handlers
  ipcMain.handle("store:get", (_, key: string) => {
    return store.get(key);
  });

  ipcMain.handle("store:set", (_, key: string, value: any) => {
    store.set(key, value);
  });
});
