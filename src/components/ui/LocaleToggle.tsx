import { useLocaleStore } from "../../store/localeStore";
import { useT } from "../../i18n";

// Language switch (EN ⇄ ES). Mirrors ThemeToggle: a compact ghost button in the TopBar that
// shows the language you'd switch *to*, so the label reads as the action.
export default function LocaleToggle() {
  const locale = useLocaleStore((s) => s.locale);
  const toggle = useLocaleStore((s) => s.toggle);
  const t = useT();
  const next = locale === "en" ? "ES" : "EN";
  return (
    <button
      className="btn-ghost px-2 text-xs font-semibold tracking-wide"
      onClick={toggle}
      aria-label={t("locale.switch")}
      title={t("locale.switch")}
    >
      {next}
    </button>
  );
}
