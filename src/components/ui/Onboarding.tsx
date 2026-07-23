import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Search, StepForward, Eye, GraduationCap, X } from "lucide-react";
import { useFocusTrap } from "../../lib/useFocusTrap";

// A one-time welcome shown on the first visit. Introduces the things a new learner can't
// discover on their own (local execution, ⌘K, [/] nav, the visualizer, spaced review).
const KEY = "pylearn-onboarded";

const TIPS = [
  {
    icon: Sparkles,
    title: "Everything runs in your browser",
    body: "Real Python and real PostgreSQL execute locally — no account, no server. Your code and progress stay on this device.",
  },
  {
    icon: Eye,
    title: "Watch your code run",
    body: "On many Python snippets, hit Visualize to step through execution line by line and see variables change.",
  },
  {
    icon: Search,
    title: "Jump anywhere with ⌘K",
    body: "Press ⌘K (Ctrl+K) to search every lesson — by title or by content — and jump straight to it.",
  },
  {
    icon: StepForward,
    title: "Navigate fast",
    body: "Use [ and ] to move to the previous / next lesson, and press ? anytime to see all shortcuts.",
  },
  {
    icon: GraduationCap,
    title: "Remember what you learn",
    body: "Flashcards feed a spaced-repetition Review queue, so key facts resurface right before you'd forget them.",
  },
];

export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setOpen(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  };

  // Esc dismisses the welcome.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        localStorage.setItem(KEY, "1");
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />
          <motion.div
            ref={dialogRef}
            className="glass relative w-full max-w-lg overflow-hidden p-6"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            role="dialog"
            aria-label="Welcome"
            aria-modal="true"
          >
            <button
              className="btn-ghost absolute right-3 top-3 px-2"
              onClick={dismiss}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-1 text-xl font-bold text-slate-100">
              Welcome to <span className="gradient-text">DataLearn</span>
            </h2>
            <p className="mb-5 text-sm text-slate-400">
              An interactive way to learn Python &amp; SQL. A few things worth knowing:
            </p>

            <ul className="space-y-3">
              {TIPS.map((t) => (
                <li key={t.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5">
                    <t.icon className="h-4 w-4 text-accent-violet" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-200">{t.title}</span>
                    <span className="block text-sm text-slate-400">{t.body}</span>
                  </span>
                </li>
              ))}
            </ul>

            <button className="btn-primary mt-6 w-full" onClick={dismiss}>
              Start learning
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
