import { useMemo } from "react";
import { StepControls, VizShell, useStepper } from "./shared";

interface Props {
  /** Values inserted (in order) into a min-heap. */
  data?: number[];
  title?: string;
  caption?: string;
}

interface Frame {
  heap: number[];
  active: number[];
  note: string;
}

export default function HeapViz({
  data = [9, 4, 7, 1, 5, 8, 2],
  title,
  caption,
}: Props) {
  const frames = useMemo<Frame[]>(() => {
    const heap: number[] = [];
    const f: Frame[] = [{ heap: [], active: [], note: "Empty min-heap" }];
    const snap = (active: number[], note: string) =>
      f.push({ heap: [...heap], active, note });
    for (const v of data) {
      heap.push(v);
      let i = heap.length - 1;
      snap([i], `Insert ${v} at the end`);
      while (i > 0) {
        const p = (i - 1) >> 1;
        snap([i, p], `Compare ${heap[i]} with parent ${heap[p]}`);
        if (heap[i] < heap[p]) {
          [heap[i], heap[p]] = [heap[p], heap[i]];
          snap([p, i], `Swap up — ${heap[p]} ≤ ${heap[i]}`);
          i = p;
        } else break;
      }
    }
    snap([], "Heap built ✓ (root is the minimum)");
    return f;
  }, [data]);

  const stepper = useStepper(frames.length, 750);
  const frame = frames[stepper.idx];

  const N = Math.max(1, data.length);
  const maxLevel = Math.floor(Math.log2(N));
  const W = Math.max(220, 2 ** maxLevel * 52 + 40);
  const H = (maxLevel + 1) * 64 + 30;
  const nodePos = (i: number) => {
    const level = Math.floor(Math.log2(i + 1));
    const posInLevel = i - (2 ** level - 1);
    const xFrac = (posInLevel + 0.5) / 2 ** level;
    return { x: xFrac * W, y: level * 64 + 26 };
  };

  return (
    <VizShell title={title ?? "Min-Heap (build by insertion)"} caption={caption}>
      <div className="well overflow-auto p-3">
        <svg width={W} height={H} className="mx-auto">
          <defs>
            <linearGradient id="heap-active" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fcd34d" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          {frame.heap.map((_, i) => {
            const kids = [2 * i + 1, 2 * i + 2].filter((c) => c < frame.heap.length);
            const p = nodePos(i);
            return kids.map((c) => {
              const cp = nodePos(c);
              return (
                <line
                  key={`${i}-${c}`}
                  x1={p.x}
                  y1={p.y}
                  x2={cp.x}
                  y2={cp.y}
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth={2}
                />
              );
            });
          })}
          {frame.heap.map((v, i) => {
            const { x, y } = nodePos(i);
            const on = frame.active.includes(i);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={16}
                  fill={on ? "url(#heap-active)" : "rgba(255,255,255,0.05)"}
                  stroke={on ? "transparent" : "rgba(139,92,246,0.5)"}
                  strokeWidth={2}
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize={12}
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill={on ? "#070710" : "#e6ebf5"}
                >
                  {v}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {/* Array backing store */}
      <div className="flex flex-wrap justify-center gap-1">
        {frame.heap.map((v, i) => (
          <span
            key={i}
            className={`rounded-md border px-2 py-0.5 font-mono text-xs ${
              frame.active.includes(i)
                ? "border-amber-300/50 bg-amber-400/10 text-amber-200"
                : "border-white/10 bg-white/5 text-slate-300"
            }`}
          >
            {v}
          </span>
        ))}
      </div>
      <div className="text-center text-sm text-slate-300" role="status" aria-live="polite">
        {frame.note}
      </div>
      <StepControls stepper={stepper} length={frames.length} />
    </VizShell>
  );
}
