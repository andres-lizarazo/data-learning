import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// Celebratory banner shown when the learner levels up. Parent controls visibility +
// auto-dismiss; this is purely presentational.
export default function LevelUpToast({ level }: { level: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="fixed left-1/2 top-20 z-50 -translate-x-1/2"
    >
      <div className="glass glow-ring flex items-center gap-3 px-5 py-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-gradient shadow-glow">
          <Sparkles className="h-5 w-5 text-white" />
        </span>
        <div>
          <div className="font-display text-lg font-bold text-white">
            Level {level}! <span className="gradient-text">Level up</span>
          </div>
          <div className="text-xs text-slate-400">Keep the streak going 🔥</div>
        </div>
      </div>
    </motion.div>
  );
}
