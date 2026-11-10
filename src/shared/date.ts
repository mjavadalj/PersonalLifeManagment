import type { DayKey } from "./types";
export function dayKey(date = new Date()): DayKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDay(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}
export function addDays(key: DayKey, n: number): DayKey {
  const date = parseDay(key);
  date.setDate(date.getDate() + n);
  return dayKey(date);
}
export function validDay(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key) && dayKey(parseDay(key)) === key;
}
export const faNumber = (n: number) =>
  new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(n);
export function persianParts(key: DayKey) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(parseDay(key));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)!.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}
export function formatDay(key: DayKey, short = false) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: short ? undefined : "long",
    year: short ? undefined : "numeric",
    month: "long",
    day: "numeric",
  }).format(parseDay(key));
}
export function persianYearDays(year: number): DayKey[] {
  let start = `${year + 621}-03-18`;
  while (persianParts(start).year < year) start = addDays(start, 1);
  while (persianParts(addDays(start, -1)).year === year)
    start = addDays(start, -1);
  const days: DayKey[] = [];
  while (persianParts(start).year === year) {
    days.push(start);
    start = addDays(start, 1);
  }
  return days;
}
export function fromPersian(
  year: number,
  month: number,
  day: number,
): DayKey | undefined {
  if (
    year < 1300 ||
    year > 1600 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  )
    return;
  return persianYearDays(year).find((k) => {
    const p = persianParts(k);
    return p.month === month && p.day === day;
  });
}
