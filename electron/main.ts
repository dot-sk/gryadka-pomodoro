import { app, BrowserWindow, ipcMain, Tray, nativeImage } from "electron";
import * as path from "path";
import installExtension, {
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { IpcChannels } from "../src/shared/ipc/constants";
// import { renderStringToDataURL } from "../src/shared/renderStringToDataURL/renderStringToDataURL";
import { formatTime } from "../src/shared/utils";

function createWindow() {
  const window = new BrowserWindow({
    width: 375,
    height: 630,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      // contextIsolation: false,
      backgroundThrottling: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  window.on("blur", () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide();
    }
  });

  if (app.isPackaged) {
    // 'build/index.html'
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

  return window;
}

// app.dock.hide();

app.whenReady().then(() => {
  // DevTools
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log("An error occurred: ", err));

  let window = createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      window = createWindow();
    }
  });

  app.on("window-all-closed", () => {
    // if (process.platform !== "darwin") {
    app.quit();
    // }
  });

  const trayIcon = nativeImage.createEmpty();
  const tray = new Tray(trayIcon);
  tray.setTitle("0:00");

  tray.on("click", (e, bounds) => {
    const { x, y, height: trayHeight } = bounds;
    const { width, height } = window.getBounds();

    if (window.isVisible()) {
      return window.hide();
    }

    window.setBounds({
      x,
      y: y + trayHeight,
      width,
      height,
    });
    window.show();

    // Show devtools when command clicked
    if (window.isVisible() && process.defaultApp && e.metaKey) {
      window.webContents.openDevTools({ mode: "detach" });
    }
  });

  // ipcMain.on(
  //   IpcChannels["timeControls-seconds-as-image"],
  //   (event, dataURL: string) => {
  //     tray.setImage(nativeImage.createFromDataURL(dataURL));
  //   }
  // );

  ipcMain.on(IpcChannels["countdown-tick"], (event, seconds: string) => {
    const secNumber = parseInt(seconds, 10);

    tray.setTitle(formatTime(secNumber));
  });
});
