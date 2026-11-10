import { useState } from "react";
import {
  Check,
  CheckCheck,
  Plus,
  Sprout,
  Archive,
  Pencil,
  X,
} from "lucide-react";
import type { Command, Snapshot } from "./shared/types";
import { addDays, faNumber, formatDay } from "./shared/date";
import { stats } from "./shared/logic";
import { PersianDateInput } from "./components";
export function HabitsPage({
  snap,
  busy,
  onSelect,
  onQuick,
  dispatch,
}: {
  snap: Snapshot;
  busy: boolean;
  onSelect: (id: string) => void;
  onQuick: (id: string) => void;
  dispatch: (cmd: Command) => Promise<unknown>;
}) {
  const [adding, setAdding] = useState(false),
    [name, setName] = useState(""),
    [start, setStart] = useState(snap.today),
    [editing, setEditing] = useState<string>();
  const habits = snap.state.goals.filter((g) => !g.archivedAt),
    dates = Array.from({ length: 35 }, (_, i) => addDays(snap.today, i - 34));
  return (
    <section className="habits-page">
      <header className="habits-heading">
        <div>
          <h1>عادت‌های من</h1>
          <p className="muted">
            هر عادت، یک قدم کوچک · {formatDay(snap.today)}
          </p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setAdding(true);
            setEditing(undefined);
            setName("");
            setStart(snap.today);
          }}
        >
          <Plus size={16} />
          هبیت تازه
        </button>
      </header>
      {(adding || editing) && (
        <form
          className="habit-editor"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await dispatch(
                editing
                  ? { type: "renameHabit", id: editing, name }
                  : { type: "addHabit", name, start },
              )
            ) {
              setAdding(false);
              setEditing(undefined);
            }
          }}
        >
          <label>
            نام هبیت
            <input
              autoFocus
              required
              maxLength={70}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {!editing && <PersianDateInput value={start} onChange={setStart} />}
          <button className="primary" disabled={busy || !name.trim()}>
            ذخیرهٔ هبیت
          </button>
          <button
            type="button"
            aria-label="لغو"
            onClick={() => {
              setAdding(false);
              setEditing(undefined);
            }}
          >
            <X size={16} />
          </button>
        </form>
      )}
      {!habits.length && (
        <p className="habits-empty">
          اولین هبیتت را اضافه کن؛ می‌توانی فعالیت‌های برنامهٔ هفتگی را هم به
          هبیت تبدیل کنی.
        </p>
      )}
      <div className="habit-grid">
        {habits.map((habit, index) => {
          const primary = habit.id === snap.state.activeGoalId;
          const entries = snap.state.entries.filter(
              (e) => e.goalId === habit.id,
            ),
            today = entries.find((e) => e.date === snap.today);
          const summary = stats(entries, habit, snap.today);
          return (
            <article
              className={`habit-card tone-${index % 4} ${primary ? "primary-habit" : ""}`}
              key={habit.id}
            >
              <header>
                <button
                  className={`habit-quick ${today?.status === "success" ? "done" : ""}`}
                  aria-label={`${today ? "ویرایش" : "ثبت"} امروز ${habit.name}`}
                  title={today ? "ویرایش ثبت امروز" : "ثبت سریع امروز"}
                  disabled={busy}
                  onClick={() => onQuick(habit.id)}
                >
                  {today?.status === "success" ? (
                    <CheckCheck size={21} />
                  ) : (
                    <Check size={21} />
                  )}
                </button>
                <button
                  className="habit-open"
                  onClick={() => onSelect(habit.id)}
                >
                  <strong>{habit.name}</strong>
                  <small>
                    {primary
                      ? "هبیت اصلی · رشد دنیا"
                      : `${faNumber(summary.current)} روز استمرار`}
                  </small>
                </button>
              </header>
              <button
                className="habit-map-open"
                aria-label={`نمایش هیت‌مپ ${habit.name}`}
                onClick={() => onSelect(habit.id)}
              >
                <div className="habit-mini-map" aria-hidden="true">
                  {dates.map((date) => {
                    const status = entries.find((e) => e.date === date)?.status;
                    return (
                      <span
                        key={date}
                        className={`${date < habit.start ? "before-start" : (status ?? "unknown")} ${date === snap.today ? "today" : ""}`}
                      />
                    );
                  })}
                </div>
                <span className="habit-period">
                  ۳۵ روز اخیر · {faNumber(summary.total)} روز موفق
                </span>
              </button>
              <footer>
                <button
                  className={primary ? "habit-primary-label" : ""}
                  disabled={busy || primary}
                  onClick={() =>
                    void dispatch({ type: "primaryHabit", id: habit.id })
                  }
                >
                  <Sprout size={13} />
                  {primary ? "رشد دنیا" : "انتخاب به‌عنوان اصلی"}
                </button>
                <button
                  aria-label={`ویرایش نام ${habit.name}`}
                  title="ویرایش نام"
                  onClick={() => {
                    setAdding(false);
                    setEditing(habit.id);
                    setName(habit.name);
                  }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  aria-label={`آرشیو ${habit.name}`}
                  title={
                    primary
                      ? "برای آرشیو، ابتدا هبیت دیگری را اصلی کن"
                      : "آرشیو هبیت"
                  }
                  disabled={busy || primary}
                  onClick={() => {
                    if (
                      window.confirm(
                        "این هبیت آرشیو شود؟ تاریخچه و رشد قبلی حفظ می‌شوند.",
                      )
                    )
                      void dispatch({ type: "removeHabit", id: habit.id });
                  }}
                >
                  <Archive size={13} />
                </button>
              </footer>
            </article>
          );
        })}
      </div>
      <p className="fine">
        ثبت هر هبیت مستقل است. فقط هبیت اصلی از روز انتخابش، دنیای من را رشد
        می‌دهد.
      </p>
    </section>
  );
}
