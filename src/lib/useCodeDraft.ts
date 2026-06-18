import { useCallback, useState } from "react";

// Persists an editable code snippet to localStorage so the learner's edits survive
// navigation/reloads. Keyed per lesson-block; `reset` clears the draft back to the
// original starter code.
export function useCodeDraft(
  key: string | undefined,
  initial: string,
): readonly [string, (v: string) => void, () => void] {
  const storageKey = key ? `pylearn-draft:${key}` : null;

  const [code, setCodeState] = useState<string>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) return saved;
      } catch {
        /* ignore */
      }
    }
    return initial;
  });

  const setCode = useCallback(
    (v: string) => {
      setCodeState(v);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, v);
        } catch {
          /* ignore quota errors */
        }
      }
    },
    [storageKey],
  );

  const reset = useCallback(() => {
    setCodeState(initial);
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    }
  }, [storageKey, initial]);

  return [code, setCode, reset] as const;
}
