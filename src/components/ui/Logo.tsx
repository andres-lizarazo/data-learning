import { Link } from "react-router-dom";
import { Terminal } from "lucide-react";

// Brand mark: a gradient tile with a terminal glyph + a Space-Grotesk wordmark.
export default function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-accent-gradient shadow-glow transition-transform group-hover:scale-105">
        <Terminal className="h-5 w-5 text-white" strokeWidth={2.5} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        Py<span className="gradient-text">Learn</span>
      </span>
    </Link>
  );
}
