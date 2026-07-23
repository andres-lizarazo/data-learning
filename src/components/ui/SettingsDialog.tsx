import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Settings as SettingsIcon, Trash2, Upload, X } from "lucide-react";
import { useProgressStore } from "../../store/progressStore";
import { useLocaleStore } from "../../store/localeStore";
import { useFocusTrap } from "../../lib/useFocusTrap";
import { useT } from "../../i18n";

// Local-first settings: back up / restore everything (progress, notes, drafts) as a
// JSON file of the app's localStorage keys, plus a full reset. Opened from the TopBar
// via the "pylearn:open-settings" event.

const PREFIX = "pylearn";

function exportBlob(): string {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) data[key] = localStorage.getItem(key) ?? "";
  }
  return JSON.stringify({ app: "pylearn", exportedAt: new Date().toISOString(), data }, null, 2);
}

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);
  const reset = useProgressStore((s) => s.reset);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.set);
  const t = useT();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pylearn:open-settings", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pylearn:open-settings", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setMessage(null);
      setConfirmReset(false);
    }
  }, [open]);

  const download = () => {
    const blob = new Blob([exportBlob()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pylearn-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(t("settings.exported"));
  };

  const importFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as {
        app?: string;
        data?: Record<string, string>;
      };
      if (parsed.app !== "pylearn" || !parsed.data) {
        setMessage(t("settings.notBackup"));
        return;
      }
      for (const [key, value] of Object.entries(parsed.data)) {
        if (key.startsWith(PREFIX)) localStorage.setItem(key, value);
      }
      // Zustand stores read localStorage at init — reload to pick the restore up.
      location.reload();
    } catch {
      setMessage(t("settings.badJson"));
    }
  };

  const doReset = () => {
    reset();
    // Also clear saved code drafts so "reset" means a truly fresh start.
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("pylearn-draft:")) doomed.push(key);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
    setConfirmReset(false);
    setMessage(t("settings.resetDone"));
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[16vh]">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            ref={dialogRef}
            className="glass relative w-full max-w-md overflow-hidden"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            role="dialog"
            aria-modal="true"
            aria-label={t("settings.title")}
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <SettingsIcon className="h-4 w-4 text-accent-cyan" />
              <span className="text-sm font-semibold text-white">{t("settings.title")}</span>
              <button
                className="btn-ghost ml-auto px-2"
                onClick={() => setOpen(false)}
                aria-label={t("settings.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-4 text-sm">
              <section>
                <h3 className="mb-1 font-semibold text-slate-200">{t("settings.language")}</h3>
                <p className="mb-2 text-slate-400">{t("settings.languageHint")}</p>
                <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5">
                  {(["en", "es"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLocale(l)}
                      aria-pressed={locale === l}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                        locale === l
                          ? "bg-accent-cyan/20 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {l === "en" ? "English" : "Español"}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-1 font-semibold text-slate-200">{t("settings.backupTitle")}</h3>
                <p className="mb-2 text-slate-400">{t("settings.backupHint")}</p>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-primary" onClick={download}>
                    <Download className="h-4 w-4" /> {t("settings.export")}
                  </button>
                  <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4" /> {t("settings.import")}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importFile(f);
                      e.target.value = "";
                    }}
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-1 font-semibold text-slate-200">{t("settings.dangerTitle")}</h3>
                <p className="mb-2 text-slate-400">{t("settings.dangerHint")}</p>
                {confirmReset ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-rose-300">{t("settings.resetConfirm")}</span>
                    <button
                      className="btn-ghost border-rose-400/40 text-rose-300"
                      onClick={doReset}
                    >
                      {t("settings.resetYes")}
                    </button>
                    <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
                      {t("settings.cancel")}
                    </button>
                  </div>
                ) : (
                  <button className="btn-ghost" onClick={() => setConfirmReset(true)}>
                    <Trash2 className="h-4 w-4 text-rose-300" /> {t("settings.reset")}
                  </button>
                )}
              </section>

              {message && (
                <p className="text-accent-lime" role="status">
                  {message}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
