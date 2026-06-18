import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { levelProgress } from "../../lib/level";
import AnimatedCounter from "./AnimatedCounter";

// Compact level chip + progress-to-next-level bar with a shimmering gradient fill.
export default function XPBar({ xp }: { xp: number }) {
  const { level, pct, intoLevel, span } = levelProgress(xp);

  return (
    <div className="flex items-center gap-2" title={`${intoLevel}/${span} XP to next level`}>
      <span className="pill bg-accent-soft text-white">
        <Zap className="h-3 w-3 text-accent-lime" strokeWidth={2.5} />
        Lvl {level}
      </span>
      <div className="hidden sm:block">
        <div className="h-2 w-28 overflow-hidden rounded-full border border-white/10 bg-white/5">
          <motion.div
            className="h-full rounded-full shimmer-fill animate-shimmer"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>
      <span className="text-xs font-medium text-slate-300">
        <AnimatedCounter value={xp} /> XP
      </span>
    </div>
  );
}
