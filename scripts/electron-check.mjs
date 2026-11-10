import { _electron as electron, chromium } from "@playwright/test";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const directory = path.resolve("tmp/native-test-" + Date.now());
await mkdir(directory, { recursive: true });
await mkdir(".impeccable/review", { recursive: true });
const env = { ...process.env, ROYESH_DATA_DIR: directory };
delete env.ELECTRON_RUN_AS_NODE;
delete env.ROYESH_DEV_URL;
const executable = process.env.ROYESH_TEST_EXE || require("electron");
let app = await electron.launch({
  executablePath: executable,
  args: process.env.ROYESH_TEST_EXE ? [] : ["."],
  env,
  timeout: 60000,
});
const errors = [];
app.process().stderr.on("data", (data) => process.stderr.write(data));
const main = await app.firstWindow();
main.on("console", (message) => console.log("Renderer:", message.text()));
main.on("requestfailed", (request) =>
  console.log("Request failed:", request.url(), request.failure()),
);
main.on("pageerror", (e) => errors.push(String(e)));
try {
  await main.getByRole("button", { name: "شروع مسیر" }).waitFor();
} catch (error) {
  console.log(await main.content());
  await main.screenshot({ path: "tmp/native-startup.png" });
  await app.close();
  throw error;
}
await main.getByRole("button", { name: "شروع مسیر" }).click();
await main.evaluate(() =>
  window.roy.dispatch({ type: "settings", patch: { reminderEnabled: false } }),
);
await main.getByRole("button", { name: "ثبت امروز", exact: true }).click();
await main.getByRole("heading", { name: "امروز، کدام دنیا؟" }).waitFor();
await main.getByRole("button", { name: "جنگلم یک درخت تازه" }).click();
await main.getByRole("heading", { name: "دنیای کوچک تو" }).waitFor();
const saved = await main.evaluate(() => window.roy.read());
assert.equal(saved.state.entries[0].world, "forest");
await main.evaluate(() =>
  window.roy.dispatch({ type: "settings", patch: { widgetEnabled: true } }),
);
await new Promise((r) => setTimeout(r, 600));
const widget = app.windows().find((w) => w !== main);
assert(widget, "Widget should open");
await widget.getByRole("button", { name: "امروز ثبت شد" }).waitFor();
const native = await app.evaluate(({ BrowserWindow }) =>
  BrowserWindow.getAllWindows().map((w) => ({
    title: w.getTitle(),
    top: w.isAlwaysOnTop(),
    bounds: w.getBounds(),
    prefs: {
      sandbox: w.webContents.getLastWebPreferences().sandbox,
      node: w.webContents.getLastWebPreferences().nodeIntegration,
      isolation: w.webContents.getLastWebPreferences().contextIsolation,
    },
  })),
);
assert(native.some((w) => w.top));
assert(
  native.every((w) => w.prefs.sandbox && !w.prefs.node && w.prefs.isolation),
);
assert.equal(await main.evaluate(() => typeof window.require), "undefined");
assert.equal(
  await main.evaluate(async () => {
    try {
      await fetch("https://example.com");
      return true;
    } catch {
      return false;
    }
  }),
  false,
);
await main.getByRole("button", { name: "امروز", exact: true }).click();
await main.screenshot({ path: ".impeccable/review/native-main.png" });
await widget.screenshot({ path: ".impeccable/review/native-widget.png" });
await widget.getByRole("button", { name: "جملهٔ امروز", exact: true }).click();
await new Promise((r) => setTimeout(r, 250));
await widget.screenshot({ path: ".impeccable/review/native-widget-quote.png" });
// Dialog selection uses the actual import path/copy/protocol; only the OS file-picker is supplied by the test.
const fixturePath = path.join(directory, "portrait-original.png");
const png = await app.evaluate(({ nativeImage }) => {
  const width = 160,
    height = 250,
    pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      pixels[i] = 100 + Math.round(y / 4);
      pixels[i + 1] = 145;
      pixels[i + 2] = 120;
      pixels[i + 3] = 255;
    }
  return nativeImage
    .createFromBitmap(pixels, { width, height })
    .toPNG()
    .toString("base64");
});
await writeFile(fixturePath, Buffer.from(png, "base64"));
await app.evaluate(({ dialog }, file) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] });
}, fixturePath);
await main.evaluate(() => window.roy.importMedia());
await main.evaluate(() =>
  window.roy.dispatch({
    type: "settings",
    patch: { motivation: true, widgetPhoto: true },
  }),
);
await main.getByRole("button", { name: "انگیزه", exact: true }).click();
await main.locator(".media-frame img").waitFor();
await main.waitForFunction(
  () => document.querySelector(".media-frame img")?.naturalWidth > 0,
);
await widget.waitForFunction(
  () => document.querySelector(".media-frame img")?.naturalWidth > 0,
);
assert.equal(
  await main
    .locator(".media-frame img")
    .evaluate((img) => img.naturalWidth / img.naturalHeight),
  0.64,
);
await main.screenshot({ path: ".impeccable/review/native-media-portrait.png" });
await widget.getByRole("button", { name: "بستن جمله", exact: true }).click();
await widget.locator(".collapse-quote").waitFor({ state: "hidden" });
await new Promise((r) => setTimeout(r, 500));
assert(
  await widget.evaluate(
    () =>
      Math.abs(
        innerHeight - document.querySelector(".widget-shell").scrollHeight,
      ) < 3,
  ),
  "Widget shrinks after quote closes",
);
await widget.screenshot({ path: ".impeccable/review/native-widget-photo.png" });
// Generate a tiny local video fixture to check actual WebM playback and hide/pause behavior.
const browser = await chromium.launch({ channel: "msedge", headless: true });
const fixturePage = await browser.newPage();
const webm = await fixturePage.evaluate(async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 240;
  canvas.height = 140;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#84946d";
  ctx.fillRect(0, 0, 240, 140);
  const stream = canvas.captureStream(15);
  const chunks = [];
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  const done = new Promise((resolve) => {
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () =>
      resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));
  });
  recorder.start();
  let n = 0;
  const timer = setInterval(() => {
    ctx.fillStyle = n++ % 2 ? "#84946d" : "#9cac85";
    ctx.fillRect(0, 0, 240, 140);
  }, 100);
  await new Promise((r) => setTimeout(r, 1800));
  clearInterval(timer);
  recorder.stop();
  return done;
});
await browser.close();
const videoPath = path.join(directory, "sample.webm");
await writeFile(videoPath, Buffer.from(webm));
await app.evaluate(({ dialog }, file) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] });
}, videoPath);
const imported = await main.evaluate(() => window.roy.importMedia());
const vid = imported.state.media.find((m) => m.kind === "video");
await main.evaluate(
  (id) =>
    window.roy.dispatch({ type: "settings", patch: { selectedMedia: id } }),
  vid.id,
);
await main.locator("video").waitFor();
await main.locator("video").evaluate((video) => video.play());
await app.evaluate(({ BrowserWindow }) =>
  BrowserWindow.getAllWindows()
    .find((w) => !w.isAlwaysOnTop())
    .hide(),
);
await main.waitForFunction(() => document.querySelector("video").paused);
assert.equal(await widget.locator("video").count(), 0);
await app.evaluate(({ BrowserWindow }) =>
  BrowserWindow.getAllWindows()
    .find((w) => !w.isAlwaysOnTop())
    .show(),
);
await main.evaluate(() =>
  window.roy.dispatch({ type: "settings", patch: { motivation: false } }),
);
assert.equal(await main.locator("video").count(), 0);
assert.equal(await widget.locator("img").count(), 0);
const mediaState = await main.evaluate(() => window.roy.read());
for (const m of mediaState.state.media)
  await main.evaluate(
    (id) => window.roy.dispatch({ type: "removeMedia", id }),
    m.id,
  );
assert((await readFile(fixturePath)).length > 0, "Original photo preserved");
await widget.getByRole("button", { name: "تغییر حالت چراغ" }).click();
await widget.locator(".desk-lamp").waitFor();
await new Promise((r) => setTimeout(r, 500));
await widget.screenshot({ path: ".impeccable/review/native-lamp.png" });
await app.evaluate(({ BrowserWindow, screen }) => {
  const w = BrowserWindow.getAllWindows().find((w) => w.isAlwaysOnTop());
  w.setPosition(-20000, -20000);
  screen.emit("display-metrics-changed");
});
assert(
  await app.evaluate(({ BrowserWindow, screen }) => {
    const b = BrowserWindow.getAllWindows()
      .find((w) => w.isAlwaysOnTop())
      .getBounds();
    return screen
      .getAllDisplays()
      .some((d) => b.x >= d.workArea.x && b.y >= d.workArea.y);
  }),
);
await main.getByRole("button", { name: "بستن پنجره", exact: true }).click();
assert.equal(
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()
      .find((w) => !w.isAlwaysOnTop())
      .isVisible(),
  ),
  false,
);
assert.equal(
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()
      .find((w) => w.isAlwaysOnTop())
      .isVisible(),
  ),
  true,
);
await app.close();
app = await electron.launch({
  executablePath: executable,
  args: process.env.ROYESH_TEST_EXE ? [] : ["."],
  env,
  timeout: 60000,
});
const reopened = await app.firstWindow();
await reopened.getByRole("button", { name: "امروز ثبت شد" }).waitFor();
const after = await reopened.evaluate(() => window.roy.read());
assert.equal(after.state.entries[0].world, "forest");
assert.equal(after.quote.id, saved.quote.id);
await app.close();
assert.deepEqual(errors, []);
await writeFile(
  "tmp/electron-check.json",
  JSON.stringify(
    {
      passed: true,
      directory,
      executable,
      checks: [
        "onboarding",
        "daily growth",
        "window synchronization",
        "sandbox and external network blocking",
        "daily quote persistence",
        "portrait import and private protocol",
        "video playback and hide/pause",
        "original file preserved",
        "widget always-on-top",
        "offscreen repositioning",
        "close to tray",
        "relaunch persistence",
      ],
      errors,
    },
    null,
    2,
  ),
);
console.log("Native Electron integration checks passed.");
