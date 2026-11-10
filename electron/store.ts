import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { AppState } from "../src/shared/types";
import { initialState } from "../src/shared/logic";
import { validDay } from "../src/shared/date";
import { routineSchema, routineLinksSchema } from "../src/shared/commands";
const day = z.string().refine(validDay);
const schema = z.object({
  version: z.literal(1),
  routine: routineSchema.optional(),
  activeGoalId: z.string().optional(),
  primarySince: day.optional(),
  growthHistory: z
    .array(
      z.object({
        goalId: z.string(),
        date: day,
        status: z.enum(["success", "failure"]),
        world: z.enum(["forest", "sky"]).optional(),
      }),
    )
    .optional(),
  routineLinks: routineLinksSchema.optional(),
  goals: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      start: day,
      archivedAt: day.optional(),
    }),
  ),
  entries: z.array(
    z.object({
      goalId: z.string(),
      date: day,
      status: z.enum(["success", "failure"]),
      world: z.enum(["forest", "sky"]).optional(),
    }),
  ),
  media: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      extension: z.enum([".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm"]),
      kind: z.enum(["image", "video"]),
    }),
  ),
  settings: z.object({
    reminderEnabled: z.boolean(),
    reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    motivation: z.boolean(),
    widgetEnabled: z.boolean(),
    widgetPhoto: z.boolean(),
    widgetCompact: z.boolean().optional(),
    widgetMode: z.enum(["card", "lamp"]),
    mediaFit: z.enum(["contain", "cover"]),
    mediaPosition: z.number().min(0).max(100),
    mediaFrame: z.enum(["auto", "portrait", "landscape"]),
    selectedMedia: z.string().optional(),
    launchAtLogin: z.boolean(),
    widgetBounds: z.object({ x: z.number(), y: z.number() }).optional(),
    lastReminder: day.optional(),
  }),
  quotes: z.object({
    version: z.number(),
    remaining: z.array(z.string()),
    byDate: z.record(z.string()),
    last: z.string().optional(),
  }),
});
export class Store {
  state: AppState = initialState();
  warning?: string;
  private queue: Promise<unknown> = Promise.resolve();
  constructor(public directory: string) {}
  get file() {
    return path.join(this.directory, "state.json");
  }
  async load() {
    await fs.mkdir(this.directory, { recursive: true });
    try {
      this.state = schema.parse(
        JSON.parse(await fs.readFile(this.file, "utf8")),
      );
    } catch (error) {
      const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
      try {
        this.state = schema.parse(
          JSON.parse(await fs.readFile(this.file + ".bak", "utf8")),
        );
        if (!missing)
          await fs.rename(this.file, this.file + `.damaged-${Date.now()}`);
        this.warning = "داده‌ها از آخرین نسخهٔ سالم بازیابی شدند.";
      } catch (backupError) {
        if (missing && (backupError as NodeJS.ErrnoException).code === "ENOENT")
          return;
        throw Error(
          "فایل اطلاعات خوانده نشد. برای حفظ اطلاعات، برنامه چیزی را بازنویسی نکرد. پوشهٔ داده را بررسی کنید.",
        );
      }
    }
  }
  async transaction<T>(
    change: (draft: AppState) => T | Promise<T>,
  ): Promise<T> {
    const job = this.queue.then(async () => {
      const draft = structuredClone(this.state);
      const result = await change(draft);
      schema.parse(draft);
      const temporary = this.file + ".tmp";
      const handle = await fs.open(temporary, "w");
      try {
        await handle.writeFile(JSON.stringify(draft, null, 2), "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
      try {
        await fs.copyFile(this.file, this.file + ".bak");
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      }
      await fs.rename(temporary, this.file);
      this.state = draft;
      return result;
    });
    this.queue = job.catch(() => {});
    return job;
  }
}
