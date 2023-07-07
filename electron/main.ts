import { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu } from "electron";
import * as path from "path";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { IpcChannels } from "../src/shared/ipcWorld/constants";
import { formatTime } from "../src/shared/utils";

let window: BrowserWindow | null;

function createWindow() {
  window = new BrowserWindow({
    width: 375,
    height: 630,
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
    window.loadURL("http://localhost:3000/index.html");

    // Hot Reloading on 'node_modules/.bin/electronPath'
    require("electron-reload")(__dirname, {
      electron: path.join(
        __dirname,
        "..",
        "..",
        "node_modules",
        ".bin",
        "electron" + (process.platform === "win32" ? ".cmd" : "")
      ),
      forceHardReset: true,
      hardResetMethod: "exit",
    });
  }
}

app.dock.hide();

app.whenReady().then(() => {
  // DevTools
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log("An error occurred: ", err));

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

  const trayIcon = nativeImage.createEmpty();
  const tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Выйти", type: "normal", click: () => app.quit() },
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
      const image = nativeImage.createFromDataURL(dataURL);
      const { width, height } = image.getSize();

      tray.setTitle("");
      tray.setImage(image.resize({ width: width / 2, height: height / 2 }));
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
});
