import { Lock } from "lucide-react";
import type { Badge as BadgeData } from "../../lib/badges";

// A single achievement tile — full color + glow when unlocked, dimmed + lock when not.
export default function Badge({ badge }: { badge: BadgeData }) {
  const Icon = badge.icon;
  return (
    <div
      className={`panel flex items-center gap-3 p-3 transition-all ${
        badge.unlocked ? "" : "opacity-50 grayscale"
      }`}
      title={badge.desc}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{
          background: badge.unlocked
            ? "linear-gradient(145deg,#8b5cf6,#22d3ee)"
            : "rgba(255,255,255,0.05)",
          boxShadow: badge.unlocked ? "0 0 16px rgba(139,92,246,0.4)" : "none",
        }}
      >
        {badge.unlocked ? (
          <Icon className="h-5 w-5 text-white" />
        ) : (
          <Lock className="h-4 w-4 text-slate-500" />
        )}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-white">{badge.name}</div>
        <div className="truncate text-xs text-slate-400">{badge.desc}</div>
      </div>
    </div>
  );
}
