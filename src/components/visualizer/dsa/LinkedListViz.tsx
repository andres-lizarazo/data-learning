import { useMemo } from "react";
import { StepControls, VizShell, useStepper } from "./shared";

interface Op {
  op: "append" | "prepend" | "delete";
  value: number;
}

interface Props {
  initial?: number[];
  ops?: Op[];
  title?: string;
  caption?: string;
}

interface Frame {
  nodes: number[];
  active: number | null;
  note: string;
}

const DEFAULT_OPS: Op[] = [
  { op: "append", value: 30 },
  { op: "prepend", value: 5 },
  { op: "delete", value: 20 },
];

export default function LinkedListViz({
  initial = [10, 20],
  ops = DEFAULT_OPS,
  title,
  caption,
}: Props) {
  const frames = useMemo<Frame[]>(() => {
    const f: Frame[] = [{ nodes: [...initial], active: null, note: "Initial list" }];
    const nodes = [...initial];
    for (const o of ops) {
      if (o.op === "append") {
        nodes.push(o.value);
        f.push({ nodes: [...nodes], active: nodes.length - 1, note: `append(${o.value}) — new tail` });
      } else if (o.op === "prepend") {
        nodes.unshift(o.value);
        f.push({ nodes: [...nodes], active: 0, note: `prepend(${o.value}) — new head` });
      } else if (o.op === "delete") {
        const i = nodes.indexOf(o.value);
        if (i >= 0) {
          f.push({ nodes: [...nodes], active: i, note: `delete(${o.value}) — relink neighbors` });
          nodes.splice(i, 1);
          f.push({ nodes: [...nodes], active: null, note: `removed ${o.value}` });
        }
      }
    }
    return f;
  }, [initial, ops]);

  const stepper = useStepper(frames.length, 850);
  const frame = frames[stepper.idx];

  return (
    <VizShell title={title ?? "Singly Linked List"} caption={caption}>
      <div className="flex min-h-[8rem] flex-wrap items-center gap-1 rounded-lg bg-ink-900/60 p-4">
        {frame.nodes.length === 0 && <span className="text-sm text-slate-500">null</span>}
        {frame.nodes.map((v, i) => (
          <div key={`${i}-${v}`} className="flex items-center">
            <div
              className={`flex items-center overflow-hidden rounded-lg border font-mono ${
                frame.active === i ? "border-brand-yellow" : "border-ink-600"
              }`}
            >
              <span
                className={`px-3 py-2 font-semibold ${
                  frame.active === i
                    ? "bg-brand-yellow/20 text-brand-yellow"
                    : "bg-ink-700 text-slate-100"
                }`}
              >
                {v}
              </span>
              <span className="border-l border-ink-600 bg-ink-800 px-2 py-2 text-xs text-slate-400">
                next
              </span>
            </div>
            <span className="px-1 text-slate-500">→</span>
          </div>
        ))}
        <span className="text-sm text-slate-500">null</span>
      </div>
      <div className="text-center text-sm text-slate-300">{frame.note}</div>
      <StepControls stepper={stepper} length={frames.length} label="Op" />
    </VizShell>
  );
}
