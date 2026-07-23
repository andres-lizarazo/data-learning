import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { useFocusTrap } from "../../lib/useFocusTrap";
import { useT, type MessageKey } from "../../i18n";

// Global "?" opens a cheat-sheet of the app's keyboard shortcuts.

const SHORTCUTS: { keys: string[]; what: MessageKey }[] = [
  { keys: ["⌘", "K"], what: "sc.search" },
  { keys: ["⌘", "Enter"], what: "sc.run" },
  { keys: ["["], what: "sc.prevLesson" },
  { keys: ["]"], what: "sc.nextLesson" },
  { keys: ["?"], what: "sc.showHelp" },
  { keys: ["Esc"], what: "sc.closeDialogs" },
];

export default function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (t && t.closest(".monaco-editor")) return;
      e.preventDefault();
      setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            ref={dialogRef}
            className="glass relative w-full max-w-sm overflow-hidden"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            role="dialog"
            aria-modal="true"
            aria-label={t("sc.title")}
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Keyboard className="h-4 w-4 text-accent-cyan" />
              <span className="text-sm font-semibold text-white">{t("sc.title")}</span>
              <button
                className="btn-ghost ml-auto px-2"
                onClick={() => setOpen(false)}
                aria-label={t("sc.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="p-3">
              {SHORTCUTS.map((s) => (
                <li
                  key={s.what}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300"
                >
                  <span className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="pill border-white/10 bg-white/5 font-mono text-[11px] text-slate-200"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                  <span className="ml-auto text-right text-slate-400">{t(s.what)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
