export type DayKey = string;
export type DayStatus = "success" | "failure";
export type World = "forest" | "sky";
export interface Goal {
  id: string;
  name: string;
  start: DayKey;
  archivedAt?: string;
}
export interface DailyEntry {
  goalId: string;
  date: DayKey;
  status: DayStatus;
  world?: World;
}
export interface MediaItem {
  id: string;
  name: string;
  extension: string;
  kind: "image" | "video";
}
export interface Settings {
  reminderEnabled: boolean;
  reminderTime: string;
  motivation: boolean;
  widgetEnabled: boolean;
  widgetPhoto: boolean;
  widgetCompact?: boolean;
  widgetMode: "card" | "lamp";
  mediaFit: "contain" | "cover";
  mediaPosition: number;
  mediaFrame: "auto" | "portrait" | "landscape";
  selectedMedia?: string;
  launchAtLogin: boolean;
  widgetBounds?: { x: number; y: number };
  lastReminder?: DayKey;
}
export interface Quote {
  id: string;
  en: string;
  fa: string;
  author: string;
  work: string;
  location: string;
  translator?: string;
  source: string;
}
export interface QuoteDailySelection {
  version: number;
  remaining: string[];
  byDate: Record<DayKey, string>;
  last?: string;
}
export interface AppState {
  version: 1;
  goals: Goal[];
  activeGoalId?: string;
  primarySince?: DayKey;
  growthHistory?: DailyEntry[];
  routineLinks?: (string | null)[][];
  entries: DailyEntry[];
  media: MediaItem[];
  settings: Settings;
  routine?: string[][];
  quotes: QuoteDailySelection;
}
export interface Snapshot {
  state: AppState;
  today: DayKey;
  quote: Quote;
  warning?: string;
}
export interface RoutineTask {
  habitId?: string;
  originalDay?: number;
  originalStart?: number;
  originalEnd?: number;
  day: number;
  start: number;
  end: number;
  name: string;
  daily: boolean;
  habit: boolean;
}
export type Command =
  | ({ type: "routineTask" } & RoutineTask)
  | { type: "addHabit"; name: string; start: DayKey }
  | { type: "renameHabit"; id: string; name: string }
  | { type: "removeHabit"; id: string }
  | { type: "primaryHabit"; id: string }
  | { type: "routine"; days: string[][] }
  | { type: "goal"; name: string; start: DayKey; archive?: boolean }
  | {
      type: "entry";
      date: DayKey;
      status: DayStatus | null;
      world?: World;
      goalId?: string;
    }
  | { type: "growth"; date: DayKey; world: World }
  | { type: "settings"; patch: Partial<Settings> }
  | { type: "removeMedia"; id: string };
export interface Bridge {
  read(): Promise<Snapshot>;
  dispatch(command: Command): Promise<Snapshot>;
  importMedia(): Promise<Snapshot>;
  openSource(id: string): Promise<void>;
  windowAction(
    action: "close" | "minimize" | "maximize" | "main" | "hideWidget",
  ): Promise<void>;
  widgetHeight(height: number): void;
  onPauseMedia(callback: () => void): () => void;
  subscribe(callback: (snapshot: Snapshot) => void): () => void;
}
declare global {
  interface Window {
    roy?: Bridge;
  }
}
