import type { DsaVizBlock } from "../../../types/lesson";
import ArrayViz from "./ArrayViz";
import SortingViz from "./SortingViz";
import LinkedListViz from "./LinkedListViz";
import StackQueueViz from "./StackQueueViz";
import TreeViz from "./TreeViz";
import GraphViz from "./GraphViz";
import RecursionViz from "./RecursionViz";

// Maps a DsaVizBlock from lesson content to the right animated component.
// `data` is loosely typed in the content model, so we cast per-visualizer.
export default function DsaViz({ block }: { block: DsaVizBlock }) {
  const common = { title: block.title, caption: block.caption };
  const data = block.data as any;

  switch (block.viz) {
    case "array":
      return <ArrayViz {...common} data={data?.values} mode={data?.mode} />;
    case "sorting":
      return <SortingViz {...common} data={data?.values} algorithm={block.algorithm} />;
    case "linked-list":
      return <LinkedListViz {...common} initial={data?.initial} ops={data?.ops} />;
    case "stack-queue":
      return <StackQueueViz {...common} structure={data?.structure} ops={data?.ops} />;
    case "tree":
      return <TreeViz {...common} data={data?.values} traversal={data?.traversal} />;
    case "graph":
      return (
        <GraphViz
          {...common}
          adjacency={data?.adjacency}
          traversal={block.traversal}
          start={data?.start}
        />
      );
    case "recursion":
      return <RecursionViz {...common} func={data?.func} n={data?.n} />;
    default:
      return null;
  }
}
