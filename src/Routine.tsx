import { useEffect, useState, useRef } from "react";
import { Clock, X, Sprout } from "lucide-react";
import type { Goal, RoutineTask } from "./shared/types";
import { defaultSchedule } from "./data/schedule";
import { faNumber } from "./shared/date";
export const weekDays = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];
export function timeLabel(slot: number) {
  return `${String(6 + Math.floor(slot / 2)).padStart(2, "0")}:${slot % 2 ? "30" : "00"}`;
}
function persianTime(slot: number) {
  return timeLabel(slot).replace(/\d/g, (n) => "۰۱۲۳۴۵۶۷۸۹"[+n]);
}
export function blocks(day: string[], links?: (string | null)[]) {
  const result: { start: number; end: number; title: string }[] = [];
  day.forEach((title, i) => {
    const last = result.at(-1);
    if (
      last &&
      last.title === title &&
      (links?.[last.start] ?? null) === (links?.[i] ?? null)
    )
      last.end = i + 1;
    else result.push({ start: i, end: i + 1, title });
  });
  return result;
}
export function routinePosition(
  days: string[][],
  date = new Date(),
  links?: (string | null)[][],
) {
  const d = (date.getDay() + 1) % 7,
    minutes = date.getHours() * 60 + date.getMinutes();
  const current = blocks(days[d], links?.[d]).find(
    (b) => minutes >= 360 + b.start * 30 && minutes < 360 + b.end * 30,
  );
  for (let offset = 0; offset < 8; offset++) {
    const next = blocks(days[(d + offset) % 7]).find(
      (b) => b.title && (offset > 0 || 360 + b.start * 30 > minutes),
    );
    if (next) return { current, next, day: (d + offset) % 7, offset, minutes };
  }
  return { current, minutes };
}
function useComputerClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return now;
}
export function RoutineNow({ days = defaultSchedule }: { days?: string[][] }) {
  const now = useComputerClock();
  const p = routinePosition(days, now);
  return (
    <section className="routine-now" aria-label="برنامهٔ اکنون">
      <Clock size={18} />
      <div>
        <span className="muted">
          اکنون · {weekDays[(now.getDay() + 1) % 7]}
        </span>
        <h2>{p.current?.title || "زمان آزاد"}</h2>
        {p.current && (
          <p>
            {persianTime(p.current.start)} تا {persianTime(p.current.end)} ·{" "}
            {faNumber(360 + p.current.end * 30 - p.minutes)} دقیقه باقی مانده
          </p>
        )}
        <p className="routine-next">
          {p.next
            ? `بعدی: ${p.next.title} · ${p.offset ? weekDays[p.day!] + " · " : ""}${persianTime(p.next.start)}`
            : "برنامهٔ بعدی ثبت نشده است."}
        </p>
      </div>
    </section>
  );
}
export function RoutinePage({
  days = defaultSchedule,
  busy,
  links,
  goals = [],
  onOpenHabit,
  onSaveTask,
}: {
  days?: string[][];
  busy: boolean;
  links?: (string | null)[][];
  goals?: Goal[];
  onOpenHabit?: (id: string) => void;
  onSaveTask: (task: RoutineTask) => Promise<unknown>;
}) {
  const [edit, setEdit] = useState<{
    day: number;
    start: number;
    end: number;
    title: string;
    daily: boolean;
    habit: boolean;
    habitId?: string;
    originalDay: number;
    originalStart: number;
    originalEnd: number;
  }>();
  const [error, setError] = useState("");
  const now = useComputerClock(),
    today = (now.getDay() + 1) % 7;
  const current = routinePosition(days, now, links).current;
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  function revealCurrent() {
    const viewport = scrollRef.current,
      active = activeRef.current;
    if (!viewport || !active) return;
    const a = active.getBoundingClientRect(),
      v = viewport.getBoundingClientRect();
    viewport.scrollTop +=
      a.top -
      v.top -
      Math.max(
        50,
        (viewport.clientHeight -
          Math.min(a.height, viewport.clientHeight - 80)) /
          2,
      );
    if (a.left < v.left || a.right > v.right)
      viewport.scrollLeft +=
        a.left - v.left - (viewport.clientWidth - a.width) / 2;
  }
  useEffect(() => {
    if (!edit) revealCurrent();
  }, [today, current?.start, current?.end, edit]);
  function openEditor(
    day: number,
    b: { start: number; end: number; title: string },
  ) {
    const habit = !!links?.[day]?.[b.start];
    const daily = days.every((d, i) =>
      d
        .slice(b.start, b.end)
        .every(
          (title, j) =>
            title === b.title &&
            (links?.[i]?.[b.start + j] ?? null) ===
              (links?.[day]?.[b.start] ?? null),
        ),
    );
    setEdit({
      day,
      ...b,
      daily,
      habit,
      habitId: links?.[day]?.[b.start] ?? undefined,
      originalDay: day,
      originalStart: b.start,
      originalEnd: b.end,
    });
    setError("");
  }
  return (
    <section className="routine-page">
      <header className="routine-heading">
        <div>
          <h1>برنامهٔ هفتگی من</h1>
          <p className="muted">
            از شنبه تا جمعه، ساعت ۶ صبح تا ۲۴ · برای ویرایش هر بازه، راست‌کلیک
            کن.
          </p>
        </div>
        <RoutineNow days={days} />
      </header>
      <button
        className="text-button"
        disabled={!current}
        onClick={revealCurrent}
      >
        <Clock size={15} />
        رفتن به زمان اکنون
      </button>
      {edit && (
        <form
          className="routine-editor"
          onSubmit={async (e) => {
            e.preventDefault();
            if (edit.end <= edit.start) {
              setError("پایان باید بعد از شروع باشد.");
              return;
            }
            if (
              await onSaveTask({
                day: edit.day,
                start: edit.start,
                end: edit.end,
                name: edit.title,
                habitId: edit.habitId,
                originalDay: edit.originalDay,
                originalStart: edit.originalStart,
                originalEnd: edit.originalEnd,
                daily: edit.daily,
                habit: edit.habit,
              })
            )
              setEdit(undefined);
          }}
        >
          <label>
            روز
            <select
              value={edit.day}
              onChange={(e) => setEdit({ ...edit, day: +e.target.value })}
            >
              {weekDays.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label>
            فعالیت
            <input
              autoFocus
              maxLength={70}
              value={edit.title}
              placeholder="زمان آزاد"
              onChange={(e) => setEdit({ ...edit, title: e.target.value })}
            />
          </label>
          <label>
            از
            <select
              value={edit.start}
              onChange={(e) => setEdit({ ...edit, start: +e.target.value })}
            >
              {Array.from({ length: 36 }, (_, i) => (
                <option key={i} value={i}>
                  {persianTime(i)}
                </option>
              ))}
            </select>
          </label>
          <label>
            تا
            <select
              value={edit.end}
              onChange={(e) => setEdit({ ...edit, end: +e.target.value })}
            >
              {Array.from({ length: 36 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {persianTime(i + 1)}
                </option>
              ))}
            </select>
          </label>
          <div className="routine-editor-options">
            <label>
              <input
                type="checkbox"
                checked={edit.daily}
                onChange={(e) => setEdit({ ...edit, daily: e.target.checked })}
              />
              تکرار روزانه دارد
            </label>
            <label>
              <input
                type="checkbox"
                checked={edit.habit}
                onChange={(e) => setEdit({ ...edit, habit: e.target.checked })}
              />
              این کار یک هبیت باشد
            </label>
            <small>
              {edit.daily
                ? "این بازه در هر هفت روز جایگزین می‌شود."
                : "تغییر فقط برای روز انتخاب‌شده است."}{" "}
              {edit.habit
                ? "به هبیت هم‌نام یا هبیت قبلاً لینک‌شده متصل می‌شود؛ ثبت انجام آن مستقل است."
                : "برداشتن تیک، فقط لینک این بازه را قطع می‌کند؛ هبیت و تاریخچه حفظ می‌شوند."}
            </small>
          </div>
          <button className="primary" disabled={busy}>
            ذخیره
          </button>
          <button
            type="button"
            aria-label="لغو ویرایش"
            onClick={() => {
              setEdit(undefined);
              setError("");
            }}
          >
            <X size={18} />
          </button>
          {error && <p role="alert">{error}</p>}
          <small>
            خالی گذاشتن فعالیت، بازه را آزاد می‌کند. ذخیره، فعالیت‌های همین بازه
            را جایگزین می‌کند.
          </small>
        </form>
      )}
      <div
        ref={scrollRef}
        className="schedule-scroll"
        tabIndex={0}
        aria-label="جدول هفتگی"
      >
        <div className="schedule">
          <div className="schedule-times">
            <div className="schedule-day">ساعت</div>
            {Array.from({ length: 37 }, (_, i) => (
              <div className="time-tick" key={i}>
                {persianTime(i)}
              </div>
            ))}
          </div>
          {weekDays.map((name, d) => (
            <div className="schedule-column" key={name}>
              <div className={`schedule-day ${today === d ? "today" : ""}`}>
                {name}
              </div>
              <div className="schedule-track">
                {blocks(days[d], links?.[d]).map((b) => (
                  <button
                    key={b.start}
                    ref={
                      today === d && current?.start === b.start
                        ? activeRef
                        : undefined
                    }
                    aria-current={
                      today === d && current?.start === b.start
                        ? "time"
                        : undefined
                    }
                    className={`schedule-block ${today === d && current?.start === b.start ? "current-block" : ""} ${b.title ? "filled" : "free"} ${edit?.day === d && edit.start === b.start ? "selected" : ""}`}
                    style={{
                      top: b.start * 40,
                      height: (b.end - b.start) * 40 - 3,
                    }}
                    aria-label={`${name}، ${timeLabel(b.start)} تا ${timeLabel(b.end)}، ${b.title || "زمان آزاد"}`}
                    title={`${name}، ${timeLabel(b.start)} تا ${timeLabel(b.end)}، ${b.title || "زمان آزاد"}`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      openEditor(d, b);
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "ContextMenu" ||
                        (e.shiftKey && e.key === "F10")
                      ) {
                        e.preventDefault();
                        openEditor(d, b);
                      }
                    }}
                    onClick={() => {
                      const link = links?.[d]?.[b.start];
                      if (
                        link &&
                        goals.some((g) => g.id === link && !g.archivedAt)
                      )
                        onOpenHabit?.(link);
                    }}
                  >
                    <strong>
                      {links?.[d]?.[b.start] && <Sprout size={12} />}{" "}
                      {b.title || "آزاد"}
                    </strong>
                    {today === d && current?.start === b.start && (
                      <span className="current-label">اکنون</span>
                    )}
                    {b.end - b.start > 1 && (
                      <small>
                        {persianTime(b.start)}–{persianTime(b.end)}
                      </small>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="fine">
        برنامه از Schedule.md وارد شده؛ تغییرات در خود اپ ذخیره می‌شوند.
      </p>
    </section>
  );
}
