// XP → level math. Total XP required to *reach* level n is 50·n·(n-1):
//   L1=0, L2=100, L3=300, L4=600, L5=1000, L6=1500 … (each level a bit harder).

function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export interface LevelInfo {
  level: number;
  /** XP accumulated within the current level. */
  intoLevel: number;
  /** XP span of the current level (current → next). */
  span: number;
  /** 0–100 progress toward the next level. */
  pct: number;
  /** Total XP needed to reach the next level. */
  nextLevelXp: number;
}

export function levelProgress(xp: number): LevelInfo {
  const level = levelFromXp(xp);
  const start = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const span = nextLevelXp - start;
  const intoLevel = xp - start;
  return {
    level,
    intoLevel,
    span,
    pct: span > 0 ? Math.min(100, Math.round((intoLevel / span) * 100)) : 100,
    nextLevelXp,
  };
}
