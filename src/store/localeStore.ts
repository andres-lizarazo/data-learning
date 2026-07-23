import { create } from "zustand";

// UI language (i18n). Persisted under its own key (not the progress store) and applied to
// <html lang> so assistive tech and the browser know the page language. Mirrors themeStore.
//
// Scope note: this drives the app *chrome* (navigation, buttons, dialogs) plus module
// titles/blurbs and track names. Lesson bodies remain in English for now — full content
// translation is a later phase.

export type Locale = "en" | "es";
const KEY = "pylearn-locale";

function initialLocale(): Locale {
  const stored = localStorage.getItem(KEY);
  if (stored === "en" || stored === "es") return stored;
  // First visit: honor the browser language, default to English.
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("es") ? "es" : "en";
}

function apply(locale: Locale) {
  document.documentElement.lang = locale;
}

interface LocaleState {
  locale: Locale;
  toggle: () => void;
  set: (l: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set, get) => {
  const locale = initialLocale();
  apply(locale); // apply at import time so <html lang> is correct before first paint
  return {
    locale,
    toggle: () => get().set(get().locale === "en" ? "es" : "en"),
    set: (l) => {
      localStorage.setItem(KEY, l);
      apply(l);
      set({ locale: l });
    },
  };
});
