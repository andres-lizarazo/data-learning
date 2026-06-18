import { useMemo } from "react";
import { StepControls, VizShell, useStepper } from "./shared";

interface Props {
  data?: number[];
  /** Window size. */
  k?: number;
  metric?: "sum" | "max";
  title?: string;
  caption?: string;
}

interface Frame {
  lo: number;
  hi: number;
  agg: number;
  best: number;
  note: string;
}

export default function SlidingWindowViz({
  data = [2, 1, 5, 1, 3, 2, 4],
  k = 3,
  metric = "sum",
  title,
  caption,
}: Props) {
  const frames = useMemo<Frame[]>(() => {
    const f: Frame[] = [];
    const agg = (lo: number) => {
      const w = data.slice(lo, lo + k);
      return metric === "sum" ? w.reduce((a, b) => a + b, 0) : Math.max(...w);
    };
    let best = -Infinity;
    for (let lo = 0; lo + k <= data.length; lo++) {
      const a = agg(lo);
      best = Math.max(best, a);
      f.push({
        lo,
        hi: lo + k - 1,
        agg: a,
        best,
        note:
          lo === 0
            ? `Window [0..${k - 1}] ${metric} = ${a}`
            : `Slide right → ${metric} = ${a}, best = ${best}`,
      });
    }
    f.push({
      lo: data.length - k,
      hi: data.length - 1,
      agg: agg(data.length - k),
      best,
      note: `Done — best window ${metric} = ${best}`,
    });
    return f;
  }, [data, k, metric]);

  const stepper = useStepper(frames.length, 800);
  const frame = frames[stepper.idx];

  return (
    <VizShell title={title ?? `Sliding Window (size ${k})`} caption={caption}>
      <div className="well flex flex-wrap items-end justify-center gap-2 p-4">
        {data.map((v, i) => {
          const inWindow = i >= frame.lo && i <= frame.hi;
          return (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl border font-mono text-lg font-semibold transition-all ${
                  inWindow
                    ? "scale-110 border-accent-cyan/60 text-white shadow-[0_0_16px_rgba(34,211,238,0.4)]"
                    : "border-white/10 bg-white/5 text-slate-400"
                }`}
                style={inWindow ? { background: "linear-gradient(145deg,#8b5cf6,#22d3ee)" } : undefined}
              >
                {v}
              </div>
              <span className="mt-1 text-[10px] text-slate-500">{i}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-4 text-sm">
        <span className="text-slate-300">
          window {metric}: <b className="text-accent-cyan">{frame.agg}</b>
        </span>
        <span className="text-slate-300">
          best: <b className="text-accent-lime">{frame.best}</b>
        </span>
      </div>
      <div className="text-center text-sm text-slate-300" role="status" aria-live="polite">
        {frame.note}
      </div>
      <StepControls stepper={stepper} length={frames.length} />
    </VizShell>
  );
}
