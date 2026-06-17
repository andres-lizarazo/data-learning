import { useMemo } from "react";
import { StepControls, VizShell, useStepper } from "./shared";

interface Props {
  /** Adjacency list keyed by node label. */
  adjacency?: Record<string, string[]>;
  traversal?: "bfs" | "dfs";
  start?: string;
  title?: string;
  caption?: string;
}

const DEFAULT_ADJ: Record<string, string[]> = {
  A: ["B", "C"],
  B: ["A", "D", "E"],
  C: ["A", "F"],
  D: ["B"],
  E: ["B", "F"],
  F: ["C", "E"],
};

interface Frame {
  visited: string[];
  frontier: string[];
  current: string | null;
  note: string;
}

export default function GraphViz({
  adjacency = DEFAULT_ADJ,
  traversal = "bfs",
  start = "A",
  title,
  caption,
}: Props) {
  const labels = useMemo(() => Object.keys(adjacency), [adjacency]);

  // Circular layout.
  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const R = 90;
    const cx = 140;
    const cy = 120;
    labels.forEach((l, i) => {
      const a = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
      pos[l] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });
    return pos;
  }, [labels]);

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: [string, string][] = [];
    for (const [u, vs] of Object.entries(adjacency)) {
      for (const v of vs) {
        const key = [u, v].sort().join("-");
        if (!seen.has(key)) {
          seen.add(key);
          list.push([u, v]);
        }
      }
    }
    return list;
  }, [adjacency]);

  const frames = useMemo<Frame[]>(() => {
    const f: Frame[] = [];
    const visited: string[] = [];
    const isBfs = traversal === "bfs";
    const frontier: string[] = [start];
    const enqueued = new Set<string>([start]);
    f.push({ visited: [], frontier: [...frontier], current: null, note: `Start at ${start}` });

    while (frontier.length) {
      const node = isBfs ? frontier.shift()! : frontier.pop()!;
      if (visited.includes(node)) continue;
      visited.push(node);
      f.push({
        visited: [...visited],
        frontier: [...frontier],
        current: node,
        note: `Visit ${node} → [${visited.join(", ")}]`,
      });
      for (const nb of adjacency[node] ?? []) {
        if (!enqueued.has(nb)) {
          enqueued.add(nb);
          frontier.push(nb);
        }
      }
    }
    f.push({ visited: [...visited], frontier: [], current: null, note: "Traversal complete ✓" });
    return f;
  }, [adjacency, traversal, start]);

  const stepper = useStepper(frames.length, 750);
  const frame = frames[stepper.idx];

  return (
    <VizShell title={title ?? `Graph — ${traversal.toUpperCase()}`} caption={caption}>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="overflow-auto rounded-lg bg-ink-900/60 p-2">
          <svg width={280} height={240} className="mx-auto">
            {edges.map(([u, v], i) => (
              <line
                key={i}
                x1={positions[u].x}
                y1={positions[u].y}
                x2={positions[v].x}
                y2={positions[v].y}
                stroke="#33416b"
                strokeWidth={2}
              />
            ))}
            {labels.map((l) => {
              const visited = frame.visited.includes(l);
              const current = frame.current === l;
              const inFrontier = frame.frontier.includes(l);
              const fill = current
                ? "#ffd43b"
                : visited
                  ? "#22c55e"
                  : inFrontier
                    ? "#4f8cff"
                    : "#1a2440";
              return (
                <g key={l}>
                  <circle
                    cx={positions[l].x}
                    cy={positions[l].y}
                    r={18}
                    fill={fill}
                    stroke="#4f8cff"
                    strokeWidth={2}
                  />
                  <text
                    x={positions[l].x}
                    y={positions[l].y + 5}
                    textAnchor="middle"
                    fontSize={13}
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill={current || visited ? "#0b1020" : "#e6ebf5"}
                  >
                    {l}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <div className="text-xs uppercase text-slate-400">
              {traversal === "bfs" ? "Queue (FIFO)" : "Stack (LIFO)"}
            </div>
            <div className="font-mono text-brand">[{frame.frontier.join(", ")}]</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Visited</div>
            <div className="font-mono text-brand-green">[{frame.visited.join(", ")}]</div>
          </div>
        </div>
      </div>
      <div className="text-center text-sm text-slate-300">{frame.note}</div>
      <StepControls stepper={stepper} length={frames.length} />
    </VizShell>
  );
}
