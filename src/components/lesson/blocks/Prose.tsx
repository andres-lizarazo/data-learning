import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ProseBlock } from "../../../types/lesson";

export default function Prose({ block }: { block: ProseBlock }) {
  return (
    <div className="prose-pylearn">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.markdown}</ReactMarkdown>
    </div>
  );
}
