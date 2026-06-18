// Per-module accent colors so each track has a recognizable identity (used by the
// sidebar dots, Home cards, and module headers). Values are hex for inline gradients.

export interface ModuleTheme {
  from: string;
  to: string;
  /** Solid accent for dots / text. */
  solid: string;
}

const THEMES: Record<string, ModuleTheme> = {
  basics: { from: "#8b5cf6", to: "#22d3ee", solid: "#a78bfa" },
  "data-structures": { from: "#22d3ee", to: "#a3e635", solid: "#22d3ee" },
  dsa: { from: "#f472b6", to: "#8b5cf6", solid: "#f472b6" },
  libraries: { from: "#fbbf24", to: "#f472b6", solid: "#fbbf24" },
  numpy: { from: "#22d3ee", to: "#6366f1", solid: "#38bdf8" },
  pandas: { from: "#a3e635", to: "#22d3ee", solid: "#a3e635" },
  viz: { from: "#f472b6", to: "#fbbf24", solid: "#f472b6" },
  pyspark: { from: "#fb923c", to: "#fbbf24", solid: "#fb923c" },
};

const FALLBACK: ModuleTheme = { from: "#8b5cf6", to: "#22d3ee", solid: "#a78bfa" };

export function moduleTheme(id: string): ModuleTheme {
  return THEMES[id] ?? FALLBACK;
}

/** Inline style for a `linear-gradient` between the module's two accent colors. */
export function moduleGradient(id: string, angle = 135): string {
  const t = moduleTheme(id);
  return `linear-gradient(${angle}deg, ${t.from}, ${t.to})`;
}
