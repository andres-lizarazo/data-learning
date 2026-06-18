import { Flame } from "lucide-react";

// Animated streak indicator. Flame "breathes" while a streak is active.
export default function StreakFlame({ days }: { days: number }) {
  const active = days > 0;
  return (
    <span
      className="pill border-white/10 bg-white/5"
      title={active ? `${days}-day streak` : "No active streak yet"}
    >
      <Flame
        className={`h-3.5 w-3.5 ${active ? "animate-flame text-orange-400" : "text-slate-500"}`}
        fill={active ? "currentColor" : "none"}
        strokeWidth={2}
      />
      <span className={active ? "text-orange-200" : "text-slate-400"}>{days}d</span>
    </span>
  );
}
