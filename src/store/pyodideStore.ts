import { create } from "zustand";
import { pyodideClient } from "../pyodide/pyodideClient";

interface PyodideState {
  ready: boolean;
  booting: boolean;
  status: string;
  /** Kick off interpreter boot (idempotent). */
  boot: () => void;
}

export const usePyodideStore = create<PyodideState>((set, get) => {
  // Mirror the client's status stream into the store.
  pyodideClient.onStatus((s) => {
    set({ status: s });
    if (s === "ready") set({ ready: true, booting: false });
  });

  return {
    ready: false,
    booting: false,
    status: "idle",
    boot: () => {
      if (get().ready || get().booting) return;
      set({ booting: true, status: "starting" });
      pyodideClient.init().catch((e) => {
        set({ booting: false, status: `error: ${e.message}` });
      });
    },
  };
});
