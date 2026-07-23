import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import { useT } from "../../i18n";

export default function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const t = useT();
  const dark = theme === "dark";
  const label = dark ? t("theme.toLight") : t("theme.toDark");
  return (
    <button
      className="btn-ghost px-2"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
