import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { createServer } from "vite";
const server = await createServer({
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
await server.listen();
await mkdir(".impeccable/review", { recursive: true });
await build({
  entryPoints: ["src/shared/logic.ts"],
  outfile: "tmp/logic.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { initialState } = await import("../tmp/logic.mjs");
const now = new Date(),
  today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const day = (n) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({
  viewport: { width: 820, height: 570 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://127.0.0.1:5173");
await page.getByRole("button", { name: "شروع مسیر", exact: true }).click();
await page.getByRole("button", { name: "ثبت امروز", exact: true }).click();
await page.getByRole("heading", { name: "امروز، کدام دنیا؟" }).waitFor();
await page.getByRole("button", { name: "جنگلم یک درخت تازه" }).click();
await page.getByRole("heading", { name: "دنیای کوچک تو" }).waitFor();
let stored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("roy-preview")),
);
assert.equal(stored.entries.length, 1);
assert.equal(stored.entries[0].world, "forest");
await page.reload();
await page.getByRole("button", { name: "امروز ثبت شد" }).waitFor();
const fixture = initialState();
fixture.goals = [{ id: "visual", name: "هر روز، یک قدم", start: day(-39) }];
fixture.activeGoalId = "visual";
for (let i = -39; i < 0; i++)
  fixture.entries.push({
    goalId: "visual",
    date: day(i),
    status: "success",
    world: i % 3 === 0 ? "sky" : "forest",
  });
fixture.quotes.byDate[today] = "virgil-gates";
fixture.quotes.last = "virgil-gates";
fixture.quotes.remaining = ["epictetus-1"];
await page.evaluate(
  (s) => localStorage.setItem("roy-preview", JSON.stringify(s)),
  fixture,
);
await page.reload();
await page.getByRole("heading", { name: "هر روز، یک قدم" }).waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: ".impeccable/review/desktop.png",
  fullPage: true,
});
await page.setViewportSize({ width: 630, height: 490 });
await page.screenshot({
  path: ".impeccable/review/desktop-small.png",
  fullPage: true,
});
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
);
await page.setViewportSize({ width: 820, height: 570 });
await page.getByRole("button", { name: "دنیای من", exact: true }).click();
await page.screenshot({
  path: ".impeccable/review/forest.png",
  animations: "disabled",
  fullPage: true,
});
await page.getByRole("button", { name: /آسمانم/ }).click();
await page.screenshot({
  path: ".impeccable/review/sky.png",
  animations: "disabled",
  fullPage: true,
});
await page.goto("http://127.0.0.1:5173/?widget=1");
await page.setViewportSize({ width: 280, height: 420 });
await page.locator(".widget-count").waitFor();
await page
  .locator(".widget-shell")
  .screenshot({ path: ".impeccable/review/widget.png" });
await page.getByRole("button", { name: "جملهٔ امروز", exact: true }).click();
await page.locator(".widget-shell").screenshot({
  path: ".impeccable/review/widget-quote.png",
});
await page.getByRole("button", { name: "بستن جمله", exact: true }).click();
await page.getByRole("button", { name: "تغییر حالت چراغ" }).click();
await page.getByRole("button", { name: "ثبت امروز", exact: true }).click();
await page.getByRole("button", { name: "آسمان", exact: true }).click();
await page.locator(".widget-shell").screenshot({
  path: ".impeccable/review/widget-lamp.png",
  animations: "disabled",
});
assert.equal(
  await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("roy-preview")).entries.filter(
        (e) => e.date === new Date().toLocaleDateString("en-CA"),
      ).length,
  ),
  1,
);
const large = await browser.newContext({
  viewport: { width: 630, height: 490 },
  deviceScaleFactor: 1.5,
  reducedMotion: "reduce",
});
const largePage = await large.newPage();
await largePage.goto("http://127.0.0.1:5173");
await largePage.evaluate(
  (s) => localStorage.setItem("roy-preview", JSON.stringify(s)),
  fixture,
);
await largePage.reload();
await largePage.getByRole("heading", { name: "هر روز، یک قدم" }).waitFor();
await largePage.screenshot({
  path: ".impeccable/review/desktop-150.png",
  fullPage: true,
});
assert.deepEqual(errors, []);
await writeFile(
  "tmp/browser-check.json",
  JSON.stringify(
    {
      passed: true,
      errors,
      checks: [
        "onboarding",
        "success",
        "growth selection",
        "persistence",
        "compact layout",
        "forest",
        "sky",
        "widget quote",
        "lamp",
        "150% reduced motion",
      ],
    },
    null,
    2,
  ),
);
await browser.close();
await server.close();
console.log("Browser interaction and screenshot checks passed.");
