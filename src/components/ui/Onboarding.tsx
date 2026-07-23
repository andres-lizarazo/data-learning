import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Search, StepForward, Eye, GraduationCap, X } from "lucide-react";
import { useFocusTrap } from "../../lib/useFocusTrap";
import { useT, type MessageKey } from "../../i18n";

// A one-time welcome shown on the first visit. Introduces the things a new learner can't
// discover on their own (local execution, ⌘K, [/] nav, the visualizer, spaced review).
const KEY = "pylearn-onboarded";

const TIPS: { icon: typeof Sparkles; title: MessageKey; body: MessageKey }[] = [
  { icon: Sparkles, title: "onb.tip1.title", body: "onb.tip1.body" },
  { icon: Eye, title: "onb.tip2.title", body: "onb.tip2.body" },
  { icon: Search, title: "onb.tip3.title", body: "onb.tip3.body" },
  { icon: StepForward, title: "onb.tip4.title", body: "onb.tip4.body" },
  { icon: GraduationCap, title: "onb.tip5.title", body: "onb.tip5.body" },
];

export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);
  const t = useT();

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
            aria-label={t("onb.welcome")}
            aria-modal="true"
          >
            <button
              className="btn-ghost absolute right-3 top-3 px-2"
              onClick={dismiss}
              aria-label={t("onb.close")}
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-1 text-xl font-bold text-slate-100">
              {t("onb.welcome")} <span className="gradient-text">DataLearn</span>
            </h2>
            <p className="mb-5 text-sm text-slate-400">{t("onb.intro")}</p>

            <ul className="space-y-3">
              {TIPS.map((tip) => (
                <li key={tip.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5">
                    <tip.icon className="h-4 w-4 text-accent-violet" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-200">
                      {t(tip.title)}
                    </span>
                    <span className="block text-sm text-slate-400">{t(tip.body)}</span>
                  </span>
                </li>
              ))}
            </ul>

            <button className="btn-primary mt-6 w-full" onClick={dismiss}>
              {t("onb.start")}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
