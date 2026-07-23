import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CornerDownLeft, Gamepad2, Search, Trophy, FileText } from "lucide-react";
import { curriculum } from "../../content/curriculum";
import { useFocusTrap } from "../../lib/useFocusTrap";
import type { Block } from "../../types/lesson";

interface Item {
  id: string;
  label: string;
  sub?: string;
  to: string;
  kind: "page" | "module" | "lesson";
  /** Lowercased full-text body (lesson content) for deep search; undefined for pages/modules. */
  haystack?: string;
}

/** Pull every human-readable string out of a block so lesson bodies are searchable. */
function blockText(block: Block): string {
  switch (block.kind) {
    case "prose":
      return block.markdown;
    case "runnable":
    case "visualized":
      return block.title ?? "";
    case "dsa-viz":
      return [block.title, block.caption].filter(Boolean).join(" ");
    case "user-viz":
      return block.title ?? "";
    case "challenge":
      return [block.title, block.prompt].join(" ");
    case "sql-runnable":
      return block.title ?? "";
    case "sql-challenge":
      return [block.title, block.prompt].join(" ");
    case "quiz":
      return [block.question, block.explanation ?? "", ...block.options.map((o) => o.text)].join(
        " ",
      );
    case "flashcards":
      return [
        block.title ?? "",
        ...block.cards.flatMap((c) => [c.front, c.back]),
      ].join(" ");
    default:
      return "";
  }
}

function buildIndex(): Item[] {
  const pages: Item[] = [
    { id: "p-home", label: "Home", to: "/", kind: "page" },
    { id: "p-roadmap", label: "Learning path — Roadmap", to: "/roadmap", kind: "page" },
    { id: "p-review", label: "Review — Flashcard queue", to: "/review", kind: "page" },
    { id: "p-practice", label: "Practice — Challenge bank", to: "/practice", kind: "page" },
    { id: "p-reference", label: "Reference — SQL & Python cheatsheet", to: "/reference", kind: "page" },
    { id: "p-playground", label: "Playground", to: "/playground", kind: "page" },
    { id: "p-sql-playground", label: "SQL Playground", to: "/sql-playground", kind: "page" },
    { id: "p-profile", label: "Profile & achievements", to: "/profile", kind: "page" },
  ];
  const items: Item[] = [...pages];
  for (const m of curriculum) {
    items.push({ id: `m-${m.id}`, label: m.title, sub: "Module", to: `/learn/${m.id}`, kind: "module" });
    for (const l of m.lessons) {
      const body = [l.title, l.summary, ...l.blocks.map(blockText)].join("  ");
      items.push({
        id: `l-${m.id}-${l.id}`,
        label: l.title,
        sub: m.title,
        to: `/learn/${m.id}/${l.id}`,
        kind: "lesson",
        haystack: body.toLowerCase(),
      });
    }
  }
  return items;
}

/** A short excerpt of `haystack` around the first match of `q`, with surrounding context. */
function snippet(haystack: string, q: string): string | undefined {
  const at = haystack.indexOf(q);
  if (at < 0) return undefined;
  const start = Math.max(0, at - 32);
  const end = Math.min(haystack.length, at + q.length + 48);
  return (start > 0 ? "…" : "") + haystack.slice(start, end).trim() + (end < haystack.length ? "…" : "");
}

function KindIcon({ kind }: { kind: Item["kind"] }) {
  if (kind === "module") return <BookOpen className="h-4 w-4 text-accent-cyan" />;
  if (kind === "lesson") return <Trophy className="h-4 w-4 text-accent-violet" />;
  return <Gamepad2 className="h-4 w-4 text-accent-lime" />;
}

interface Result extends Item {
  /** Set when the query matched the lesson body but not its title. */
  contentSnippet?: string;
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const index = useMemo(buildIndex, []);
  useFocusTrap(dialogRef, open);

  // Global ⌘K / Ctrl+K toggle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pylearn:open-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pylearn:open-command", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.slice(0, 40);
    const out: Result[] = [];
    for (const item of index) {
      const inTitle = item.label.toLowerCase().includes(q) || item.sub?.toLowerCase().includes(q);
      if (inTitle) {
        out.push(item);
      } else if (item.haystack?.includes(q)) {
        // Content-only match: surface a snippet so the learner sees why it matched.
        out.push({ ...item, contentSnippet: snippet(item.haystack, q) });
      }
      if (out.length >= 40) break;
    }
    // Title matches first, then content matches.
    return out.sort((a, b) => Number(!!a.contentSnippet) - Number(!!b.contentSnippet));
  }, [query, index]);

  useEffect(() => setActive(0), [query]);

  const go = (item?: Result) => {
    const target = item ?? results[active];
    if (!target) return;
    setOpen(false);
    navigate(target.to);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            ref={dialogRef}
            className="glass relative w-full max-w-xl overflow-hidden"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(results.length - 1, a + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(0, a - 1));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    go();
                  }
                }}
                placeholder="Search lessons, content, pages…"
                className="w-full bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-500"
                aria-label="Search"
              />
              <kbd className="pill border-white/10 bg-white/5 text-[10px] text-slate-400">ESC</kbd>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-slate-500">No matches</li>
              )}
              {results.map((item, i) => (
                <li key={item.id}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                      i === active ? "bg-white/10 text-white" : "text-slate-300"
                    }`}
                  >
                    {item.contentSnippet ? (
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <KindIcon kind={item.kind} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{item.label}</span>
                      {item.contentSnippet && (
                        <span className="block truncate text-xs text-slate-500">
                          {item.contentSnippet}
                        </span>
                      )}
                    </span>
                    {item.sub && <span className="shrink-0 text-xs text-slate-500">{item.sub}</span>}
                    {i === active && (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
