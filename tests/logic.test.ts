import { describe, it, expect } from "vitest";
import {
  addDays,
  fromPersian,
  persianParts,
  persianYearDays,
  validDay,
} from "../src/shared/date";
import {
  growthLedger,
  initialState,
  pickQuote,
  reminderDue,
  stats,
} from "../src/shared/logic";
import { applyCommand } from "../src/shared/commands";
import type {
  DailyEntry,
  Goal,
  QuoteDailySelection,
} from "../src/shared/types";
const goal: Goal = { id: "g", name: "test", start: "2026-01-01" };
const sequence = (pattern: string): DailyEntry[] =>
  [...pattern].flatMap((c, i) =>
    c === "_"
      ? []
      : [
          {
            goalId: "g",
            date: addDays(goal.start, i),
            status: c === "s" ? ("success" as const) : ("failure" as const),
          },
        ],
  );
const ledger = (pattern: string) =>
  growthLedger(
    sequence(pattern),
    goal,
    addDays(goal.start, pattern.length - 1),
  );
describe("growth contract", () => {
  it("starts growth immediately and does not punish an initial failure", () => {
    expect([...ledger("fss").eligible]).toEqual(["2026-01-02", "2026-01-03"]);
    expect(ledger("fss").breaks).toBe(0);
  });
  it("requires seven full successes and only grants growth on day eight", () => {
    const l = ledger("sfssssssss");
    expect(l.breaks).toBe(1);
    expect(l.inRecovery).toBe(false);
    expect([...l.eligible]).toEqual(["2026-01-01", "2026-01-10"]);
  });
  it("failure during recovery restarts seven, not fourteen", () => {
    const l = ledger("sfsssfssssssss");
    expect(l.required).toBe(7);
    expect(l.breaks).toBe(1);
    expect(l.eligible.has("2026-01-14")).toBe(true);
  });
  it("next post-recovery break requires fourteen, then twenty-one", () => {
    let p = "sf" + "s".repeat(8) + "f" + "s".repeat(15) + "f";
    expect(ledger(p).required).toBe(21);
    expect(ledger(p).breaks).toBe(3);
    expect(ledger(p + "s".repeat(21)).inRecovery).toBe(false);
    expect(
      ledger(p + "s".repeat(21)).eligible.has(
        addDays(goal.start, p.length + 20),
      ),
    ).toBe(false);
    expect(
      ledger(p + "s".repeat(22)).eligible.has(
        addDays(goal.start, p.length + 21),
      ),
    ).toBe(true);
  });
  it("unknown past days suspend without imposing new penalties", () => {
    const l = ledger("sfss_sssfss");
    expect(l.suspendedAt).toBe("2026-01-05");
    expect(l.recovery).toBe(2);
    expect(l.breaks).toBe(1);
  });
  it("recomputes eligibility after edits and prevents repeat world claims", () => {
    const s = initialState();
    s.goals = [goal];
    s.activeGoalId = "g";
    s.entries = sequence("sss");
    applyCommand(
      s,
      { type: "growth", date: "2026-01-03", world: "forest" },
      "2026-01-03",
      () => "n",
    );
    expect(() =>
      applyCommand(
        s,
        { type: "growth", date: "2026-01-03", world: "sky" },
        "2026-01-03",
        () => "n",
      ),
    ).toThrow();
    applyCommand(
      s,
      { type: "entry", date: "2026-01-02", status: "failure" },
      "2026-01-03",
      () => "n",
    );
    expect(
      s.entries.find((e) => e.date === "2026-01-03")?.world,
    ).toBeUndefined();
  });
  it("renaming preserves data and archiving preserves prior worlds", () => {
    const s = initialState();
    s.goals = [{ ...goal }];
    s.activeGoalId = "g";
    s.entries = [{ ...sequence("s")[0], world: "forest" }];
    applyCommand(
      s,
      { type: "goal", name: "renamed", start: goal.start },
      "2026-01-02",
      () => "n",
    );
    expect(s.entries).toHaveLength(1);
    applyCommand(
      s,
      { type: "goal", name: "next", start: "2026-01-02", archive: true },
      "2026-01-02",
      () => "n",
    );
    expect(s.goals[0].archivedAt).toBe("2026-01-02");
    expect(s.entries[0].world).toBe("forest");
  });
  it("rejects future, pre-goal dates and injected settings", () => {
    const s = initialState();
    s.goals = [goal];
    s.activeGoalId = "g";
    for (const date of ["2027-01-01", "2025-12-31"])
      expect(() =>
        applyCommand(
          s,
          { type: "entry", date, status: "success" },
          "2026-01-03",
          () => "n",
        ),
      ).toThrow();
    expect(() =>
      applyCommand(
        s,
        { type: "settings", patch: { lastReminder: "2026-01-03" } },
        "2026-01-03",
        () => "n",
      ),
    ).toThrow();
  });
});
describe("streaks and calendar", () => {
  it("retains yesterday streak until today is recorded", () => {
    expect(stats(sequence("sss"), goal, "2026-01-04")).toEqual({
      current: 3,
      total: 3,
      best: 3,
    });
    expect(stats(sequence("sss"), goal, "2026-01-05").current).toBe(0);
  });
  it("failure ends a streak while keeping total and best", () =>
    expect(stats(sequence("sssfss"), goal, "2026-01-06")).toEqual({
      current: 2,
      total: 5,
      best: 3,
    }));
  it("supports Persian new year, leap years and valid date input", () => {
    expect(persianParts("2026-03-21")).toEqual({
      year: 1405,
      month: 1,
      day: 1,
    });
    expect(persianYearDays(1403)).toHaveLength(366);
    expect(persianYearDays(1404)).toHaveLength(365);
    expect(fromPersian(1405, 1, 1)).toBe("2026-03-21");
    expect(fromPersian(1404, 12, 30)).toBeUndefined();
    expect(validDay("2026-02-30")).toBe(false);
  });
});
describe("daily quotes and reminders", () => {
  it("keeps one quote each day, consumes only visited days and shuffles without repeats", () => {
    const q: QuoteDailySelection = { version: 1, remaining: [], byDate: {} };
    const ids = Array.from({ length: 100 }, (_, i) => String(i));
    const used = [];
    for (let i = 0; i < 100; i++) {
      const d = addDays("2026-01-01", i * 2),
        id = pickQuote(q, d, ids);
      used.push(id);
      expect(pickQuote(q, d, ids)).toBe(id);
    }
    expect(new Set(used).size).toBe(100);
    expect(Object.keys(q.byDate)).toHaveLength(100);
    expect(pickQuote(q, "2027-01-01", ids)).not.toBe(used.at(-1));
  });
  it("respects current day, time, disabled reminder and prior delivery", () => {
    const s = initialState();
    s.goals = [goal];
    s.activeGoalId = "g";
    expect(reminderDue(s, "2026-01-03", "20:59")).toBe(false);
    expect(reminderDue(s, "2026-01-03", "21:00")).toBe(true);
    s.settings.lastReminder = "2026-01-03";
    expect(reminderDue(s, "2026-01-03", "22:00")).toBe(false);
    s.settings.lastReminder = "2026-01-02";
    s.entries = sequence("sss");
    expect(reminderDue(s, "2026-01-03", "22:00")).toBe(false);
  });
});
