import { describe, it, expect } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { Store } from "../electron/store";
describe("atomic store", () => {
  it("uses the backup when the primary is missing after interrupted recovery", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "roy-missing-"));
    const s = new Store(dir);
    await s.load();
    await s.transaction((d) => { d.settings.reminderTime = "19:00"; });
    await fs.rename(s.file, s.file + ".bak");
    const reopened = new Store(dir);
    await reopened.load();
    expect(reopened.state.settings.reminderTime).toBe("19:00");
    expect(reopened.warning).toBeTruthy();
  });
  it("serializes simultaneous writes and preserves them on reload", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "roy-store-"));
    const s = new Store(dir);
    await s.load();
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        s.transaction((d) => {
          d.goals.push({ id: String(i), name: "goal", start: "2026-01-01" });
        }),
      ),
    );
    const reopened = new Store(dir);
    await reopened.load();
    expect(reopened.state.goals).toHaveLength(10);
  });
  it("recovers a damaged primary from valid backup without overwriting damaged evidence", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "roy-recover-"));
    const s = new Store(dir);
    await s.load();
    await s.transaction((d) => {
      d.settings.reminderTime = "20:00";
    });
    await s.transaction((d) => {
      d.settings.reminderTime = "22:00";
    });
    await fs.writeFile(s.file, "invalid");
    const recovered = new Store(dir);
    await recovered.load();
    expect(recovered.warning).toBeTruthy();
    expect(recovered.state.settings.reminderTime).toBe("20:00");
    expect((await fs.readdir(dir)).some((f) => f.includes(".damaged-"))).toBe(
      true,
    );
  });
  it("rejects corrupted stores without resetting user data", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "roy-invalid-"));
    await fs.writeFile(path.join(dir, "state.json"), "bad");
    await expect(new Store(dir).load()).rejects.toThrow();
    expect(await fs.readFile(path.join(dir, "state.json"), "utf8")).toBe("bad");
  });
});
