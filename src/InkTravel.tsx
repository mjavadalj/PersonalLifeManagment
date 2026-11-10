import { useEffect } from "react";
export function InkTravel({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const from = document
      .querySelector(".today-actions .success-button")
      ?.getBoundingClientRect();
    const to = document.querySelector(".cell.today")?.getBoundingClientRect();
    if (!from || !to) return;
    const dot = document.createElement("span");
    dot.className = "ink-drop";
    dot.setAttribute("aria-hidden", "true");
    const x = from.left + from.width / 2,
      y = from.top + from.height / 2,
      dx = to.left + to.width / 2 - x,
      dy = to.top + to.height / 2 - y;
    Object.assign(dot.style, { left: `${x}px`, top: `${y}px` });
    document.body.append(dot);
    const motion = dot.animate(
      [
        { transform: "translate(-50%,-50%) scale(.4)", opacity: 0 },
        {
          transform: `translate(calc(-50% + ${dx * 0.3}px),calc(-50% + ${dy * 0.1 - 18}px)) scale(1)`,
          opacity: 1,
          offset: 0.35,
        },
        {
          transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.8)`,
          opacity: 1,
          offset: 0.88,
        },
        {
          transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1.8)`,
          opacity: 0,
        },
      ],
      { duration: 850, easing: "cubic-bezier(.22,.75,.24,1)" },
    );
    motion.onfinish = () => dot.remove();
    return () => {
      motion.cancel();
      dot.remove();
    };
  }, [active]);
  return null;
}
