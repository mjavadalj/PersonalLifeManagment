import { it, expect } from "vitest";
import { defaultSchedule } from "../src/data/schedule";
import { routinePosition } from "../src/Routine";
import { applyCommand } from "../src/shared/commands";
import { initialState } from "../src/shared/logic";
import { Store } from "../electron/store";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
it("imports 36 half hours and keeps Friday exceptions", () => {
  expect(defaultSchedule.map((d) => d.length)).toEqual(Array(7).fill(36));
  expect(defaultSchedule[6][16]).toBe("نظافت");
  expect(defaultSchedule[0][4]).toBe("نویسندگی");
});
it("uses half-open intervals and finds next activity across midnight", () => {
  const p = routinePosition(defaultSchedule, new Date(2026, 9, 3, 11, 0));
  expect(p.current?.title).toBe("میان وعده1");
  expect(p.next?.title).toBe("زبان(انگلیسی/فرانسه)");
  const night = routinePosition(defaultSchedule, new Date(2026, 9, 9, 23, 50));
  expect(night.offset).toBe(1);
  expect(night.day).toBe(0);
  expect(night.next?.title).toBe("صبحانه");
});
it("loads old stores and persists routine edits without a habit goal", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "roy-routine-"));
  try {
    const old = initialState();
    await fs.writeFile(path.join(dir, "state.json"), JSON.stringify(old));
    const store = new Store(dir);
    await store.load();
    await store.transaction((d) =>
      applyCommand(
        d,
        { type: "routine", days: defaultSchedule },
        "2026-10-05",
        () => "id",
      ),
    );
    const reload = new Store(dir);
    await reload.load();
    expect(reload.state.routine).toEqual(defaultSchedule);
    expect(reload.state.goals).toEqual([]);
    expect(() =>
      applyCommand(
        old,
        { type: "routine", days: [["bad"]] },
        "2026-10-05",
        () => "id",
      ),
    ).toThrow();
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
