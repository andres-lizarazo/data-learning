import { create } from "zustand";
import { sqlClient } from "../sql/sqlClient";

// Boot/ready/status store for the PGlite Postgres engine — the SQL-side twin of
// pyodideStore. Components call boot() (idempotent) and read `ready`/`status`.
interface SqlState {
  ready: boolean;
  booting: boolean;
  status: string;
  boot: () => void;
}

export const useSqlStore = create<SqlState>((set, get) => {
  sqlClient.onStatus((s) => {
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
      sqlClient.init().catch((e) => {
        set({ booting: false, status: `error: ${e.message}` });
      });
    },
  };
});
