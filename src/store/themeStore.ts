import { create } from "zustand";

// Light/dark theme. Persisted under its own key (not the progress store) and applied to
// <html> as a `light` class + color-scheme so CSS variables in index.css switch the palette.

export type Theme = "dark" | "light";
const KEY = "pylearn-theme";

function initialTheme(): Theme {
  const stored = localStorage.getItem(KEY);
  if (stored === "light" || stored === "dark") return stored;
  // First visit: honor the OS preference, default to the app's native dark.
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const theme = initialTheme();
  apply(theme); // apply at import time, before first paint, to avoid a flash
  return {
    theme,
    toggle: () => get().set(get().theme === "dark" ? "light" : "dark"),
    set: (t) => {
      localStorage.setItem(KEY, t);
      apply(t);
      set({ theme: t });
    },
  };
});
