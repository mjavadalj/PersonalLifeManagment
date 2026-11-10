import type { AppState, DailyEntry, Goal, QuoteDailySelection } from "./types";
import { addDays } from "./date";
export function initialState(): AppState {
  return {
    version: 1,
    goals: [],
    entries: [],
    media: [],
    settings: {
      reminderEnabled: true,
      reminderTime: "21:00",
      motivation: false,
      widgetEnabled: false,
      widgetPhoto: false,
      widgetMode: "card",
      mediaFit: "contain",
      mediaPosition: 50,
      mediaFrame: "auto",
      launchAtLogin: false,
    },
    quotes: { version: 1, remaining: [], byDate: {} },
  };
}
export function activeGoal(state: AppState) {
  return state.goals.find((g) => g.id === state.activeGoalId);
}
export function primaryLedger(state: AppState, today: string) {
  const goal = activeGoal(state);
  const ledger = goal
    ? growthLedger(
        state.entries,
        {
          ...goal,
          start:
            state.primarySince && state.primarySince > goal.start
              ? state.primarySince
              : goal.start,
        },
        today,
      )
    : undefined;
  if (ledger)
    for (const e of [
      ...(state.growthHistory ?? []),
      ...state.entries.filter((e) => e.goalId !== goal?.id && e.world),
    ])
      ledger.eligible.delete(e.date);
  return ledger;
}
export function stats(entries: DailyEntry[], goal: Goal, today: string) {
  const days = new Map(
    entries
      .filter((e) => e.goalId === goal.id && e.date <= today)
      .map((e) => [e.date, e.status]),
  );
  let best = 0,
    run = 0,
    total = 0;
  for (let d = goal.start; d <= today; d = addDays(d, 1)) {
    if (days.get(d) === "success") {
      run++;
      total++;
      best = Math.max(best, run);
    } else run = 0;
  }
  let d = days.has(today) ? today : addDays(today, -1),
    current = 0;
  while (d >= goal.start && days.get(d) === "success") {
    current++;
    d = addDays(d, -1);
  }
  return { best, current, total };
}
/** Replay chronological history. Unknown dates suspend the ledger; they never infer failure.
 * Failure only breaks an established successful streak. Recovery completion is not a growth day.
 * Repeated failure while recovering restarts the same requirement. */
export function growthLedger(entries: DailyEntry[], goal: Goal, today: string) {
  const days = new Map(
    entries.filter((e) => e.goalId === goal.id).map((e) => [e.date, e]),
  );
  const eligible = new Set<string>();
  let breaks = 0,
    required = 0,
    recovery = 0,
    inRecovery = false,
    run = 0,
    suspendedAt: string | undefined;
  for (let d = goal.start; d <= today; d = addDays(d, 1)) {
    const e = days.get(d);
    if (!e) {
      if (d < today) suspendedAt = d;
      break;
    }
    if (e.status === "failure") {
      if (inRecovery) recovery = 0;
      else if (run > 0) {
        breaks++;
        required = breaks * 7;
        recovery = 0;
        inRecovery = true;
      }
      run = 0;
      continue;
    }
    run++;
    if (inRecovery) {
      recovery++;
      if (recovery >= required) inRecovery = false;
    } else eligible.add(d);
  }
  return { eligible, breaks, required, recovery, inRecovery, suspendedAt };
}
export function pickQuote(
  selection: QuoteDailySelection,
  date: string,
  ids: string[],
  random = Math.random,
): string {
  if (selection.byDate[date] && ids.includes(selection.byDate[date]))
    return selection.byDate[date];
  selection.remaining = selection.remaining.filter((id) => ids.includes(id));
  if (!selection.remaining.length) {
    selection.remaining = [...ids];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [selection.remaining[i], selection.remaining[j]] = [
        selection.remaining[j],
        selection.remaining[i],
      ];
    }
    if (selection.remaining.at(-1) === selection.last && ids.length > 1) {
      [selection.remaining[0], selection.remaining[ids.length - 1]] = [
        selection.remaining[ids.length - 1],
        selection.remaining[0],
      ];
    }
  }
  const id = selection.remaining.pop()!;
  selection.byDate[date] = id;
  selection.last = id;
  return id;
}
export function reminderDue(state: AppState, today: string, time: string) {
  return Boolean(
    state.settings.reminderEnabled &&
    state.settings.lastReminder !== today &&
    time >= state.settings.reminderTime &&
    activeGoal(state) &&
    activeGoal(state)!.start <= today &&
    !state.entries.some(
      (e) => e.goalId === state.activeGoalId && e.date === today,
    ),
  );
}
