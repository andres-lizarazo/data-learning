import { useMemo } from "react";
import { StepControls, VizShell, useStepper } from "./shared";

interface Props {
  /** Integer keys to insert in order. */
  data?: number[];
  /** Number of buckets. */
  buckets?: number;
  title?: string;
  caption?: string;
}

interface Frame {
  table: number[][];
  active: number | null;
  note: string;
}

export default function HashTableViz({
  data = [12, 5, 19, 26, 7, 33],
  buckets = 7,
  title,
  caption,
}: Props) {
  const frames = useMemo<Frame[]>(() => {
    const N = buckets;
    const table: number[][] = Array.from({ length: N }, () => []);
    const clone = () => table.map((b) => [...b]);
    const f: Frame[] = [{ table: clone(), active: null, note: `Empty table (${N} buckets)` }];
    for (const k of data) {
      const idx = ((k % N) + N) % N;
      f.push({ table: clone(), active: idx, note: `hash(${k}) = ${k} % ${N} = ${idx}` });
      table[idx].push(k);
      f.push({
        table: clone(),
        active: idx,
        note:
          table[idx].length > 1
            ? `Collision at bucket ${idx} → append to chain`
            : `Insert ${k} into bucket ${idx}`,
      });
    }
    return f;
  }, [data, buckets]);

  const stepper = useStepper(frames.length, 800);
  const frame = frames[stepper.idx];

  return (
    <VizShell title={title ?? "Hash Table (chaining)"} caption={caption}>
      <div className="well space-y-1.5 p-3">
        {frame.table.map((chain, i) => {
          const active = frame.active === i;
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-xs font-semibold ${
                  active ? "text-white" : "bg-white/5 text-slate-400"
                }`}
                style={active ? { background: "linear-gradient(145deg,#8b5cf6,#22d3ee)" } : undefined}
              >
                {i}
              </span>
              <span className="text-slate-600">→</span>
              <div className="flex flex-wrap gap-1.5">
                {chain.length === 0 && <span className="text-xs text-slate-600">·</span>}
                {chain.map((v, j) => (
                  <span
                    key={j}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-100"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center text-sm text-slate-300" role="status" aria-live="polite">
        {frame.note}
      </div>
      <StepControls stepper={stepper} length={frames.length} label="Op" />
    </VizShell>
  );
}
