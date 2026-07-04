// Main-thread client for the in-browser PostgreSQL engine (PGlite — real Postgres
// compiled to WebAssembly). Mirrors the shape of pyodideClient: a typed promise API
// plus a subscribe-able status string so the UI can show boot progress.
//
// PGlite is lazy-imported on first use (its ~3 MB WASM is fetched then). Queries run
// against tiny seeded tables, so the main thread is plenty fast and we avoid the
// complexity of bundling the WASM into a nested module worker.

import { SEEDS, type SeedId } from "./seeds";

export interface SqlExecResult {
  ok: boolean;
  /** Column names of the last statement that returned rows. */
  columns: string[];
  /** Rows of the last statement that returned rows (each a value array, column order). */
  rows: unknown[][];
  /** Rows affected by the last statement (INSERT/UPDATE/DELETE). */
  affectedRows: number;
  /** True when the last statement returned a result set (a SELECT-like query). */
  hasResultSet: boolean;
  /** NOTICE/RAISE messages emitted during execution. */
  notices: string[];
  error: string | null;
}

// Loose PGlite typings — we only use a small surface.
type PgField = { name: string; dataTypeID: number };
type PgResult = { rows: Record<string, unknown>[]; fields: PgField[]; affectedRows?: number };
type PgliteDb = {
  exec: (sql: string) => Promise<PgResult[]>;
  query: (sql: string) => Promise<PgResult>;
};

class SqlClient {
  private db: PgliteDb | null = null;
  private bootPromise: Promise<void> | null = null;
  private statusListeners = new Set<(s: string) => void>();
  /** Which seed the shared engine currently holds. */
  private currentSeed: SeedId = "ecommerce";

  status = "idle";
  ready = false;

  onStatus(listener: (s: string) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(s: string) {
    this.status = s;
    if (s === "ready") this.ready = true;
    this.statusListeners.forEach((l) => l(s));
  }

  /** Boot PGlite and load the default seed. Idempotent. */
  init(): Promise<void> {
    if (this.bootPromise) return this.bootPromise;
    this.bootPromise = (async () => {
      this.setStatus("Downloading Postgres engine…");
      const { PGlite } = await import("@electric-sql/pglite");
      this.setStatus("Booting Postgres…");
      this.db = (await PGlite.create()) as unknown as PgliteDb;
      this.setStatus("Loading sample data…");
      await this.db.exec(SEEDS[this.currentSeed]);
      this.setStatus("ready");
    })();
    return this.bootPromise;
  }

  /**
   * Make sure the engine holds `seedId`'s data. Reloads only when switching seeds
   * (a seed switch always implies a clean rebuild) or when `force` is set.
   */
  private async ensureSeed(seedId: SeedId, force: boolean): Promise<void> {
    await this.init();
    if (seedId !== this.currentSeed || force) {
      await this.db!.exec(SEEDS[seedId]);
      this.currentSeed = seedId;
    }
  }

  /** Reload a seed, discarding any changes made by previous statements. */
  async reset(seedId?: SeedId): Promise<void> {
    await this.ensureSeed(seedId ?? this.currentSeed, true);
  }

  /**
   * Run one or more SQL statements. Returns the last statement's result set (or the
   * affected-row count for a write). Errors are returned, not thrown, so the UI can
   * render them inline like a real SQL console.
   */
  async exec(sql: string, opts?: { reset?: boolean; seedId?: SeedId }): Promise<SqlExecResult> {
    await this.ensureSeed(opts?.seedId ?? this.currentSeed, !!opts?.reset);
    const notices: string[] = [];
    try {
      const results = await this.db!.exec(sql);
      // Prefer the last statement that produced a result set; else the very last.
      const withRows = [...results].reverse().find((r) => r.fields.length > 0);
      const last = withRows ?? results[results.length - 1];
      if (!last) {
        return {
          ok: true,
          columns: [],
          rows: [],
          affectedRows: 0,
          hasResultSet: false,
          notices,
          error: null,
        };
      }
      const columns = last.fields.map((f) => f.name);
      const rows = last.rows.map((r) => columns.map((c) => r[c]));
      return {
        ok: true,
        columns,
        rows,
        affectedRows: last.affectedRows ?? 0,
        hasResultSet: last.fields.length > 0,
        notices,
        error: null,
      };
    } catch (err) {
      return {
        ok: false,
        columns: [],
        rows: [],
        affectedRows: 0,
        hasResultSet: false,
        notices,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Run a single read query and return result rows as value arrays plus column names.
   * Used by the challenge runner to compare a learner's query to a reference solution.
   */
  async queryRows(
    sql: string,
    seedId?: SeedId,
  ): Promise<{ ok: boolean; columns: string[]; rows: unknown[][]; error: string | null }> {
    await this.ensureSeed(seedId ?? this.currentSeed, false);
    try {
      const res = await this.db!.query(sql);
      const columns = res.fields.map((f) => f.name);
      const rows = res.rows.map((r) => columns.map((c) => r[c]));
      return { ok: true, columns, rows, error: null };
    } catch (err) {
      return {
        ok: false,
        columns: [],
        rows: [],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

// One shared engine for the whole app.
export const sqlClient = new SqlClient();
