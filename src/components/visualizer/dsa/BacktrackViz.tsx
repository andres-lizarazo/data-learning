import { useMemo } from "react";
import { StepControls, VizShell, useStepper } from "./shared";

interface Props {
  /** Small set whose subsets are explored. */
  data?: number[];
  title?: string;
  caption?: string;
}

interface Frame {
  path: number[];
  pointer: number;
  found: number[][];
  note: string;
}

export default function BacktrackViz({
  data = [1, 2, 3],
  title,
  caption,
}: Props) {
  const frames = useMemo<Frame[]>(() => {
    const f: Frame[] = [];
    const path: number[] = [];
    const found: number[][] = [];
    const snap = (pointer: number, note: string) =>
      f.push({ path: [...path], pointer, found: found.map((s) => [...s]), note });

    const dfs = (i: number) => {
      if (i === data.length) {
        found.push([...path]);
        snap(i, `Found subset {${path.join(", ") || "∅"}}`);
        return;
      }
      snap(i, `Skip ${data[i]}`);
      dfs(i + 1);
      path.push(data[i]);
      snap(i, `Choose ${data[i]}`);
      dfs(i + 1);
      path.pop();
    };
    snap(0, "Explore subsets by choosing/skipping each element");
    dfs(0);
    return f;
  }, [data]);

  const stepper = useStepper(frames.length, 700);
  const frame = frames[stepper.idx];

  return (
    <VizShell title={title ?? "Backtracking — subsets"} caption={caption}>
      <div className="well space-y-3 p-4">
        {/* Elements with the decision pointer */}
        <div className="flex justify-center gap-2">
          {data.map((v, i) => {
            const on = i === frame.pointer;
            const chosen = frame.path.includes(v);
            return (
              <div
                key={i}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border font-mono text-sm font-semibold transition-all ${
                  on
                    ? "scale-110 border-accent-violet/60 text-white shadow-[0_0_14px_rgba(139,92,246,0.5)]"
                    : chosen
                      ? "border-accent-lime/40 text-accent-lime"
                      : "border-white/10 bg-white/5 text-slate-400"
                }`}
                style={on ? { background: "linear-gradient(145deg,#8b5cf6,#22d3ee)" } : undefined}
              >
                {v}
              </div>
            );
          })}
        </div>
        {/* Current partial subset */}
        <div className="text-center font-mono text-sm text-slate-200">
          current: {"{"}
          {frame.path.join(", ")}
          {"}"}
        </div>
        {/* Found subsets */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {frame.found.map((s, i) => (
            <span
              key={i}
              className="rounded-md border border-accent-lime/30 bg-accent-lime/10 px-2 py-0.5 font-mono text-xs text-accent-lime"
            >
              {"{"}
              {s.join(",")}
              {"}"}
            </span>
          ))}
        </div>
      </div>
      <div className="text-center text-sm text-slate-300" role="status" aria-live="polite">
        {frame.note}
      </div>
      <StepControls stepper={stepper} length={frames.length} />
    </VizShell>
  );
}
