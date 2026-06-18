import { useMemo } from "react";
import { StepControls, VizShell, useStepper } from "./shared";

type WeightedAdj = Record<string, [string, number][]>;

interface Props {
  adjacency?: WeightedAdj;
  start?: string;
  title?: string;
  caption?: string;
}

const DEFAULT_ADJ: WeightedAdj = {
  A: [["B", 4], ["C", 1]],
  B: [["A", 4], ["D", 1]],
  C: [["A", 1], ["B", 2], ["D", 5]],
  D: [["B", 1], ["C", 5]],
};

interface Frame {
  dist: Record<string, number>;
  visited: string[];
  current: string | null;
  relax: [string, string] | null;
  note: string;
}

const INF = Infinity;
const fmt = (d: number) => (d === INF ? "∞" : String(d));

export default function DijkstraViz({
  adjacency = DEFAULT_ADJ,
  start = "A",
  title,
  caption,
}: Props) {
  const labels = useMemo(() => Object.keys(adjacency), [adjacency]);

  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const R = 88;
    const cx = 150;
    const cy = 120;
    labels.forEach((l, i) => {
      const a = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
      pos[l] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });
    return pos;
  }, [labels]);

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: [string, string, number][] = [];
    for (const [u, nbrs] of Object.entries(adjacency)) {
      for (const [v, w] of nbrs) {
        const key = [u, v].sort().join("-");
        if (!seen.has(key)) {
          seen.add(key);
          list.push([u, v, w]);
        }
      }
    }
    return list;
  }, [adjacency]);

  const frames = useMemo<Frame[]>(() => {
    const dist: Record<string, number> = {};
    labels.forEach((l) => (dist[l] = INF));
    dist[start] = 0;
    const visited: string[] = [];
    const f: Frame[] = [
      { dist: { ...dist }, visited: [], current: null, relax: null, note: `Start: dist[${start}] = 0` },
    ];

    while (true) {
      // Pick the unvisited node with the smallest tentative distance.
      let u: string | null = null;
      let best = INF;
      for (const n of labels) {
        if (!visited.includes(n) && dist[n] < best) {
          best = dist[n];
          u = n;
        }
      }
      if (u === null) break;
      visited.push(u);
      f.push({
        dist: { ...dist },
        visited: [...visited],
        current: u,
        relax: null,
        note: `Visit ${u} (shortest dist ${fmt(dist[u])})`,
      });
      for (const [v, w] of adjacency[u] ?? []) {
        if (visited.includes(v)) continue;
        if (dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;
          f.push({
            dist: { ...dist },
            visited: [...visited],
            current: u,
            relax: [u, v],
            note: `Relax ${u}→${v}: dist[${v}] = ${dist[v]}`,
          });
        }
      }
    }
    f.push({ dist: { ...dist }, visited: [...labels], current: null, relax: null, note: "Done ✓" });
    return f;
  }, [adjacency, labels, start]);

  const stepper = useStepper(frames.length, 850);
  const frame = frames[stepper.idx];

  return (
    <VizShell title={title ?? "Dijkstra (shortest paths)"} caption={caption}>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="well overflow-auto p-2">
          <svg width={300} height={240} className="mx-auto" role="img" aria-label="Weighted graph">
            <defs>
              <linearGradient id="dj-cur" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fcd34d" />
                <stop offset="1" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="dj-done" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#67e8f9" />
                <stop offset="1" stopColor="#a3e635" />
              </linearGradient>
            </defs>
            {edges.map(([u, v, w], i) => {
              const active =
                frame.relax && frame.relax[0] === u && frame.relax[1] === v;
              const mx = (positions[u].x + positions[v].x) / 2;
              const my = (positions[u].y + positions[v].y) / 2;
              return (
                <g key={i}>
                  <line
                    x1={positions[u].x}
                    y1={positions[u].y}
                    x2={positions[v].x}
                    y2={positions[v].y}
                    stroke={active ? "#fcd34d" : "rgba(255,255,255,0.14)"}
                    strokeWidth={active ? 3 : 2}
                  />
                  <text x={mx} y={my - 3} textAnchor="middle" fontSize={11} fill="#9fb0d0">
                    {w}
                  </text>
                </g>
              );
            })}
            {labels.map((l) => {
              const visited = frame.visited.includes(l);
              const current = frame.current === l;
              const fill = current
                ? "url(#dj-cur)"
                : visited
                  ? "url(#dj-done)"
                  : "rgba(255,255,255,0.05)";
              const light = current || visited;
              return (
                <g key={l}>
                  <circle
                    cx={positions[l].x}
                    cy={positions[l].y}
                    r={18}
                    fill={fill}
                    stroke={light ? "transparent" : "rgba(139,92,246,0.45)"}
                    strokeWidth={2}
                  />
                  <text
                    x={positions[l].x}
                    y={positions[l].y + 5}
                    textAnchor="middle"
                    fontSize={13}
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill={light ? "#070710" : "#e6ebf5"}
                  >
                    {l}
                  </text>
                  <text
                    x={positions[l].x}
                    y={positions[l].y - 24}
                    textAnchor="middle"
                    fontSize={11}
                    fontFamily="monospace"
                    fill="#a3e635"
                  >
                    {fmt(frame.dist[l])}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="space-y-1 text-sm">
          <div className="text-xs uppercase text-slate-400">Distances</div>
          {labels.map((l) => (
            <div key={l} className="flex justify-between gap-4 font-mono">
              <span className="text-slate-300">{l}</span>
              <span className={frame.visited.includes(l) ? "text-accent-lime" : "text-slate-400"}>
                {fmt(frame.dist[l])}
              </span>
            </div>
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
