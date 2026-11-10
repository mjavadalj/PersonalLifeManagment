import { useEffect, useRef } from "react";
import { MoonStar, Trees, X } from "lucide-react";
import type { DailyEntry, World } from "./shared/types";
import { faNumber, formatDay } from "./shared/date";
function hash(text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function Tree({
  seed,
  x,
  y,
  index,
}: {
  seed: string;
  x: number;
  y: number;
  index: number;
}) {
  const scale = 0.7 + hash(seed) * 0.5;
  return (
    <g
      className="growing-tree"
      style={{
        animationDelay: `${Math.min(index, 8) * 40}ms`,
        transformOrigin: `${x}px ${y}px`,
      }}
    >
      <g
        transform={`translate(${x} ${y}) scale(${hash(seed + "flip") > 0.5 ? -scale : scale} ${scale})`}
      >
        <image href="./tree.png" x="-35" y="-94" width="70" height="105" />
      </g>
    </g>
  );
}
export function WorldScene({
  world,
  entries,
}: {
  world: World;
  entries: DailyEntry[];
}) {
  const width = 640,
    height = Math.max(250, Math.ceil(entries.length / 10) * 110 + 75);
  return (
    <div className={`world-canvas ${world}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${world === "forest" ? "جنگل" : "آسمان"} با ${faNumber(entries.length)} روز رشد`}
      >
        <title>
          {world === "forest" ? "هر درخت، یک انتخاب" : "هر ستاره، یک قدم"}
        </title>
        {world === "forest" ? (
          <>
            <path
              d={`M20 ${height - 25} Q320 ${height - 45} 620 ${height - 25}`}
              stroke="#dde0d1"
              fill="none"
            />
            {entries.map((e, i) => (
              <g key={e.date}>
                <title>{formatDay(e.date)}</title>
                <Tree
                  seed={e.date}
                  index={i}
                  x={40 + (i % 10) * 62 + (hash(e.date + "x") - 0.5) * 15}
                  y={
                    125 +
                    Math.floor(i / 10) * 110 +
                    (hash(e.date + "y") - 0.5) * 25
                  }
                />
              </g>
            ))}
          </>
        ) : (
          <>
            {entries.map((e, i) => {
              const x = 30 + hash(e.date + "x") * 580,
                y = 45 + Math.floor(i / 10) * 110 + hash(e.date + "y") * 100;
              const prev = entries[i - 1];
              return (
                <g key={e.date} className="new-star">
                  <title>{formatDay(e.date)}</title>
                  {prev && (
                    <line
                      className="star-thread"
                      x1={30 + hash(prev.date + "x") * 580}
                      y1={
                        45 +
                        Math.floor((i - 1) / 10) * 110 +
                        hash(prev.date + "y") * 100
                      }
                      x2={x}
                      y2={y}
                      stroke="#7f91a1"
                      strokeOpacity=".4"
                      strokeWidth=".6"
                    />
                  )}
                  <circle cx={x} cy={y} r="6" fill="#e5d7aa" opacity=".12" />
                  <circle cx={x} cy={y} r={1.8 + hash(e.date)} fill="#eee5c8" />
                  {i % 5 === 0 && (
                    <path
                      d={`M${x - 5} ${y}h10 M${x} ${y - 5}v10`}
                      stroke="#eee5c8"
                      strokeWidth=".6"
                    />
                  )}
                </g>
              );
            })}
            <circle cx="590" cy="35" r="9" fill="#e6dfcb" />
            <circle cx="594" cy="31" r="8" fill="#263744" />
          </>
        )}
        {entries.length === 0 && (
          <text
            x="320"
            y="145"
            textAnchor="middle"
            className="world-empty-text"
          >
            {world === "forest"
              ? "اولین درختت منتظر یک روز موفق است."
              : "اولین ستاره‌ات منتظر یک روز موفق است."}
          </text>
        )}
      </svg>
    </div>
  );
}
export function GrowthChoice({
  date,
  onChoose,
  onClose,
}: {
  date: string;
  onChoose: (world: World) => void;
  onClose: () => void;
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
    <dialog ref={ref} className="growth-dialog" onCancel={onClose}>
      <div className="dialog-head">
        <h2>امروز، کدام دنیا؟</h2>
        <button aria-label="بعداً انتخاب می‌کنم" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <p className="muted">یک روز موفق؛ یک جای تازه در دنیای تو.</p>
      <div className="growth-options">
        <button onClick={() => onChoose("forest")}>
          <Trees size={35} />
          <strong>جنگلم</strong>
          <span>یک درخت تازه</span>
        </button>
        <button onClick={() => onChoose("sky")}>
          <MoonStar size={35} />
          <strong>آسمانم</strong>
          <span>یک ستارهٔ تازه</span>
        </button>
      </div>
      <small>{formatDay(date)}</small>
      <button className="text-button" onClick={onClose}>
        بعداً انتخاب می‌کنم
      </button>
    </dialog>
  );
}
export function DeskLamp({ on }: { on: boolean }) {
  return (
    <svg
      className={`desk-lamp ${on ? "lit" : ""}`}
      viewBox="0 0 240 155"
      role="img"
      aria-label={on ? "چراغ امروز روشن است" : "چراغ منتظر ثبت امروز است"}
    >
      <defs>
        <radialGradient id="lamp-light">
          <stop stopColor="#edcf79" stopOpacity=".6" />
          <stop offset="1" stopColor="#edcf79" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        className="lamp-light"
        cx="120"
        cy="116"
        rx="91"
        ry="32"
        fill="url(#lamp-light)"
      />
      <path d="M118 115V62" stroke="#727b62" strokeWidth="5" />
      <path d="M87 119 Q120 108 153 119 L153 123 H87Z" fill="#7b856b" />
      <path d="M90 23 Q120 16 150 23 L166 64 Q120 76 74 64Z" fill="#8b9678" />
      <path
        d="M77 64 Q120 74 163 64"
        fill="none"
        stroke={on ? "#e8ca7c" : "#647152"}
        strokeWidth="4"
      />
      <path d="M151 72V90" stroke="#8b9678" />
      <circle cx="151" cy="93" r="2" fill="#8b9678" />
    </svg>
  );
}
