import confetti from "canvas-confetti";

const ACCENTS = ["#8b5cf6", "#22d3ee", "#a3e635", "#c4b5fd", "#67e8f9"];

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/** Celebratory burst for solving a challenge / completing a lesson. */
export function celebrate(): void {
  if (reducedMotion()) return;
  const opts = { colors: ACCENTS, disableForReducedMotion: true } as const;
  confetti({ ...opts, particleCount: 80, spread: 70, origin: { y: 0.6 } });
  setTimeout(
    () => confetti({ ...opts, particleCount: 50, spread: 100, startVelocity: 35, origin: { y: 0.6 } }),
    150,
  );
}

/** Bigger, two-sided burst for finishing a whole module. */
export function bigCelebrate(): void {
  if (reducedMotion()) return;
  const opts = { colors: ACCENTS, disableForReducedMotion: true } as const;
  confetti({ ...opts, particleCount: 120, spread: 80, origin: { x: 0.2, y: 0.7 } });
  confetti({ ...opts, particleCount: 120, spread: 80, origin: { x: 0.8, y: 0.7 } });
}
