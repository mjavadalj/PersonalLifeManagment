import { describe, it, expect } from "vitest";
import { initialState, primaryLedger } from "../src/shared/logic";
import { applyCommand } from "../src/shared/commands";
import { Store } from "../electron/store";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
const today = "2026-10-05";
let next = 0;
const id = () => String(++next);
function fixture() {
  const s = initialState();
  applyCommand(
    s,
    { type: "addHabit", name: "اصلی", start: "2026-10-01" },
    today,
    id,
  );
  applyCommand(
    s,
    { type: "addHabit", name: "پیانو", start: "2026-10-01" },
    today,
    id,
  );
  return s;
}
describe("independent habits and preserved worlds", () => {
  it("records secondary habits separately and forbids their growth", () => {
    const s = fixture(),
      secondary = s.goals[1].id;
    applyCommand(
      s,
      { type: "entry", goalId: secondary, date: today, status: "success" },
      today,
      id,
    );
    expect(s.entries[0].goalId).toBe(secondary);
    expect(primaryLedger(s, today)?.eligible.has(today)).toBe(false);
    expect(() =>
      applyCommand(s, { type: "growth", date: today, world: "sky" }, today, id),
    ).toThrow();
  });
  it("switches primary from today without retroactive growth or losing the previous world", () => {
    const s = fixture(),
      old = s.activeGoalId!,
      newId = s.goals[1].id;
    for (const date of ["2026-10-01", "2026-10-02"]) {
      applyCommand(
        s,
        { type: "entry", goalId: old, date, status: "success" },
        today,
        id,
      );
      applyCommand(s, { type: "growth", date, world: "forest" }, today, id);
    }
    applyCommand(
      s,
      { type: "entry", goalId: newId, date: "2026-10-04", status: "success" },
      today,
      id,
    );
    applyCommand(s, { type: "primaryHabit", id: newId }, today, id);
    expect(s.growthHistory).toHaveLength(2);
    expect(primaryLedger(s, today)?.eligible.has("2026-10-04")).toBe(false);
    applyCommand(
      s,
      { type: "entry", goalId: old, date: "2026-10-01", status: null },
      today,
      id,
    );
    expect(s.growthHistory?.[0].world).toBe("forest");
    applyCommand(
      s,
      { type: "entry", goalId: newId, date: today, status: "success" },
      today,
      id,
    );
    expect(primaryLedger(s, today)?.eligible.has(today)).toBe(true);
  });
  it("prevents double growth on the same day when primary changes", () => {
    const s = fixture();
    applyCommand(
      s,
      { type: "entry", date: "2026-10-01", status: "success" },
      today,
      id,
    );
    applyCommand(
      s,
      { type: "growth", date: "2026-10-01", world: "sky" },
      today,
      id,
    );
    applyCommand(
      s,
      { type: "primaryHabit", id: s.goals[1].id },
      "2026-10-01",
      id,
    );
    applyCommand(
      s,
      { type: "entry", date: "2026-10-01", status: "success" },
      today,
      id,
    );
    expect(primaryLedger(s, today)?.eligible.has("2026-10-01")).toBe(false);
  });
  it("daily routine link creates one habit, reuses it and unlinking retains its history", () => {
    const s = fixture();
    const task = {
      type: "routineTask" as const,
      day: 0,
      start: 4,
      end: 6,
      name: "ورزش",
      daily: true,
      habit: true,
    };
    applyCommand(s, task, today, id);
    expect(s.goals).toHaveLength(3);
    const link = s.routineLinks![0][4];
    expect(s.routine!.every((d) => d[4] === "ورزش" && d[5] === "ورزش")).toBe(
      true,
    );
    expect(s.routineLinks!.every((d) => d[4] === link)).toBe(true);
    applyCommand(s, task, today, id);
    expect(s.goals).toHaveLength(3);
    applyCommand(s, { ...task, habit: false, daily: false }, today, id);
    expect(s.routineLinks![0][4]).toBe(null);
    expect(s.routineLinks![1][4]).toBe(link);
    expect(s.goals).toHaveLength(3);
  });
  it("moving an interval clears its old slots, retains the linked habit and leaves other days intact", () => {
    const s = fixture();
    applyCommand(
      s,
      {
        type: "routineTask",
        day: 0,
        start: 4,
        end: 6,
        name: "تمرین",
        daily: false,
        habit: true,
      },
      today,
      id,
    );
    const habitId = s.routineLinks![0][4]!;
    applyCommand(
      s,
      {
        type: "routineTask",
        day: 0,
        start: 8,
        end: 10,
        originalStart: 4,
        originalEnd: 6,
        habitId,
        name: "تمرین جدید",
        daily: false,
        habit: true,
      },
      today,
      id,
    );
    expect(s.routine![0][4]).toBe("");
    expect(s.routine![0][8]).toBe("تمرین جدید");
    expect(s.routineLinks![0][8]).toBe(habitId);
    expect(s.goals).toHaveLength(3);
  });
  it("archives secondary habits and removes their links without deleting history", () => {
    const s = fixture();
    const secondary = s.goals[1];
    applyCommand(
      s,
      {
        type: "routineTask",
        day: 0,
        start: 4,
        end: 6,
        name: secondary.name,
        daily: true,
        habit: true,
      },
      today,
      id,
    );
    applyCommand(
      s,
      { type: "entry", goalId: secondary.id, date: today, status: "success" },
      today,
      id,
    );
    expect(() =>
      applyCommand(s, { type: "removeHabit", id: s.activeGoalId! }, today, id),
    ).toThrow();
    applyCommand(s, { type: "removeHabit", id: secondary.id }, today, id);
    expect(s.entries).toHaveLength(1);
    expect(s.routineLinks![0][4]).toBe(null);
    expect(secondary.archivedAt).toBe(today);
  });
  it("persists linked habits and growth history and reads legacy stores", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "roy-habits-"));
    try {
      const old = fixture();
      await fs.writeFile(path.join(dir, "state.json"), JSON.stringify(old));
      const store = new Store(dir);
      await store.load();
      await store.transaction((s) => {
        applyCommand(
          s,
          {
            type: "routineTask",
            day: 0,
            start: 4,
            end: 6,
            name: "تمرین",
            daily: true,
            habit: true,
          },
          today,
          id,
        );
        applyCommand(
          s,
          { type: "entry", date: "2026-10-01", status: "success" },
          today,
          id,
        );
        applyCommand(
          s,
          { type: "growth", date: "2026-10-01", world: "forest" },
          today,
          id,
        );
        applyCommand(s, { type: "primaryHabit", id: s.goals[1].id }, today, id);
      });
      const reopened = new Store(dir);
      await reopened.load();
      expect(reopened.state.routineLinks).toEqual(store.state.routineLinks);
      expect(reopened.state.growthHistory).toEqual(store.state.growthHistory);
      expect(reopened.state.primarySince).toBe(today);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
it("moving an edited task to another day clears its source only, preserving unrelated destination hours", () => {
  const s = fixture();
  applyCommand(
    s,
    {
      type: "routineTask",
      day: 0,
      start: 4,
      end: 6,
      name: "کار مبدا",
      daily: false,
      habit: true,
    },
    today,
    id,
  );
  applyCommand(
    s,
    {
      type: "routineTask",
      day: 1,
      start: 4,
      end: 6,
      name: "کار دیگر",
      daily: false,
      habit: false,
    },
    today,
    id,
  );
  const habitId = s.routineLinks![0][4]!;
  applyCommand(
    s,
    {
      type: "routineTask",
      day: 1,
      start: 8,
      end: 10,
      originalDay: 0,
      originalStart: 4,
      originalEnd: 6,
      habitId,
      name: "کار مبدا",
      daily: false,
      habit: true,
    },
    today,
    id,
  );
  expect(s.routine![0][4]).toBe("");
  expect(s.routine![1][4]).toBe("کار دیگر");
  expect(s.routine![1][8]).toBe("کار مبدا");
  expect(s.routineLinks![1][8]).toBe(habitId);
});
