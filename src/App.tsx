import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  PanelLeftClose,
  PanelLeftOpen,
  Archive,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Image,
  LampDesk,
  LoaderCircle,
  MoonStar,
  MoreHorizontal,
  Pin,
  Plus,
  Quote as QuoteIcon,
  Settings as SettingsIcon,
  Sprout,
  Trash2,
  Trees,
  X,
} from "lucide-react";
import type {
  Command,
  DailyEntry,
  Settings,
  Snapshot,
  World,
} from "./shared/types";
import { activeGoal, primaryLedger, stats } from "./shared/logic";
import { addDays, faNumber, formatDay, persianParts } from "./shared/date";
import { bridge } from "./bridge";
import {
  DayDialog,
  Heatmap,
  MediaDisplay,
  PersianDateInput,
  QuoteBlock,
  Titlebar,
} from "./components";
import { DeskLamp, GrowthChoice, WorldScene } from "./Worlds";
import { InkTravel } from "./InkTravel";

import { HabitsPage } from "./Habits";
import { RoutinePage, RoutineNow } from "./Routine";

type Page = "home" | "worlds" | "media" | "settings" | "routine" | "widget";
export function App() {
  const [snap, setSnap] = useState<Snapshot>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState<Page>("home"),
    [day, setDay] = useState<string>(),
    [growth, setGrowth] = useState<string>(),
    [ink, setInk] = useState(false),
    [year, setYear] = useState<number>(),
    [world, setWorld] = useState<World>("forest"),
    [archive, setArchive] = useState<string>();
  const [selectedHabit, setSelectedHabit] = useState<string>();
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("roy-sidebar") === "collapsed",
  );
  const isWidget = new URLSearchParams(location.search).has("widget");
  useEffect(() => {
    const read = () =>
      void bridge
        .read()
        .then((s) => {
          setSnap(s);
          setYear((y) => y ?? persianParts(s.today).year);
        })
        .catch((e) => setError(String(e)));
    read();
    const unsub = bridge.subscribe(setSnap);
    const interval = setInterval(read, 30000);
    window.addEventListener("focus", read);
    return () => {
      unsub();
      clearInterval(interval);
      window.removeEventListener("focus", read);
    };
  }, []);
  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      return await action();
    } catch (e) {
      setError(String(e).replace(/^Error:.*Error: /, ""));
    } finally {
      setBusy(false);
    }
  }
  async function dispatch(command: Command) {
    const result = await run(() => bridge.dispatch(command));
    if (result) setSnap(result);
    return result;
  }
  async function record(
    date: string,
    status: "success" | "failure" | null,
    habitId = selectedHabit ?? snap?.state.activeGoalId,
  ) {
    const old = snap?.state.entries.find(
      (e) => e.goalId === habitId && e.date === date,
    );
    if (
      old &&
      old.status !== status &&
      !window.confirm(
        habitId === snap?.state.activeGoalId
          ? "این اصلاح می‌تواند استمرار و رشد روزهای بعد را تغییر دهد. ادامه می‌دهی؟"
          : "وضعیت ثبت‌شدهٔ این روز اصلاح شود؟",
      )
    )
      return;
    const next = await dispatch({
      type: "entry",
      date,
      status,
      goalId: habitId,
    });
    if (!next) return;
    setDay(undefined);
    if (status === "success" && old?.status !== "success") {
      setInk(true);
      setTimeout(() => setInk(false), 1200);
    }
    const goal = activeGoal(next.state);
    if (
      status === "success" &&
      goal &&
      habitId === goal.id &&
      primaryLedger(next.state, next.today)?.eligible.has(date) &&
      !next.state.entries.find((e) => e.goalId === goal.id && e.date === date)
        ?.world
    ) {
      setTimeout(
        () => setGrowth(date),
        status === "success" && old?.status !== "success" ? 950 : 0,
      );
    }
  }
  async function choose(chosen: World) {
    if (!growth) return;
    const result = await dispatch({
      type: "growth",
      date: growth,
      world: chosen,
    });
    if (result) {
      setWorld(chosen);
      setGrowth(undefined);
      if (!isWidget) setPage("worlds");
    }
  }
  if (!snap)
    return (
      <div className="loading">
        <Sprout size={28} />
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={() => location.reload()}>تلاش دوباره</button>
          </>
        ) : (
          <p>رویش در حال بیدارشدن است…</p>
        )}
      </div>
    );
  const goal = activeGoal(snap.state),
    viewGoal =
      archive || selectedHabit
        ? snap.state.goals.find((g) => g.id === (archive ?? selectedHabit))
        : goal;
  const worldEntries = [
    ...(snap.state.growthHistory ?? []),
    ...snap.state.entries.filter((e) => !!e.world),
  ];
  const entries = snap.state.entries.filter((e) => e.goalId === viewGoal?.id),
    ledger =
      viewGoal?.id === goal?.id
        ? primaryLedger(snap.state, snap.today)
        : undefined;
  const summary = viewGoal
    ? stats(entries, viewGoal, snap.today)
    : { best: 0, current: 0, total: 0 };
  const todayEntry = entries.find((e) => e.date === snap.today),
    recentDays = Array.from({ length: 4 }, (_, i) =>
      addDays(snap.today, i - 3),
    ).filter((d) => viewGoal && d >= viewGoal.start),
    pending = entries.filter(
      (e) => e.status === "success" && !e.world && ledger?.eligible.has(e.date),
    );
  const patch = (value: Partial<Settings>) =>
    dispatch({ type: "settings", patch: value });
  const alert = (
    <>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button aria-label="بستن خطا" onClick={() => setError("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {snap.warning && <div className="warning">{snap.warning}</div>}
    </>
  );
  if (isWidget)
    return (
      <Widget
        snap={snap}
        busy={busy}
        error={alert}
        ink={ink}
        growth={growth}
        onChoose={choose}
        onDefer={() => setGrowth(undefined)}
        onRecord={() => record(snap.today, "success", snap.state.activeGoalId)}
        onEdit={() => void bridge.windowAction("main")}
        patch={patch}
        onPending={() => setGrowth(pending[0]?.date)}
      />
    );
  return (
    <div className="app-shell" aria-busy={busy}>
      <Titlebar />
      <InkTravel active={ink} />
      {alert}
      {!window.roy && new URLSearchParams(location.search).has("demo") && (
        <p className="demo-notice">
          پیش‌نمایش با دادهٔ نمونه · اطلاعات نسخهٔ نصب‌شده تغییر نمی‌کند
        </p>
      )}
      <div className={`workspace ${collapsed ? "collapsed" : ""}`}>
        <aside className="sidebar" aria-label="ناوبری اصلی">
          <button
            aria-label={
              collapsed ? "باز کردن نوار کناری" : "جمع کردن نوار کناری"
            }
            aria-expanded={!collapsed}
            onClick={() => {
              setCollapsed(!collapsed);
              localStorage.setItem(
                "roy-sidebar",
                collapsed ? "expanded" : "collapsed",
              );
            }}
          >
            {collapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>
          {(
            [
              { id: "home", label: "هبیت ترکر", icon: Sprout },
              { id: "routine", label: "برنامهٔ هفتگی", icon: CalendarDays },
              { id: "widget", label: "ویجت", icon: Pin },
              { id: "settings", label: "تنظیمات", icon: SettingsIcon },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              title={label}
              aria-label={label}
              aria-current={
                (
                  id === "home"
                    ? ["home", "worlds", "media"].includes(page)
                    : page === id
                )
                  ? "page"
                  : undefined
              }
              className={
                (
                  id === "home"
                    ? ["home", "worlds", "media"].includes(page)
                    : page === id
                )
                  ? "active"
                  : ""
              }
              onClick={() => {
                setPage(id);
                if (id === "home") {
                  setSelectedHabit(undefined);
                  setArchive(undefined);
                }
              }}
            >
              <Icon size={19} />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </aside>
        <div className="workspace-content">
          <main>
            {page === "routine" ? (
              <RoutinePage
                days={snap.state.routine}
                links={snap.state.routineLinks}
                goals={snap.state.goals}
                onOpenHabit={(id) => {
                  setSelectedHabit(id);
                  setPage("home");
                  setArchive(undefined);
                }}
                busy={busy}
                onSaveTask={(task) =>
                  dispatch({ type: "routineTask", ...task })
                }
              />
            ) : page === "widget" ? (
              <>
                <PageHeading
                  title="همراه روی میزت"
                  subtitle="بین عادت، انگیزه و برنامهٔ روزت جابه‌جا شو."
                />
                <Toggle
                  label="نمایش ویجت"
                  checked={snap.state.settings.widgetEnabled}
                  onChange={(v) => patch({ widgetEnabled: v })}
                />
                <Toggle
                  label="حالت جمع‌وجور ویجت"
                  checked={!!snap.state.settings.widgetCompact}
                  onChange={(v) => patch({ widgetCompact: v })}
                />
                <section className="settings-group">
                  <h2>عکس و ظاهر ویجت ترکر</h2>
                  <Toggle
                    label="عکس در ویجت ترکر"
                    checked={snap.state.settings.widgetPhoto}
                    onChange={(v) => patch({ widgetPhoto: v })}
                    description="عکس انتخاب‌شده در تب عادت نمایش داده می‌شود."
                  />
                  <Toggle
                    label="بخش انگیزه"
                    checked={snap.state.settings.motivation}
                    onChange={(v) => patch({ motivation: v })}
                  />
                  <label className="setting-line">
                    عکس ویجت
                    <select
                      aria-label="عکس ویجت"
                      value={snap.state.settings.selectedMedia ?? ""}
                      onChange={(e) =>
                        e.target.value &&
                        void patch({ selectedMedia: e.target.value })
                      }
                    >
                      <option value="" disabled>
                        انتخاب عکس
                      </option>
                      {snap.state.media
                        .filter((m) => m.kind === "image")
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="button-row">
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const next = await bridge.importMedia();
                          setSnap(next);
                        })
                      }
                    >
                      <Plus size={16} />
                      افزودن عکس
                    </button>
                    <button
                      disabled={
                        busy ||
                        !snap.state.media.some(
                          (m) =>
                            m.id === snap.state.settings.selectedMedia &&
                            m.kind === "image",
                        )
                      }
                      onClick={() => {
                        const id = snap.state.settings.selectedMedia;
                        if (
                          id &&
                          window.confirm(
                            "این عکس از کتابخانهٔ رویش حذف شود؟ فایل اصلی باقی می‌ماند.",
                          )
                        )
                          void dispatch({ type: "removeMedia", id });
                      }}
                    >
                      <Trash2 size={16} />
                      حذف عکس انتخاب‌شده
                    </button>
                  </div>
                  <label className="setting-line">
                    ظاهر ویجت
                    <select
                      value={snap.state.settings.widgetMode}
                      onChange={(e) =>
                        void patch({
                          widgetMode: e.target.value as Settings["widgetMode"],
                        })
                      }
                    >
                      <option value="card">کارت استمرار</option>
                      <option value="lamp">چراغ روی میز</option>
                    </select>
                  </label>
                  <p className="fine">
                    برای نمایش عکس، بخش انگیزه را روشن و ظاهر کارت استمرار را
                    انتخاب کن. حذف عکس آن را از کتابخانهٔ مشترک انگیزه هم حذف
                    می‌کند.
                  </p>
                </section>
                <p className="fine">
                  تب‌های کوچک بالای ویجت، نمای همراهت را عوض می‌کنند.
                </p>
              </>
            ) : page === "home" && !selectedHabit && !archive ? (
              <HabitsPage
                snap={snap}
                busy={busy}
                dispatch={dispatch}
                onSelect={(id) => {
                  setSelectedHabit(id);
                  setYear(persianParts(snap.today).year);
                }}
                onQuick={(id) => {
                  if (
                    snap.state.entries.some(
                      (e) => e.goalId === id && e.date === snap.today,
                    )
                  ) {
                    setSelectedHabit(id);
                    setDay(snap.today);
                  } else void record(snap.today, "success", id);
                }}
              />
            ) : (
              <>
                {!goal && page !== "settings" ? (
                  <Onboarding
                    today={snap.today}
                    busy={busy}
                    onSave={(name, start) =>
                      dispatch({ type: "goal", name, start })
                    }
                  />
                ) : (
                  <>
                    {archive && (
                      <div className="archive-bar">
                        <Archive size={14} />
                        آرشیو: {viewGoal?.name}
                        <button
                          onClick={() => {
                            setArchive(undefined);
                            setYear(persianParts(snap.today).year);
                          }}
                        >
                          بازگشت به هدف فعال
                        </button>
                      </div>
                    )}
                    {page === "home" && viewGoal && (
                      <>
                        <button
                          className="text-button"
                          onClick={() => {
                            setSelectedHabit(undefined);
                            setArchive(undefined);
                          }}
                        >
                          <ArrowRight size={15} />
                          همهٔ عادت‌ها
                        </button>
                        <section className="today-row">
                          <div>
                            <h1>{viewGoal.name}</h1>
                            <p>{formatDay(snap.today)}</p>
                          </div>
                          <div className="today-actions">
                            {!archive && (
                              <>
                                <button
                                  className={`primary success-button ${ink ? "ink-button" : ""}`}
                                  disabled={busy}
                                  onClick={() =>
                                    todayEntry
                                      ? setDay(snap.today)
                                      : void record(snap.today, "success")
                                  }
                                >
                                  {todayEntry?.status === "success" ? (
                                    <CheckCheck size={17} />
                                  ) : (
                                    <Check size={17} />
                                  )}
                                  <span>
                                    {todayEntry?.status === "success"
                                      ? "امروز ثبت شد"
                                      : todayEntry?.status === "failure"
                                        ? "ویرایش امروز"
                                        : "ثبت امروز"}
                                  </span>
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label="انتخاب وضعیت امروز"
                                  title="انتخاب وضعیت امروز"
                                  onClick={() => setDay(snap.today)}
                                >
                                  <MoreHorizontal size={19} />
                                </button>
                              </>
                            )}
                          </div>
                        </section>
                        {!archive && (
                          <section
                            className="recent-days"
                            aria-label="ثبت روزهای گذشته"
                          >
                            <span>روزهای اخیر</span>
                            {recentDays.map((date) => {
                              const entry = entries.find(
                                (e) => e.date === date,
                              );
                              return (
                                <button
                                  key={date}
                                  className={
                                    entry?.status === "success"
                                      ? "recorded"
                                      : ""
                                  }
                                  disabled={busy}
                                  title={
                                    entry
                                      ? "برای ویرایش وضعیت کلیک کن"
                                      : "ثبت این روز به‌عنوان موفق"
                                  }
                                  onClick={() =>
                                    entry
                                      ? setDay(date)
                                      : void record(date, "success")
                                  }
                                >
                                  {entry?.status === "success" ? (
                                    <CheckCheck size={15} />
                                  ) : (
                                    <Check size={15} />
                                  )}
                                  <span>
                                    {date === snap.today
                                      ? "امروز"
                                      : formatDay(date, true).replace(
                                          /،.*$/,
                                          "",
                                        )}
                                  </span>
                                </button>
                              );
                            })}
                          </section>
                        )}
                        <Heatmap
                          year={year ?? persianParts(snap.today).year}
                          setYear={setYear}
                          today={snap.today}
                          start={viewGoal.start}
                          entries={entries}
                          onDay={(d) => !archive && setDay(d)}
                          ink={ink}
                        />
                        <div className="inline-stats">
                          <span>
                            <strong>{faNumber(summary.current)}</strong> روز
                            استمرار
                          </span>
                          <i />
                          <span>
                            <strong>{faNumber(summary.total)}</strong> روز موفق
                          </span>
                          <i />
                          <span>
                            <strong>{faNumber(summary.best)}</strong> بهترین
                            استمرار
                          </span>
                        </div>
                        {!archive &&
                          ledger &&
                          (ledger.suspendedAt ? (
                            <button
                              className="recovery-line"
                              onClick={() => setDay(ledger.suspendedAt)}
                            >
                              برای ادامهٔ رشد، وضعیت{" "}
                              {formatDay(ledger.suspendedAt, true)} را مشخص کن.
                              <ChevronLeft size={14} />
                            </button>
                          ) : ledger.inRecovery ? (
                            <div className="recovery-line">
                              <Sprout size={14} />
                              بازگشت به رشد · {faNumber(
                                ledger.recovery,
                              )} از {faNumber(ledger.required)} روز
                              <span className="recovery-track">
                                <i
                                  style={{
                                    width: `${(ledger.recovery / ledger.required) * 100}%`,
                                  }}
                                />
                              </span>
                            </div>
                          ) : pending.length > 0 ? (
                            <button
                              className="recovery-line"
                              onClick={() => setGrowth(pending[0].date)}
                            >
                              <Sprout size={14} />
                              {faNumber(pending.length)} روز آمادهٔ رشد
                              <ChevronLeft size={14} />
                            </button>
                          ) : null)}
                        <QuoteBlock quote={snap.quote} />
                      </>
                    )}
                    {page === "worlds" && viewGoal && (
                      <>
                        <PageHeading
                          title="دنیای کوچک تو"
                          subtitle="هر درخت و هر ستاره، یادگار یک روز."
                        />
                        <div className="world-tabs">
                          <button
                            className={world === "forest" ? "active" : ""}
                            onClick={() => setWorld("forest")}
                          >
                            <Trees size={17} />
                            جنگلم{" "}
                            <span>
                              {faNumber(
                                worldEntries.filter((e) => e.world === "forest")
                                  .length,
                              )}
                            </span>
                          </button>
                          <button
                            className={world === "sky" ? "active" : ""}
                            onClick={() => setWorld("sky")}
                          >
                            <MoonStar size={17} />
                            آسمانم{" "}
                            <span>
                              {faNumber(
                                worldEntries.filter((e) => e.world === "sky")
                                  .length,
                              )}
                            </span>
                          </button>
                        </div>
                        <WorldScene
                          world={world}
                          entries={worldEntries
                            .filter((e) => e.world === world)
                            .sort((a, b) => a.date.localeCompare(b.date))}
                        />
                        {!archive && pending.length > 0 && (
                          <button
                            className="text-button"
                            onClick={() => setGrowth(pending[0].date)}
                          >
                            انتخاب رشد {faNumber(pending.length)} روز باقی‌مانده
                            <ChevronLeft size={14} />
                          </button>
                        )}
                        {ledger?.inRecovery && (
                          <p className="muted center">
                            بازگشت به رشد · {faNumber(ledger.recovery)} از{" "}
                            {faNumber(ledger.required)} روز
                          </p>
                        )}
                        <details className="rules">
                          <summary>
                            <CircleHelp size={14} />
                            قانون رشد و بازگشت
                          </summary>
                          <p>
                            هر روز موفق فقط جنگل یا آسمان را گسترش می‌دهد. شکست
                            اول، ۷ روز موفق متوالی برای بازگشت نیاز دارد؛ رشد از
                            روز هشتم آزاد می‌شود. شکست در دوره، همان دوره را از
                            نو شروع می‌کند. شکست پس از آزادشدن رشد، دوره را ۷
                            روز بیشتر می‌کند. روز نامشخص، محاسبه را معلق می‌کند.
                            ساخته‌های قبلی حفظ می‌شوند؛ اصلاح تاریخچه می‌تواند
                            رشدهایی را که دیگر مجاز نیستند حذف کند.
                          </p>
                        </details>
                      </>
                    )}
                    {page === "media" && (
                      <MediaPage
                        snap={snap}
                        busy={busy}
                        patch={patch}
                        onImport={() =>
                          void run(async () => {
                            const s = await bridge.importMedia();
                            setSnap(s);
                          })
                        }
                        onDelete={(id) => {
                          if (
                            window.confirm(
                              "این فایل از کتابخانهٔ رویش حذف شود؟ فایل اصلی‌ات باقی می‌ماند.",
                            )
                          )
                            void dispatch({ type: "removeMedia", id });
                        }}
                      />
                    )}
                    {page === "settings" && (
                      <SettingsPage
                        snap={snap}
                        busy={busy}
                        patch={patch}
                        dispatch={dispatch}
                        onArchive={(id) => {
                          setArchive(id);
                          setPage("home");
                          setYear(
                            persianParts(
                              snap.state.goals.find((g) => g.id === id)!.start,
                            ).year,
                          );
                        }}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </main>
          {goal && ["home", "worlds", "media"].includes(page) && (
            <footer className="app-footer">
              <nav aria-label="بخش‌های برنامه">
                <button
                  className={page === "home" ? "active" : ""}
                  onClick={() => {
                    setPage("home");
                    setSelectedHabit(undefined);
                    setArchive(undefined);
                  }}
                >
                  <Sprout size={17} />
                  <span>امروز</span>
                </button>
                <button
                  className={page === "worlds" ? "active" : ""}
                  onClick={() => {
                    setPage("worlds");
                    setSelectedHabit(undefined);
                    setArchive(undefined);
                  }}
                >
                  <Trees size={17} />
                  <span>دنیای من</span>
                </button>
                <button
                  className={page === "media" ? "active" : ""}
                  onClick={() => setPage("media")}
                >
                  <Image size={17} />
                  <span>انگیزه</span>
                </button>
              </nav>
            </footer>
          )}
        </div>
      </div>
      {day && !archive && viewGoal && (
        <DayDialog
          date={day}
          status={entries.find((e) => e.date === day)?.status}
          chosen={entries.find((e) => e.date === day)?.world}
          canGrow={!!ledger?.eligible.has(day)}
          onClose={() => setDay(undefined)}
          onSave={(status) => void record(day, status)}
          onGrowth={() => {
            setGrowth(day);
            setDay(undefined);
          }}
        />
      )}
      {growth && (
        <GrowthChoice
          date={growth}
          onChoose={(chosen) => void choose(chosen)}
          onClose={() => setGrowth(undefined)}
        />
      )}
      {!window.roy && (
        <div className="preview-label">
          پیش‌نمایش مرورگر · اطلاعات مستقل از اپ دسکتاپ
        </div>
      )}
    </div>
  );
}
function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
function Onboarding({
  today,
  busy,
  onSave,
}: {
  today: string;
  busy: boolean;
  onSave: (name: string, start: string) => unknown;
}) {
  const [name, setName] = useState("هر روز، یک قدم"),
    [start, setStart] = useState(today);
  return (
    <section className="onboarding">
      <Sprout size={35} />
      <h1>از همین قدم شروع کن.</h1>
      <p>یک هدف برای خودت؛ یک جای آرام برای دیدن مسیرت.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSave(name, start);
        }}
      >
        <label>
          اسم هدفت
          <input
            autoFocus
            required
            maxLength={70}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: پایبندی به انتخابم"
          />
        </label>
        <PersianDateInput value={start} onChange={setStart} />
        <p className="fine">یادآوری هر شب ساعت ۲۱؛ قابل تغییر در تنظیمات.</p>
        <button
          className="primary"
          disabled={busy || !name.trim() || start > today}
        >
          شروع مسیر
          <ArrowRight size={16} />
        </button>
      </form>
      <small>خصوصی و آفلاین؛ همه‌چیز روی همین کامپیوتر می‌ماند.</small>
    </section>
  );
}
function Toggle({
  label,
  checked,
  onChange,
  description,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`toggle-row ${disabled ? "disabled" : ""}`}>
      <span>
        {label}
        {description && <small>{description}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
function MediaPage({
  snap,
  busy,
  patch,
  onImport,
  onDelete,
}: {
  snap: Snapshot;
  busy: boolean;
  patch: (p: Partial<Settings>) => unknown;
  onImport: () => void;
  onDelete: (id: string) => void;
}) {
  const { settings, media } = snap.state;
  const item = media.find((m) => m.id === settings.selectedMedia) ?? media[0],
    index = media.findIndex((m) => m.id === item?.id);
  return (
    <>
      <PageHeading
        title="یادآورِ من"
        subtitle="چیزی که دوست داری در مسیرت همراهت باشد."
      />
      <Toggle
        label="نمایش عکس و فیلم"
        checked={settings.motivation}
        onChange={(v) => patch({ motivation: v })}
      />
      {settings.motivation ? (
        <>
          <MediaDisplay item={item} settings={settings} />
          <div className="media-controls">
            <button
              disabled={!media.length}
              aria-label="فایل قبلی"
              onClick={() =>
                void patch({
                  selectedMedia:
                    media[(index - 1 + media.length) % media.length].id,
                })
              }
            >
              <ChevronRight size={18} />
            </button>
            <span>
              {item?.name ?? "کتابخانه خالی است"}
              {media.length > 0 && (
                <small>
                  {faNumber(index + 1)} / {faNumber(media.length)}
                </small>
              )}
            </span>
            <button
              disabled={!media.length}
              aria-label="فایل بعدی"
              onClick={() =>
                void patch({
                  selectedMedia: media[(index + 1) % media.length].id,
                })
              }
            >
              <ChevronLeft size={18} />
            </button>
          </div>
          <div className="media-toolbar">
            <button className="primary" disabled={busy} onClick={onImport}>
              <Plus size={16} />
              افزودن فایل
            </button>
            {item && (
              <button onClick={() => onDelete(item.id)}>
                <Trash2 size={15} />
                حذف از کتابخانه
              </button>
            )}
            <select
              aria-label="نمایش عکس"
              value={settings.mediaFit}
              onChange={(e) =>
                void patch({ mediaFit: e.target.value as Settings["mediaFit"] })
              }
            >
              <option value="contain">نمایش کامل</option>
              <option value="cover">پرکردن قاب</option>
            </select>
            <select
              aria-label="شکل قاب"
              value={settings.mediaFrame}
              onChange={(e) =>
                void patch({
                  mediaFrame: e.target.value as Settings["mediaFrame"],
                })
              }
            >
              <option value="auto">نسبت اصلی</option>
              <option value="portrait">قاب عمودی</option>
              <option value="landscape">قاب افقی</option>
            </select>
          </div>
          {settings.mediaFit === "cover" && (
            <label className="crop-control">
              محل برش
              <input
                type="range"
                min="0"
                max="100"
                value={settings.mediaPosition}
                onChange={(e) => void patch({ mediaPosition: +e.target.value })}
              />
            </label>
          )}
          <p className="fine">
            عکس JPG، PNG و WebP؛ فیلم MP4 و WebM با کدک پشتیبانی‌شده. حداکثر هر
            فایل یک گیگابایت.
          </p>
        </>
      ) : (
        <div className="off-state">
          <Image size={30} />
          <p>بخش انگیزه خاموش است.</p>
          <small>
            با روشن‌کردن آن، کتابخانهٔ شخصی‌ات اینجا نمایش داده می‌شود.
          </small>
        </div>
      )}
    </>
  );
}
function SettingsPage({
  snap,
  busy,
  patch,
  dispatch,
  onArchive,
}: {
  snap: Snapshot;
  busy: boolean;
  patch: (p: Partial<Settings>) => unknown;
  dispatch: (cmd: Command) => Promise<unknown>;
  onArchive: (id: string) => void;
}) {
  const goal = activeGoal(snap.state) ?? { name: "", start: snap.today },
    s = snap.state.settings;
  const [name, setName] = useState(goal.name),
    [newGoal, setNewGoal] = useState(false),
    [start, setStart] = useState(goal.start);
  return (
    <>
      <PageHeading
        title="به شیوهٔ خودت"
        subtitle="تنظیمات کوچک برای همراهی بهتر."
      />
      <form
        className="goal-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            newGoal &&
            !window.confirm(
              "هدف فعلی آرشیو و یک مسیر تازه شروع شود؟ تاریخچهٔ قبلی حفظ می‌شود.",
            )
          )
            return;
          void dispatch({
            type: "goal",
            name,
            start,
            archive: newGoal,
          }).then(() => setNewGoal(false));
        }}
      >
        <label>
          {newGoal ? "نام هدف جدید" : "نام هدف"}
          <input
            value={name}
            required
            maxLength={70}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <PersianDateInput value={start} onChange={setStart} />
        <p className="fine">
          اگر پیش از نصب برنامه شروع کرده‌ای، تاریخ شروع واقعی را وارد کن؛ سپس
          روزهای گذشته را در تقویم ثبت کن.
        </p>
        <div className="button-row">
          <button disabled={busy || !name.trim()} className="primary">
            {newGoal ? "آرشیو و شروع" : "ذخیرهٔ تغییرات"}
          </button>
          <button
            type="button"
            onClick={() => {
              setNewGoal(!newGoal);
              setStart(newGoal ? goal.start : snap.today);
              setName(newGoal ? goal.name : "");
            }}
          >
            {newGoal ? "انصراف" : "شروع هدف تازه"}
          </button>
        </div>
      </form>
      <section className="settings-group">
        <h2>یادآوری</h2>
        <Toggle
          label="یادآوری روزانه"
          checked={s.reminderEnabled}
          onChange={(v) => patch({ reminderEnabled: v })}
          description="فقط وقتی امروز را ثبت نکرده‌ای؛ بدون نام هدف یا عکس."
        />
        <label className="setting-line">
          ساعت یادآوری
          <input
            type="time"
            value={s.reminderTime}
            disabled={!s.reminderEnabled}
            onChange={(e) =>
              e.target.value && patch({ reminderTime: e.target.value })
            }
          />
        </label>
        <Toggle
          label="شروع با ویندوز"
          checked={s.launchAtLogin}
          onChange={(v) => patch({ launchAtLogin: v })}
        />
        <p className="fine">
          بستن پنجره، اپ را کنار ساعت ویندوز نگه می‌دارد. پس از خروج کامل،
          اعلانی ارسال نمی‌شود.
        </p>
      </section>
      <section className="settings-group">
        <h2>روی میزت</h2>
        <Toggle
          label="ویجت همیشه‌بالا"
          checked={s.widgetEnabled}
          onChange={(v) => patch({ widgetEnabled: v })}
        />
        <Toggle
          label="عکس در ویجت"
          checked={s.widgetPhoto}
          onChange={(v) => patch({ widgetPhoto: v })}
          description="فقط عکس انتخاب‌شده، وقتی بخش انگیزه روشن است؛ فیلم نمایش داده نمی‌شود."
        />
        <label className="setting-line">
          ظاهر ویجت
          <select
            value={s.widgetMode}
            onChange={(e) =>
              void patch({
                widgetMode: e.target.value as Settings["widgetMode"],
              })
            }
          >
            <option value="card">کارت استمرار</option>
            <option value="lamp">چراغ روی میز</option>
          </select>
        </label>
      </section>
      {snap.state.goals.some((g) => g.archivedAt) && (
        <section className="settings-group">
          <h2>مسیرهای قبلی</h2>
          {snap.state.goals
            .filter((g) => g.archivedAt)
            .map((g) => (
              <button
                key={g.id}
                className="archive-link"
                onClick={() => onArchive(g.id)}
              >
                <Archive size={15} />
                {g.name}
                <ChevronLeft size={15} />
              </button>
            ))}
        </section>
      )}
      <p className="fine">
        رویش ۱.۰ · همهٔ اطلاعات و فایل‌ها محلی‌اند. رمزگذاری اختصاصی فعال نیست.
        ۱۰۰ جملهٔ دوزبانه، بدون نیاز به اینترنت.
      </p>
    </>
  );
}
function Widget({
  snap,
  busy,
  error,
  ink,
  growth,
  onChoose,
  onDefer,
  onRecord,
  onEdit,
  patch,
  onPending,
}: {
  snap: Snapshot;
  busy: boolean;
  error: React.ReactNode;
  ink: boolean;
  growth?: string;
  onChoose: (world: World) => unknown;
  onDefer: () => void;
  onRecord: () => unknown;
  onEdit: () => void;
  patch: (p: Partial<Settings>) => unknown;
  onPending: () => void;
}) {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [widgetTab, setWidgetTab] = useState(
    localStorage.getItem("roy-widget-tab") || "habit",
  );
  const ref = useRef<HTMLDivElement>(null);
  const goal = activeGoal(snap.state),
    today = snap.state.entries.find(
      (e) => e.goalId === goal?.id && e.date === snap.today,
    ),
    summary = goal
      ? stats(snap.state.entries, goal, snap.today)
      : { current: 0 },
    s = snap.state.settings,
    item = snap.state.media.find((m) => m.id === s.selectedMedia),
    photo = s.motivation && s.widgetPhoto && item?.kind === "image";
  const ledger = goal ? primaryLedger(snap.state, snap.today) : undefined,
    pending =
      goal &&
      snap.state.entries.some(
        (e) => e.goalId === goal.id && !e.world && ledger?.eligible.has(e.date),
      );
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(() => {
      if (ref.current)
        bridge.widgetHeight(
          Math.ceil(ref.current.getBoundingClientRect().height),
        );
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [s.widgetCompact]);
  return (
    <div
      className={`widget-shell ${s.widgetCompact ? "widget-compact" : ""}`}
      ref={ref}
    >
      <Titlebar
        widget
        compact={s.widgetCompact}
        onCompact={() => void patch({ widgetCompact: !s.widgetCompact })}
      />
      {error}
      <nav className="widget-tabs" aria-label="نمای ویجت">
        {[
          ["habit", "عادت"],
          ["motivation", "انگیزه"],
          ["routine", "روتین"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={widgetTab === id ? "active" : ""}
            onClick={() => {
              setWidgetTab(id);
              localStorage.setItem("roy-widget-tab", id);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {widgetTab === "routine" ? (
        <div className="widget-body">
          <RoutineNow days={snap.state.routine} />
        </div>
      ) : widgetTab === "motivation" ? (
        <div className="widget-body">
          {s.motivation && item ? (
            <MediaDisplay item={item} settings={s} />
          ) : (
            <p className="muted">عکس دلخواهت را از بخش انگیزه انتخاب کن.</p>
          )}
          <p className="widget-remember" lang="en" dir="ltr">
            REMEMBER!
          </p>
        </div>
      ) : !goal ? (
        <div className="widget-body">
          <p>اولین قدمت را تعریف کن.</p>
          <button className="primary" onClick={onEdit}>
            باز کردن رویش
          </button>
        </div>
      ) : (
        <div className="widget-body">
          <button className="widget-goal" onClick={onEdit}>
            {goal.name}
          </button>
          {s.widgetMode === "lamp" ? (
            <DeskLamp on={today?.status === "success"} />
          ) : photo ? (
            <MediaDisplay item={item} settings={s} />
          ) : null}
          {!photo && s.widgetMode === "card" && !quoteOpen ? (
            <div className="widget-count">
              <strong>{faNumber(summary.current)}</strong>
              <span>روز استمرار</span>
            </div>
          ) : (
            <p className="widget-count-line">
              {faNumber(summary.current)} روز استمرار
            </p>
          )}
          <button
            className={`primary success-button ${ink ? "ink-button" : ""}`}
            disabled={busy}
            onClick={() => (today ? onEdit() : void onRecord())}
          >
            {today?.status === "success" ? (
              <CheckCheck size={19} />
            ) : (
              <Check size={19} />
            )}
            <span>
              {today?.status === "success"
                ? "امروز ثبت شد"
                : today?.status === "failure"
                  ? "ویرایش امروز"
                  : "ثبت امروز"}
            </span>
          </button>
          {ledger?.inRecovery && (
            <small className="widget-recovery">
              بازگشت به رشد · {faNumber(ledger.recovery)} از{" "}
              {faNumber(ledger.required)}
            </small>
          )}
          {growth ? (
            <div className="widget-growth">
              <p>امروز کدام دنیا؟</p>
              <button disabled={busy} onClick={() => void onChoose("forest")}>
                <Trees size={19} />
                جنگل
              </button>
              <button disabled={busy} onClick={() => void onChoose("sky")}>
                <MoonStar size={19} />
                آسمان
              </button>
              <button className="text-button" onClick={onDefer}>
                بعداً
              </button>
            </div>
          ) : (
            pending && (
              <button
                className="text-button widget-pending"
                onClick={onPending}
              >
                <Sprout size={14} />
                انتخاب رشد
              </button>
            )
          )}
          <div className="widget-footer">
            <button onClick={() => setQuoteOpen(!quoteOpen)}>
              <QuoteIcon size={16} />
              جملهٔ امروز
            </button>
            <button
              aria-label="تغییر حالت چراغ"
              title="کارت / چراغ"
              onClick={() =>
                void patch({
                  widgetMode: s.widgetMode === "lamp" ? "card" : "lamp",
                })
              }
            >
              <LampDesk size={16} />
            </button>
          </div>
          {quoteOpen && (
            <>
              <QuoteBlock quote={snap.quote} compact />
              <button
                className="collapse-quote"
                aria-label="بستن جمله"
                onClick={() => setQuoteOpen(false)}
              >
                <ChevronDown size={18} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
