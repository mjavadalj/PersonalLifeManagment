import type { Bridge, Snapshot } from "./shared/types";
import { initialState, pickQuote } from "./shared/logic";
import { applyCommand } from "./shared/commands";
import { dayKey, addDays } from "./shared/date";
import { focusedQuotes, quotes } from "./data/quotes";
// Browser preview uses a separate local store; production always uses the Electron bridge.
function previewBridge(): Bridge {
  const demo = new URLSearchParams(location.search).has("demo");
  const key = demo ? "roy-demo-habits" : "roy-preview";
  let state = JSON.parse(localStorage.getItem(key) ?? "null") ?? initialState();
  if (demo && !state.goals.length) {
    const today = dayKey();
    state.goals = ["نویسندگی", "ورزش", "پیانو", "مطالعه"].map((name, i) => ({
      id: "demo-" + i,
      name,
      start: addDays(today, -34),
    }));
    state.activeGoalId = "demo-0";
    for (let h = 0; h < 4; h++)
      for (let i = -34; i < 0; i++)
        if ((i + h) % 6 !== 0)
          state.entries.push({
            goalId: "demo-" + h,
            date: addDays(today, i),
            status: i % 13 === 0 ? "failure" : "success",
          });
  }
  const callbacks = new Set<(s: Snapshot) => void>();
  const read = async () => {
    const today = dayKey();
    const id = pickQuote(
      state.quotes,
      today,
      focusedQuotes.map((q) => q.id),
    );
    localStorage.setItem(key, JSON.stringify(state));
    return {
      state: structuredClone(state),
      today,
      quote: focusedQuotes.find((q) => q.id === id)!,
    };
  };
  return {
    read,
    dispatch: async (cmd) => {
      applyCommand(state, cmd, dayKey(), () => crypto.randomUUID());
      const snap = await read();
      callbacks.forEach((cb) => cb(snap));
      return snap;
    },
    importMedia: async () => {
      throw Error("واردکردن فایل در نسخهٔ دسکتاپ فعال است.");
    },
    openSource: async (id) => {
      const q = quotes.find((q) => q.id === id);
      if (q) window.open(q.source, "_blank", "noopener,noreferrer");
    },
    windowAction: async () => {},
    widgetHeight: () => {},
    onPauseMedia: () => () => {},
    subscribe: (cb) => {
      callbacks.add(cb);
      return () => {
        callbacks.delete(cb);
      };
    },
  };
}
export const bridge = window.roy ?? previewBridge();
