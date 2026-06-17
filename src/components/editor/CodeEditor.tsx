import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";

// Loose Monaco types — we avoid a hard dependency on the `monaco-editor` package
// (it is loaded from a CDN by @monaco-editor/loader at runtime).
type AnyEditor = {
  deltaDecorations: (oldIds: string[], newDecos: unknown[]) => string[];
  revealLineInCenterIfOutsideViewport: (line: number) => void;
};
type AnyMonaco = {
  Range: new (a: number, b: number, c: number, d: number) => unknown;
};

interface Props {
  value: string;
  onChange?: (v: string) => void;
  height?: number | string;
  readOnly?: boolean;
  /** 1-based line to highlight (used by the ExecutionVisualizer). */
  highlightLine?: number | null;
}

export default function CodeEditor({
  value,
  onChange,
  height = 240,
  readOnly = false,
  highlightLine = null,
}: Props) {
  const editorRef = useRef<AnyEditor | null>(null);
  const monacoRef = useRef<AnyMonaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // Re-apply the current-line decoration whenever highlightLine changes.
  useEffect(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;
    decorationsRef.current = ed.deltaDecorations(
      decorationsRef.current,
      highlightLine
        ? [
            {
              range: new monaco.Range(highlightLine, 1, highlightLine, 1),
              options: { isWholeLine: true, className: "exec-current-line" },
            },
          ]
        : [],
    );
    if (highlightLine) ed.revealLineInCenterIfOutsideViewport(highlightLine);
  }, [highlightLine]);

  return (
    <div className="overflow-hidden rounded-lg border border-ink-600/60">
      <Editor
        height={height}
        defaultLanguage="python"
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "JetBrains Mono, Fira Code, monospace",
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          tabSize: 4,
          renderLineHighlight: "all",
          automaticLayout: true,
          padding: { top: 10, bottom: 10 },
        }}
        onMount={(ed, monaco) => {
          editorRef.current = ed as unknown as AnyEditor;
          monacoRef.current = monaco as unknown as AnyMonaco;
        }}
      />
    </div>
  );
}
