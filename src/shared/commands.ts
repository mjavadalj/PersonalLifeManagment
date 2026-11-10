import { z } from "zod";
import type { AppState, Command } from "./types";
import { validDay } from "./date";
import { activeGoal, primaryLedger } from "./logic";
import { defaultSchedule } from "../data/schedule";
const date = z.string().refine(validDay, "تاریخ معتبر نیست.");
const settings = z
  .object({
    reminderEnabled: z.boolean(),
    reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    motivation: z.boolean(),
    widgetEnabled: z.boolean(),
    widgetPhoto: z.boolean(),
    widgetCompact: z.boolean(),
    widgetMode: z.enum(["card", "lamp"]),
    mediaFit: z.enum(["contain", "cover"]),
    mediaPosition: z.number().min(0).max(100),
    mediaFrame: z.enum(["auto", "portrait", "landscape"]),
    selectedMedia: z.string(),
    launchAtLogin: z.boolean(),
  })
  .partial()
  .strict();
export const routineSchema = z
  .array(z.array(z.string().trim().max(120)).length(36))
  .length(7);
export const routineLinksSchema = z
  .array(z.array(z.string().nullable()).length(36))
  .length(7);
export const commandSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("addHabit"),
      name: z.string().trim().min(1).max(70),
      start: date,
    })
    .strict(),
  z
    .object({
      type: z.literal("renameHabit"),
      id: z.string(),
      name: z.string().trim().min(1).max(70),
    })
    .strict(),
  z.object({ type: z.literal("removeHabit"), id: z.string() }).strict(),
  z.object({ type: z.literal("primaryHabit"), id: z.string() }).strict(),
  z
    .object({
      type: z.literal("routineTask"),
      habitId: z.string().optional(),
      originalDay: z.number().int().min(0).max(6).optional(),
      originalStart: z.number().int().min(0).max(35).optional(),
      originalEnd: z.number().int().min(1).max(36).optional(),
      day: z.number().int().min(0).max(6),
      start: z.number().int().min(0).max(35),
      end: z.number().int().min(1).max(36),
      name: z.string().trim().max(70),
      daily: z.boolean(),
      habit: z.boolean(),
    })
    .strict(),
  z
    .object({
      type: z.literal("goal"),
      name: z.string().trim().min(1).max(70),
      start: date,
      archive: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("entry"),
      goalId: z.string().optional(),
      date,
      status: z.enum(["success", "failure"]).nullable(),
      world: z.enum(["forest", "sky"]).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("growth"),
      date,
      world: z.enum(["forest", "sky"]),
    })
    .strict(),
  z.object({ type: z.literal("routine"), days: routineSchema }).strict(),
  z.object({ type: z.literal("settings"), patch: settings }).strict(),
  z.object({ type: z.literal("removeMedia"), id: z.string() }).strict(),
]);
export function applyCommand(
  state: AppState,
  input: Command,
  today: string,
  id: () => string,
) {
  const cmd = commandSchema.parse(input);
  const preserveGrowth = () => {
    state.growthHistory ??= [];
    for (const e of state.entries)
      if (e.world) {
        if (
          !state.growthHistory.some(
            (old) => old.goalId === e.goalId && old.date === e.date,
          )
        )
          state.growthHistory.push({ ...e });
        delete e.world;
      }
  };
  if (cmd.type === "routine") {
    state.routine = cmd.days;
    return;
  }
  if (cmd.type === "routineTask") {
    if (cmd.end <= cmd.start) throw Error("پایان باید بعد از شروع باشد.");
    if (cmd.habit && !cmd.name) throw Error("برای هبیت یک نام وارد کن.");
    const days = structuredClone(state.routine ?? defaultSchedule);
    const links = structuredClone(
      state.routineLinks ??
        Array.from({ length: 7 }, () => Array(36).fill(null)),
    );
    let linked =
      cmd.habitId ??
      links[cmd.originalDay ?? cmd.day][cmd.originalStart ?? cmd.start];
    let habit = state.goals.find((g) => g.id === linked && !g.archivedAt);
    if (cmd.habit) {
      if (!habit)
        habit = state.goals.find((g) => !g.archivedAt && g.name === cmd.name);
      if (!habit) {
        habit = { id: id(), name: cmd.name, start: today };
        state.goals.push(habit);
      }
      linked = habit.id;
      if (!state.activeGoalId) {
        state.activeGoalId = habit.id;
        state.primarySince = today;
      }
    } else linked = null;
    if (cmd.originalStart !== undefined && cmd.originalEnd !== undefined) {
      if (cmd.originalEnd <= cmd.originalStart)
        throw Error("بازهٔ قبلی معتبر نیست.");
      const oldName = days[cmd.originalDay ?? cmd.day][cmd.originalStart];
      for (const d of cmd.daily
        ? [0, 1, 2, 3, 4, 5, 6]
        : [cmd.originalDay ?? cmd.day])
        for (let i = cmd.originalStart; i < cmd.originalEnd; i++)
          if (days[d][i] === oldName) {
            days[d][i] = "";
            links[d][i] = null;
          }
    }
    for (const d of cmd.daily ? [0, 1, 2, 3, 4, 5, 6] : [cmd.day]) {
      days[d].fill(cmd.name, cmd.start, cmd.end);
      links[d].fill(linked, cmd.start, cmd.end);
    }
    state.routine = days;
    state.routineLinks = links;
    return;
  }
  if (cmd.type === "addHabit") {
    if (cmd.start > today || cmd.start < "2000-01-01")
      throw Error("تاریخ شروع معتبر نیست.");
    const next = { id: id(), name: cmd.name, start: cmd.start };
    state.goals.push(next);
    if (!state.activeGoalId) {
      state.activeGoalId = next.id;
    }
    return;
  }
  if (
    cmd.type === "primaryHabit" ||
    cmd.type === "renameHabit" ||
    cmd.type === "removeHabit"
  ) {
    const target = state.goals.find((g) => g.id === cmd.id && !g.archivedAt);
    if (!target) throw Error("هبیت پیدا نشد.");
    if (cmd.type === "renameHabit") {
      target.name = cmd.name;
      return;
    }
    if (cmd.type === "primaryHabit") {
      if (state.activeGoalId !== target.id) {
        preserveGrowth();
        state.activeGoalId = target.id;
        state.primarySince = today;
      }
      return;
    }
    if (target.id === state.activeGoalId)
      throw Error("اول یک هبیت دیگر را اصلی کن؛ سپس این هبیت را آرشیو کن.");
    target.archivedAt = today;
    if (state.routineLinks)
      state.routineLinks = state.routineLinks.map((d) =>
        d.map((link) => (link === target.id ? null : link)),
      );
    return;
  }
  const goal =
    cmd.type === "entry" && cmd.goalId
      ? state.goals.find((g) => g.id === cmd.goalId && !g.archivedAt)
      : activeGoal(state);
  if (cmd.type === "goal") {
    if (cmd.start > today || cmd.start < "2000-01-01")
      throw Error("تاریخ شروع باید بین سال ۲۰۰۰ میلادی و امروز باشد.");
    if (goal && !cmd.archive) {
      if (state.entries.some((e) => e.goalId === goal.id && e.date < cmd.start))
        throw Error("تاریخ شروع نمی‌تواند بعد از روزهای ثبت‌شده باشد.");
      goal.name = cmd.name;
      goal.start = cmd.start;
      return;
    }
    if (goal) {
      goal.archivedAt = today;
      state.primarySince = today;
    }
    const next = { id: id(), name: cmd.name, start: cmd.start };
    state.goals.push(next);
    state.activeGoalId = next.id;
    return;
  }
  if (cmd.type === "settings") {
    if (
      cmd.patch.selectedMedia &&
      !state.media.some((m) => m.id === cmd.patch.selectedMedia)
    )
      throw Error("فایل پیدا نشد.");
    Object.assign(state.settings, cmd.patch);
    return;
  }
  if (cmd.type === "removeMedia") {
    state.media = state.media.filter((m) => m.id !== cmd.id);
    if (state.settings.selectedMedia === cmd.id)
      state.settings.selectedMedia = state.media[0]?.id;
    return;
  }
  if (!goal || cmd.date < goal.start || cmd.date > today)
    throw Error("این روز قابل ثبت نیست.");
  const index = state.entries.findIndex(
    (e) => e.goalId === goal.id && e.date === cmd.date,
  );
  if (cmd.type === "entry") {
    if (cmd.status === null) {
      if (index >= 0) state.entries.splice(index, 1);
    } else if (index >= 0) {
      const old = state.entries[index];
      state.entries[index] = {
        goalId: goal.id,
        date: cmd.date,
        status: cmd.status,
        world:
          cmd.status === "success" && old.status === "success"
            ? old.world
            : undefined,
      };
    } else
      state.entries.push({
        goalId: goal.id,
        date: cmd.date,
        status: cmd.status,
      });
    // Historical corrections invalidate only growth that no longer has an eligible successful day.
    if (goal.id !== state.activeGoalId) return;
    const ledger = primaryLedger(state, today)!;
    for (const e of state.entries)
      if (
        e.goalId === goal.id &&
        (!state.primarySince || e.date >= state.primarySince) &&
        !ledger.eligible.has(e.date)
      )
        delete e.world;
  } else {
    const e = state.entries[index];
    if (
      !e ||
      e.status !== "success" ||
      !primaryLedger(state, today)?.eligible.has(cmd.date)
    )
      throw Error("رشد برای این روز هنوز آزاد نیست.");
    if (e.world) throw Error("رشد این روز قبلاً انتخاب شده است.");
    e.world = cmd.world;
  }
}
