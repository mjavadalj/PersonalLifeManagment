import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  powerMonitor,
  protocol,
  screen,
  session,
  shell,
  Tray,
} from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { Store } from "./store";
import { dayKey } from "../src/shared/date";
import { applyCommand } from "../src/shared/commands";
import { pickQuote, reminderDue } from "../src/shared/logic";
import { focusedQuotes } from "../src/data/quotes";
import { quotes } from "../src/data/quotes";
import type { Command, Snapshot } from "../src/shared/types";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "roy-app",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
  {
    scheme: "roy-media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);
if (process.env.ROYESH_DATA_DIR)
  app.setPath("userData", path.resolve(process.env.ROYESH_DATA_DIR));
const dev = !app.isPackaged ? process.env.ROYESH_DEV_URL : undefined;
let store: Store,
  main: BrowserWindow | undefined,
  widget: BrowserWindow | undefined,
  tray: Tray | undefined,
  quitting = false,
  lastDay = "",
  widgetExpandedHeight = 220;
const root = path.join(__dirname, "../dist");
const appIcon = path.join(root, "icon.png");
const options = {
  preload: path.join(__dirname, "preload.cjs"),
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
};
function trusted(event: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent) {
  if (
    ![main?.webContents.id, widget?.webContents.id].includes(event.sender.id) ||
    event.senderFrame !== event.sender.mainFrame
  )
    throw Error("Invalid sender");
}
function secureWindow(win: BrowserWindow) {
  const pause = () => win.webContents.send("roy:pause-media");
  win.on("hide", pause);
  win.on("minimize", pause);
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
}
async function loadWindow(win: BrowserWindow, isWidget = false) {
  secureWindow(win);
  if (dev) await win.loadURL(`${dev}${isWidget ? "?widget=1" : ""}`);
  else
    await win.loadURL(`roy-app://app/index.html${isWidget ? "?widget=1" : ""}`);
}
function showMain() {
  if (main) {
    main.show();
    main.focus();
    return;
  }
  main = new BrowserWindow({
    width: 820,
    height: 610,
    minWidth: 630,
    minHeight: 490,
    frame: false,
    backgroundColor: "#faf9f5",
    show: false,
    title: "رویش",
    icon: appIcon,
    webPreferences: options,
  });
  main.on("close", (e) => {
    if (!quitting) {
      e.preventDefault();
      main?.hide();
    }
  });
  main.once("ready-to-show", () => main?.show());
  void loadWindow(main);
}
export function clampPosition(
  bounds: { x: number; y: number } | undefined,
  width: number,
  height: number,
) {
  const areas = screen.getAllDisplays().map((d) => d.workArea);
  const area =
    areas.find(
      (a) =>
        bounds &&
        bounds.x >= a.x &&
        bounds.x < a.x + a.width &&
        bounds.y >= a.y &&
        bounds.y < a.y + a.height,
    ) ?? screen.getPrimaryDisplay().workArea;
  return {
    x: Math.max(
      area.x,
      Math.min(
        bounds?.x ?? area.x + area.width - width - 24,
        area.x + area.width - width,
      ),
    ),
    y: Math.max(
      area.y,
      Math.min(bounds?.y ?? area.y + 80, area.y + area.height - height),
    ),
  };
}
function positionWidget() {
  if (!widget) return;
  const [width, height] = widget.getSize();
  widget.setPosition(
    ...(Object.values(
      clampPosition(
        { x: widget.getBounds().x, y: widget.getBounds().y },
        width,
        height,
      ),
    ) as [number, number]),
  );
}
function syncWidget() {
  if (!store.state.settings.widgetEnabled) {
    widget?.hide();
    return;
  }
  if (widget) {
    widget.showInactive();
    return;
  }
  const pos = clampPosition(
    store.state.settings.widgetBounds,
    280,
    widgetExpandedHeight,
  );
  widget = new BrowserWindow({
    width: store.state.settings.widgetCompact ? 220 : 280,
    height: widgetExpandedHeight,
    ...pos,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: "#faf9f5",
    title: "رویش · ویجت",
    icon: appIcon,
    webPreferences: options,
  });
  widget.setAlwaysOnTop(true, "floating");
  widget.once("ready-to-show", () => widget?.showInactive());
  widget.on("close", (e) => {
    if (!quitting) {
      e.preventDefault();
      void store
        .transaction((s) => {
          s.settings.widgetEnabled = false;
        })
        .then(() => {
          widget?.hide();
          return broadcast();
        });
    }
  });
  let timer: ReturnType<typeof setTimeout>;
  widget.on("moved", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (widget)
        void store
          .transaction((s) => {
            s.settings.widgetBounds = {
              x: widget!.getBounds().x,
              y: widget!.getBounds().y,
            };
          })
          .catch(console.error);
    }, 400);
  });
  void loadWindow(widget, true);
}
async function snapshot(): Promise<Snapshot> {
  const today = dayKey();
  if (!store.state.quotes.byDate[today])
    await store.transaction((s) =>
      pickQuote(
        s.quotes,
        today,
        focusedQuotes.map((q) => q.id),
      ),
    );
  let quoteId = store.state.quotes.byDate[today];
  if (!focusedQuotes.some((q) => q.id === quoteId))
    await store.transaction((s) => {
      delete s.quotes.byDate[today];
      quoteId = pickQuote(
        s.quotes,
        today,
        focusedQuotes.map((q) => q.id),
      );
    });
  const quote = focusedQuotes.find((q) => q.id === quoteId)!;
  return { state: store.state, today, quote, warning: store.warning };
}
async function broadcast() {
  const snap = await snapshot();
  for (const win of [main, widget])
    if (win && !win.isDestroyed()) win.webContents.send("roy:state", snap);
  return snap;
}
async function tick() {
  const today = dayKey();
  if (lastDay !== today) {
    lastDay = today;
    await broadcast();
  }
  const now = new Date(),
    time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (Notification.isSupported() && reminderDue(store.state, today, time)) {
    let notify = false;
    await store.transaction((s) => {
      if (reminderDue(s, today, time)) {
        s.settings.lastReminder = today;
        notify = true;
      }
    });
    if (notify) {
      const notification = new Notification({
        title: "رویش",
        body: "وقت ثبت امروز است",
      });
      notification.on("click", () => showMain());
      notification.show();
    }
  }
}
async function importMedia() {
  const parent = main ?? widget!;
  const result = await dialog.showOpenDialog(parent, {
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "عکس و فیلم",
        extensions: ["jpg", "jpeg", "png", "webp", "mp4", "webm"],
      },
    ],
  });
  if (result.canceled) return snapshot();
  const directory = path.join(store.directory, "media");
  await fs.mkdir(directory, { recursive: true });
  const added: typeof store.state.media = [];
  try {
    for (const file of result.filePaths) {
      const extension = path.extname(file).toLowerCase();
      if (
        ![".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm"].includes(extension)
      )
        throw Error("نوع فایل پشتیبانی نمی‌شود.");
      const stat = await fs.stat(file);
      if (!stat.isFile() || stat.size === 0 || stat.size > 1024 * 1024 * 1024)
        throw Error("فایل باید سالم و کوچک‌تر از یک گیگابایت باشد.");
      const kind = [".mp4", ".webm"].includes(extension) ? "video" : "image";
      if (kind === "image") {
        // nativeImage accepts PNG/JPEG, while Chromium also decodes WebP.
        // Check the WebP container here; the renderer reports decode errors.
        let valid = false;
        if (extension === ".webp") {
          const handle = await fs.open(file, "r");
          try {
            const header = Buffer.alloc(20);
            const { bytesRead } = await handle.read(header, 0, 20, 0);
            valid =
              bytesRead === 20 &&
              header.toString("ascii", 0, 4) === "RIFF" &&
              header.toString("ascii", 8, 12) === "WEBP" &&
              ["VP8 ", "VP8L", "VP8X"].includes(
                header.toString("ascii", 12, 16),
              ) &&
              header.readUInt32LE(4) + 8 === stat.size;
          } finally {
            await handle.close();
          }
        } else valid = !nativeImage.createFromPath(file).isEmpty();
        if (!valid) throw Error("عکس خوانده نشد. یک فایل سالم انتخاب کنید.");
      }
      const item = {
        id: randomUUID(),
        name: path.basename(file),
        extension,
        kind,
      } as const;
      await fs.copyFile(file, path.join(directory, item.id + extension));
      added.push(item);
    }
    await store.transaction((s) => {
      s.media.push(...added);
      s.settings.selectedMedia ??= added[0]?.id;
    });
  } catch (e) {
    await Promise.all(
      added.map((m) =>
        fs.unlink(path.join(directory, m.id + m.extension)).catch(() => {}),
      ),
    );
    throw e;
  }
  return broadcast();
}
async function setup() {
  store = new Store(app.getPath("userData"));
  await store.load();
  app.setAppUserModelId("com.royesh.desktop");
  // Internal file reads use a session that no renderer can access. Renderer
  // networking remains blocked; only the two validated protocols reach it.
  const localFiles = session.fromPartition("roy-local-files", { cache: false });
  protocol.handle("roy-app", (request) => {
    const url = new URL(request.url),
      relative = decodeURIComponent(url.pathname);
    const file = path.resolve(root, "." + relative);
    if (url.hostname !== "app" || !file.startsWith(root + path.sep))
      return new Response("", { status: 403 });
    return localFiles.fetch(pathToFileURL(file).href);
  });
  protocol.handle("roy-media", async (request) => {
    const url = new URL(request.url);
    const item = store.state.media.find((m) => m.id === url.hostname);
    if (!item || url.pathname !== "/") return new Response("", { status: 404 });
    const response = await localFiles.fetch(
      pathToFileURL(
        path.join(store.directory, "media", item.id + item.extension),
      ).href,
      { headers: request.headers },
    );
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    return new Response(response.body, { status: response.status, headers });
  });
  session.defaultSession.setPermissionRequestHandler(
    (_wc, _permission, callback) => callback(false),
  );
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.webRequest.onBeforeRequest((details, cb) => {
    const allowed =
      details.url.startsWith("roy-app:") ||
      details.url.startsWith("roy-media:") ||
      details.url.startsWith("data:") ||
      details.url.startsWith("blob:") ||
      (!!dev &&
        (details.url.startsWith(dev + "/") ||
          details.url.startsWith("ws://127.0.0.1:5173/")));
    cb({ cancel: !allowed });
  });
  ipcMain.handle("roy:read", (event) => {
    trusted(event);
    return snapshot();
  });
  ipcMain.handle("roy:dispatch", async (event, command: Command) => {
    trusted(event);
    const old =
      command.type === "removeMedia"
        ? store.state.media.find((m) => m.id === command.id)
        : undefined;
    await store.transaction((s) =>
      applyCommand(s, command, dayKey(), randomUUID),
    );
    if (old)
      await fs
        .unlink(path.join(store.directory, "media", old.id + old.extension))
        .catch(() => {});
    if (command.type === "settings") {
      if (command.patch.launchAtLogin !== undefined)
        app.setLoginItemSettings({
          openAtLogin: store.state.settings.launchAtLogin,
          args: ["--hidden"],
        });
      syncWidget();
    }
    return broadcast();
  });
  ipcMain.handle("roy:import", (event) => {
    trusted(event);
    return importMedia();
  });
  ipcMain.handle("roy:source", async (event, id: unknown) => {
    trusted(event);
    const quote = quotes.find((q) => q.id === id);
    if (quote) await shell.openExternal(quote.source);
  });
  ipcMain.handle("roy:window", async (event, action: unknown) => {
    trusted(event);
    const win = BrowserWindow.fromWebContents(event.sender);
    if (action === "close") win?.close();
    else if (action === "minimize") win?.minimize();
    else if (action === "maximize" && win === main) {
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
    } else if (action === "main") showMain();
    else if (action === "hideWidget") {
      await store.transaction((s) => {
        s.settings.widgetEnabled = false;
      });
      syncWidget();
      await broadcast();
    }
  });
  ipcMain.on("roy:height", (event, height: unknown) => {
    trusted(event);
    if (
      event.sender.id !== widget?.webContents.id ||
      typeof height !== "number" ||
      !Number.isFinite(height)
    )
      return;
    const max =
      screen.getDisplayMatching(widget.getBounds()).workArea.height - 24;
    widgetExpandedHeight = Math.max(
      store.state.settings.widgetCompact ? 120 : 170,
      Math.min(Math.ceil(height), max),
    );
    // Windows fixes min/max bounds on non-resizable windows. Temporarily
    // unlock them for this programmatic size change, then restore the card.
    widget.setResizable(true);
    widget.setSize(
      store.state.settings.widgetCompact ? 220 : 280,
      widgetExpandedHeight,
    );
    widget.setResizable(false);
    positionWidget();
  });
  // Tiny native tray icon, authored locally and bundled without external assets.
  tray = new Tray(
    nativeImage.createFromPath(appIcon).resize({ width: 16, height: 16 }),
  );
  tray.setToolTip("رویش");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "باز کردن رویش", click: showMain },
      {
        label: "نمایش / پنهان‌کردن ویجت",
        click: () =>
          void store
            .transaction((s) => {
              s.settings.widgetEnabled = !s.settings.widgetEnabled;
            })
            .then(() => {
              syncWidget();
              return broadcast();
            }),
      },
      { type: "separator" },
      {
        label: "خروج",
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on("double-click", showMain);
  if (!process.argv.includes("--hidden")) showMain();
  syncWidget();
  await tick();
  setInterval(() => void tick().catch(console.error), 15000);
  powerMonitor.on("resume", () => void tick().catch(console.error));
  screen.on("display-removed", positionWidget);
  screen.on("display-metrics-changed", positionWidget);
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => showMain());
  app.on("before-quit", () => {
    quitting = true;
  });
  app.on("window-all-closed", () => {});
  app
    .whenReady()
    .then(setup)
    .catch((error) => {
      dialog.showErrorBox("رویش", String(error));
      app.exit(1);
    });
}
