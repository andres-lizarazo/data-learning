import { useLocaleStore } from "../store/localeStore";
import { translate, type MessageKey } from "./messages";

// i18n entry point. Components call `const t = useT()` and then `t("nav.review")`.
// The hook subscribes to the locale store, so switching language re-renders callers.

export type { MessageKey } from "./messages";
export { messages, translate } from "./messages";
export { trackLabel, levelLabel, moduleTitle, moduleBlurb } from "./content";

/** Returns a translator bound to the current UI locale (reactive). */
export function useT(): (key: MessageKey) => string {
  const locale = useLocaleStore((s) => s.locale);
  return (key: MessageKey) => translate(key, locale);
}
