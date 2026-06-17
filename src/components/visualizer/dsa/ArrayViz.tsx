import { useMemo } from "react";
import { StepControls, VizShell, useStepper } from "./shared";

interface Props {
  data?: number[];
  /** "scan" highlights each index in turn; "two-pointer" converges from both ends. */
  mode?: "scan" | "two-pointer";
  title?: string;
  caption?: string;
}

interface Frame {
  highlight: number[];
  note: string;
}

export default function ArrayViz({
  data = [10, 20, 30, 40, 50, 60],
  mode = "scan",
  title,
  caption,
}: Props) {
  const frames = useMemo<Frame[]>(() => {
    if (mode === "two-pointer") {
      const f: Frame[] = [];
      let lo = 0;
      let hi = data.length - 1;
      while (lo <= hi) {
        f.push({ highlight: [lo, hi], note: `left=${lo}, right=${hi}` });
        lo++;
        hi--;
      }
      f.push({ highlight: [], note: "Pointers crossed — done" });
      return f;
    }
    return [
      ...data.map((_, i) => ({ highlight: [i], note: `arr[${i}] = ${data[i]}` })),
      { highlight: [], note: "Traversal complete" },
    ];
  }, [data, mode]);

  const stepper = useStepper(frames.length, 600);
  const frame = frames[stepper.idx];

  return (
    <VizShell title={title ?? "Array"} caption={caption}>
      <div className="flex flex-wrap items-end justify-center gap-2 rounded-lg bg-ink-900/60 p-4">
        {data.map((v, i) => {
          const on = frame.highlight.includes(i);
          return (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg border text-lg font-mono font-semibold transition-all ${
                  on
                    ? "scale-110 border-brand-yellow bg-brand-yellow/20 text-brand-yellow"
                    : "border-ink-600 bg-ink-700 text-slate-200"
                }`}
              >
                {v}
              </div>
              <span className="mt-1 text-[10px] text-slate-500">{i}</span>
            </div>
          );
        })}
      </div>
      <div className="text-center text-sm text-slate-300">{frame.note}</div>
      <StepControls stepper={stepper} length={frames.length} />
    </VizShell>
  );
}
