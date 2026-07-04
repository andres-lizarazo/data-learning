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
  "python-oop": { from: "#6366f1", to: "#f472b6", solid: "#818cf8" },
  "python-engineering": { from: "#22d3ee", to: "#fbbf24", solid: "#67e8f9" },
  dsa: { from: "#f472b6", to: "#8b5cf6", solid: "#f472b6" },
  libraries: { from: "#fbbf24", to: "#f472b6", solid: "#fbbf24" },
  numpy: { from: "#22d3ee", to: "#6366f1", solid: "#38bdf8" },
  pandas: { from: "#a3e635", to: "#22d3ee", solid: "#a3e635" },
  viz: { from: "#f472b6", to: "#fbbf24", solid: "#f472b6" },
  ml: { from: "#8b5cf6", to: "#f472b6", solid: "#c084fc" },
  pyspark: { from: "#fb923c", to: "#fbbf24", solid: "#fb923c" },
  postgres: { from: "#38bdf8", to: "#6366f1", solid: "#38bdf8" },
  solid: { from: "#f472b6", to: "#fb923c", solid: "#f472b6" },
  "design-patterns": { from: "#a78bfa", to: "#f472b6", solid: "#c4b5fd" },
  architecture: { from: "#fbbf24", to: "#8b5cf6", solid: "#fbbf24" },
  "data-fundamentals": { from: "#34d399", to: "#22d3ee", solid: "#34d399" },
  "data-modeling": { from: "#22d3ee", to: "#8b5cf6", solid: "#67e8f9" },
  "warehouse-lakehouse": { from: "#6366f1", to: "#34d399", solid: "#818cf8" },
  databricks: { from: "#f87171", to: "#fb923c", solid: "#f87171" },
  dbt: { from: "#fb923c", to: "#f472b6", solid: "#fb923c" },
  orchestration: { from: "#a3e635", to: "#22d3ee", solid: "#a3e635" },
  "data-quality": { from: "#34d399", to: "#a3e635", solid: "#34d399" },
  streaming: { from: "#22d3ee", to: "#f472b6", solid: "#38bdf8" },
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
