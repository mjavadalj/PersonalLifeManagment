import { _electron as electron, chromium } from "@playwright/test";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const directory = path.resolve("tmp/native-edge-" + Date.now());
await mkdir(directory, { recursive: true });
const env = { ...process.env, ROYESH_DATA_DIR: directory };
delete env.ELECTRON_RUN_AS_NODE;
delete env.ROYESH_DEV_URL;
const app = await electron.launch({
  executablePath: process.env.ROYESH_TEST_EXE || require("electron"),
  args: process.env.ROYESH_TEST_EXE ? [] : ["."],
  env,
});
try {
  const page = await app.firstWindow();
  await page.getByRole("button", { name: "شروع مسیر" }).click();
  await page.getByRole("button", { name: "ثبت امروز", exact: true }).waitFor();
  await page.evaluate(() =>
    window.roy.dispatch({
      type: "settings",
      patch: { reminderEnabled: false, motivation: true, widgetEnabled: true },
    }),
  );
  await page.getByRole("button", { name: "انگیزه", exact: true }).click();
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const fixture = await browser.newPage();
  const images = await fixture.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 260;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#657349";
    ctx.fillRect(0, 0, 260, 120);
    return {
      webp: canvas.toDataURL("image/webp").split(",")[1],
      jpg: canvas.toDataURL("image/jpeg").split(",")[1],
    };
  });
  await browser.close();
  const select = async (file) =>
    app.evaluate(({ dialog }, file) => {
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [file],
      });
    }, file);
  for (const extension of ["webp", "jpg"]) {
    const file = path.join(directory, "landscape." + extension);
    await writeFile(file, Buffer.from(images[extension], "base64"));
    await select(file);
    const snapshot = await page.evaluate(() => window.roy.importMedia());
    const item = snapshot.state.media.at(-1);
    await page.evaluate(
      (id) =>
        window.roy.dispatch({ type: "settings", patch: { selectedMedia: id } }),
      item.id,
    );
    await page.waitForFunction(
      () => document.querySelector(".media-frame img")?.naturalWidth === 260,
    );
    assert.equal(
      await page
        .locator(".media-frame img")
        .evaluate((img) => img.naturalHeight),
      120,
    );
  }
  const bad = path.join(directory, "broken.png");
  await writeFile(bad, "invalid image");
  await select(bad);
  assert(
    await page.evaluate(async () => {
      try {
        await window.roy.importMedia();
        return false;
      } catch {
        return true;
      }
    }),
  );
  const badVideo = path.join(directory, "broken.mp4");
  await writeFile(badVideo, "invalid video");
  await select(badVideo);
  const invalid = await page.evaluate(() => window.roy.importMedia());
  await page.evaluate(
    (id) =>
      window.roy.dispatch({ type: "settings", patch: { selectedMedia: id } }),
    invalid.state.media.at(-1).id,
  );
  await page
    .getByRole("alert")
    .filter({ hasText: "این فایل پخش نمی‌شود" })
    .waitFor();
  const first = invalid.state.media[0];
  await unlink(path.join(directory, "media", first.id + first.extension));
  await page.evaluate(
    (id) =>
      window.roy.dispatch({ type: "settings", patch: { selectedMedia: id } }),
    first.id,
  );
  await page
    .getByRole("alert")
    .filter({ hasText: "این فایل پخش نمی‌شود" })
    .waitFor();
  // Advance only this isolated Electron process, never the system clock.
  // Capture Notification.show to verify dispatch without sending test alerts.
  const original = await page.evaluate(() => window.roy.read());
  const next = new Date(original.today + "T12:00:00");
  next.setDate(next.getDate() + 1);
  const nextDay = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
  await app.evaluate(({ Notification }, timestamp) => {
    globalThis.royOriginalDate = Date;
    globalThis.royOriginalShow = Notification.prototype.show;
    globalThis.royOriginalSupport = Notification.isSupported;
    globalThis.royNotifications = [];
    const OriginalDate = Date;
    globalThis.Date = class extends OriginalDate {
      constructor(...args) {
        super(...(args.length ? args : [timestamp]));
      }
      static now() {
        return timestamp;
      }
    };
    Notification.isSupported = () => true;
    Notification.prototype.show = function () {
      globalThis.royNotifications.push({ title: this.title, body: this.body });
    };
  }, next.getTime());
  await page.evaluate(() =>
    window.roy.dispatch({
      type: "settings",
      patch: { reminderEnabled: true, reminderTime: "00:00" },
    }),
  );
  await app.evaluate(({ powerMonitor }) => powerMonitor.emit("resume"));
  await page.waitForFunction(
    async (expected) =>
      (await window.roy.read()).state.settings.lastReminder === expected,
    nextDay,
  );
  await app.evaluate(({ powerMonitor }) => powerMonitor.emit("resume"));
  await new Promise((r) => setTimeout(r, 100));
  const notices = await app.evaluate(() => globalThis.royNotifications);
  assert.deepEqual(notices, [{ title: "رویش", body: "وقت ثبت امروز است" }]);
  const nextSnapshot = await page.evaluate(() => window.roy.read());
  assert.equal(nextSnapshot.today, nextDay);
  assert.notEqual(nextSnapshot.quote.id, original.quote.id);
  const widget = app.windows().find((w) => w !== page);
  assert(widget);
  assert.equal(
    (await widget.evaluate(() => window.roy.read())).quote.id,
    nextSnapshot.quote.id,
  );
  await page.evaluate(() =>
    window.roy.dispatch({
      type: "settings",
      patch: { reminderEnabled: false },
    }),
  );
  await app.evaluate(({ Notification }) => {
    globalThis.Date = globalThis.royOriginalDate;
    Notification.prototype.show = globalThis.royOriginalShow;
    Notification.isSupported = globalThis.royOriginalSupport;
  });
  await writeFile(
    "tmp/native-edge-check.json",
    JSON.stringify(
      {
        passed: true,
        directory,
        checks: [
          "WebP and JPEG landscape import",
          "corrupt image rejection",
          "incompatible video message",
          "missing media message",
          "day rollover on resume",
          "one generic notification per day",
          "same quote in both windows",
        ],
      },
      null,
      2,
    ),
  );
  console.log("Native media and resume edge checks passed.");
} finally {
  await app.close();
}
