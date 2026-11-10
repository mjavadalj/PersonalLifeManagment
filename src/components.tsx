import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImagePlus,
  Minus,
  Maximize2,
  Minimize2,
  Sprout,
  X,
} from "lucide-react";
import {
  addDays,
  faNumber,
  formatDay,
  fromPersian,
  parseDay,
  persianParts,
  persianYearDays,
} from "./shared/date";
import type { AppState, DailyEntry, MediaItem, Quote } from "./shared/types";
import { bridge } from "./bridge";
export const months = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
export function Titlebar({
  widget = false,
  compact = false,
  onCompact,
}: {
  widget?: boolean;
  compact?: boolean;
  onCompact?: () => void;
}) {
  return (
    <header className="titlebar">
      <span className="brand">
        <Sprout size={18} />
        <span>رویش</span>
      </span>
      <div className="window-actions">
        {widget && onCompact && (
          <button
            title={compact ? "حالت عادی" : "حالت جمع‌وجور"}
            aria-label={compact ? "حالت عادی" : "حالت جمع‌وجور"}
            aria-pressed={compact}
            onClick={onCompact}
          >
            {compact ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
        )}
        {!widget && (
          <button
            title="کوچک‌کردن"
            aria-label="کوچک‌کردن"
            onClick={() => void bridge.windowAction("minimize")}
          >
            <Minus size={15} />
          </button>
        )}
        {!widget && (
          <button
            title="بزرگ‌کردن / بازگرداندن پنجره"
            aria-label="بزرگ‌کردن / بازگرداندن پنجره"
            onClick={() => void bridge.windowAction("maximize")}
          >
            <Maximize2 size={15} />
          </button>
        )}
        <button
          title="بستن"
          aria-label="بستن پنجره"
          onClick={() => void bridge.windowAction("close")}
        >
          <X size={15} />
        </button>
      </div>
    </header>
  );
}
export function QuoteBlock({
  quote,
  compact = false,
}: {
  quote: Quote;
  compact?: boolean;
}) {
  return (
    <section
      className={`quote ${compact ? "compact" : ""}`}
      aria-label="جملهٔ امروز"
    >
      <blockquote lang="en" dir="ltr">
        {quote.en}
      </blockquote>
      <div className="quote-translation">
        <p>{quote.fa}</p>
        <button
          className="source"
          title={`${quote.work} · ${quote.location}${quote.translator ? " · ترجمهٔ " + quote.translator : ""}`}
          onClick={() => void bridge.openSource(quote.id)}
        >
          {quote.author} · {quote.work}
          <ExternalLink size={11} />
        </button>
        <span className="quote-location">
          {quote.location}
          {quote.translator ? ` · ترجمهٔ ${quote.translator}` : ""}
        </span>
      </div>
    </section>
  );
}
export function PersianDateInput({
  value,
  onChange,
  label = "تاریخ شروع",
}: {
  value: string;
  onChange: (date: string) => void;
  label?: string;
}) {
  const p = persianParts(value);
  const [parts, setParts] = useState(p);
  const dayInput = useRef<HTMLInputElement>(null);
  useEffect(() => setParts(persianParts(value)), [value]);
  const change = (key: keyof typeof p, n: number) => {
    const next = { ...parts, [key]: n };
    setParts(next);
    const date = fromPersian(next.year, next.month, next.day);
    if (date) onChange(date);
  };
  const valid = !!fromPersian(parts.year, parts.month, parts.day);
  useEffect(() => {
    dayInput.current?.setCustomValidity(valid ? "" : "این تاریخ وجود ندارد.");
  }, [valid]);
  return (
    <fieldset className="date-field">
      <legend>{label}</legend>
      <div>
        <input
          ref={dayInput}
          aria-label="روز"
          type="number"
          min="1"
          max="31"
          value={parts.day}
          onChange={(e) => change("day", +e.target.value)}
        />
        <select
          aria-label="ماه"
          value={parts.month}
          onChange={(e) => change("month", +e.target.value)}
        >
          {months.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          aria-label="سال"
          type="number"
          min="1378"
          max="1600"
          value={parts.year}
          onChange={(e) => change("year", +e.target.value)}
        />
      </div>
      {!valid && (
        <small role="alert">این تاریخ وجود ندارد؛ روز را اصلاح کنید.</small>
      )}
    </fieldset>
  );
}
export function Heatmap({
  year,
  setYear,
  today,
  start,
  entries,
  onDay,
  ink,
}: {
  year: number;
  setYear: (year: number) => void;
  today: string;
  start: string;
  entries: DailyEntry[];
  onDay: (day: string) => void;
  ink: boolean;
}) {
  const days = persianYearDays(year);
  const firstOffset = (parseDay(days[0]).getDay() + 1) % 7;
  const columns = Math.ceil((days.length + firstOffset) / 7);
  const map = new Map(entries.map((e) => [e.date, e]));
  const maxYear = persianParts(today).year,
    minYear = persianParts(start).year;
  const todayRef = useRef<HTMLButtonElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (todayRef.current && scroller.current) {
      const box = todayRef.current.getBoundingClientRect(),
        outer = scroller.current.getBoundingClientRect();
      if (box.left < outer.left || box.right > outer.right)
        todayRef.current.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }, [year]);
  return (
    <section className="heatmap">
      <div className="section-line">
        <span>{faNumber(year)}</span>
        <div className="year-controls">
          <button
            aria-label="سال قبل"
            disabled={year <= minYear}
            onClick={() => setYear(year - 1)}
          >
            <ChevronRight size={16} />
          </button>
          <button
            aria-label="سال بعد"
            disabled={year >= maxYear}
            onClick={() => setYear(year + 1)}
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>
      <div className="heatmap-with-days">
        <div className="weekday-labels" aria-hidden="true">
          {[
            "شنبه",
            "یکشنبه",
            "دوشنبه",
            "سه‌شنبه",
            "چهارشنبه",
            "پنجشنبه",
            "جمعه",
          ].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="heatmap-scroll" ref={scroller}>
          <div
            className="month-labels"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {days
              .filter((d) => persianParts(d).day === 1)
              .map((d) => (
                <span
                  key={d}
                  style={{
                    gridColumn:
                      Math.floor((days.indexOf(d) + firstOffset) / 7) + 1,
                  }}
                >
                  {months[persianParts(d).month - 1]}
                </span>
              ))}
          </div>
          <div
            className="heatmap-grid"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            role="group"
            aria-label="هیت‌مپ روزهای سال"
          >
            {Array.from({ length: firstOffset }, (_, i) => (
              <span key={`empty-${i}`} className="cell absent" />
            ))}
            {days.map((d) => {
              const entry = map.get(d),
                disabled = d > today || d < start;
              return (
                <button
                  key={d}
                  ref={d === today ? todayRef : undefined}
                  className={`cell ${entry?.status ?? "unknown"} ${d === today ? "today" : ""} ${d === today && ink ? "ink-cell" : ""}`}
                  disabled={disabled}
                  aria-label={`${formatDay(d)}؛ ${entry?.status === "success" ? "موفق" : entry?.status === "failure" ? "ناموفق" : "ثبت‌نشده"}`}
                  title={`${formatDay(d)} · ${entry?.status === "success" ? "موفق" : entry?.status === "failure" ? "ناموفق" : "ثبت‌نشده"}`}
                  onClick={() => onDay(d)}
                >
                  {entry?.status === "failure" && <span />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="map-legend">
        <span>
          <i className="legend-cell" />
          ثبت‌نشده
        </span>
        <span>
          <i className="legend-cell good" />
          موفق
        </span>
        <span>
          <i className="legend-cell bad" />
          ناموفق
        </span>
      </div>
    </section>
  );
}
export function MediaDisplay({
  item,
  settings,
  onAspect,
}: {
  item?: MediaItem;
  settings: AppState["settings"];
  onAspect?: (ratio: number) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [failedId, setFailedId] = useState<string>();
  // Re-selecting an item revalidates its file instead of reusing Chromium's
  // decoded-image memory cache, which can outlive a deleted local file.
  const mediaUrl = useMemo(
    () =>
      item ? `roy-media://${item.id}/?view=${crypto.randomUUID()}` : undefined,
    [item?.id],
  );
  useEffect(() => {
    const pause = () => {
      if (document.hidden) video.current?.pause();
    };
    const blur = () => video.current?.pause();
    const unsubscribe = bridge.onPauseMedia(blur);
    document.addEventListener("visibilitychange", pause);
    window.addEventListener("blur", blur);
    return () => {
      video.current?.pause();
      document.removeEventListener("visibilitychange", pause);
      window.removeEventListener("blur", blur);
      unsubscribe();
    };
  }, []);
  const style = {
    objectFit: settings.mediaFit,
    objectPosition: `50% ${settings.mediaPosition}%`,
  } as const;
  return (
    <div className={`media-frame frame-${settings.mediaFrame}`}>
      {!item ? (
        <div className="media-empty">
          <ImagePlus size={28} />
          <p>عکس یا فیلم خودت را اضافه کن.</p>
          <small>عمودی یا افقی؛ همان‌طور که دوست داری.</small>
        </div>
      ) : failedId === item.id ? (
        <p role="alert">
          این فایل پخش نمی‌شود. یک فایل سالم یا کدک دیگری انتخاب کن.
        </p>
      ) : item.kind === "video" ? (
        <video
          key={item.id}
          ref={video}
          controls
          preload="metadata"
          style={style}
          src={mediaUrl}
          onError={() => setFailedId(item.id)}
          onLoadedMetadata={(e) =>
            onAspect?.(e.currentTarget.videoWidth / e.currentTarget.videoHeight)
          }
        />
      ) : (
        <img
          key={item.id}
          alt={item.name}
          src={mediaUrl}
          style={style}
          onError={() => setFailedId(item.id)}
          onLoad={(e) =>
            onAspect?.(
              e.currentTarget.naturalWidth / e.currentTarget.naturalHeight,
            )
          }
        />
      )}
    </div>
  );
}
export function DayDialog({
  date,
  status,
  onClose,
  onSave,
  onGrowth,
  canGrow,
  chosen,
}: {
  date: string;
  status?: string;
  onClose: () => void;
  onSave: (s: "success" | "failure" | null) => void;
  onGrowth: () => void;
  canGrow: boolean;
  chosen?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-head">
        <h2>{formatDay(date)}</h2>
        <button aria-label="بستن" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <p className="muted">ثبت این روز را انتخاب یا اصلاح کن.</p>
      <div className="day-options">
        <button
          className={status === "success" ? "primary" : ""}
          onClick={() => onSave("success")}
        >
          <Check size={16} />
          موفق
        </button>
        <button
          className={status === "failure" ? "selected-failure" : ""}
          onClick={() => onSave("failure")}
        >
          ناموفق
        </button>
        <button onClick={() => onSave(null)}>ثبت‌نشده</button>
      </div>
      {status && (
        <p className="fine">
          اصلاح تاریخچه، استمرار و مجوز رشد روزهای بعد را دوباره محاسبه می‌کند.
        </p>
      )}
      {chosen ? (
        <p className="fine">
          رشد این روز: {chosen === "forest" ? "جنگل" : "آسمان"}
        </p>
      ) : (
        canGrow &&
        status === "success" && (
          <button className="text-button" onClick={onGrowth}>
            انتخاب رشد این روز
          </button>
        )
      )}
    </dialog>
  );
}
