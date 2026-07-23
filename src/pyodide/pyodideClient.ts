// Main-thread client for the Pyodide worker. Exposes a typed, promise-based API and
// a subscribe-able status string so the UI can show boot/install progress.

export interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  plots: string[]; // base64 PNGs
}

/** A value cell in the reference diagram: a primitive (shown inline) or a heap ref. */
export type DiagramCell =
  | { t: "num" | "str" | "bool" | "none"; v: string }
  | { t: "ref"; id: number };

export interface HeapNode {
  kind: "list" | "tuple" | "dict" | "set";
  /** list/tuple: DiagramCell[]; dict: [keyRepr, DiagramCell][]; set: string[]. */
  items: DiagramCell[] | [string, DiagramCell][] | string[];
  more: number;
}

export interface TraceStep {
  line: number;
  event: "line" | "return";
  func: string;
  depth: number;
  /** Function names currently on the call stack (bottom → top). */
  stack: string[];
  locals: Record<string, { repr: string; kind: string }>;
  /** Variable name → value cell (for the object/reference diagram). */
  refs: Record<string, DiagramCell>;
  /** Heap objects addressed by id (string-keyed in JSON). */
  heap: Record<string, HeapNode>;
  stdout: string;
}

export interface TraceResult {
  steps: TraceStep[];
  stdout: string;
  error: string | null;
  truncated: boolean;
}

type Pending = {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
};

// Inactivity watchdog. The worker posts a status message before every long step (boot,
// each package install), so any real work keeps resetting this timer. Only a truly silent
// worker — e.g. user code stuck in `while True:` — lets it elapse, at which point we reject
// the in-flight call and restart the interpreter instead of hanging the promise forever.
const INACTIVITY_MS = 60_000;

class PyodideClient {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, Pending>();
  private statusListeners = new Set<(s: string) => void>();
  private watchdog: ReturnType<typeof setTimeout> | null = null;

  status = "idle";
  ready = false;

  private ensureWorker() {
    if (this.worker) return;
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg?.type === "status") {
        this.status = msg.message;
        if (msg.message === "ready") this.ready = true;
        this.statusListeners.forEach((l) => l(msg.message));
        this.armWatchdog();
        return;
      }
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.ok) p.resolve(msg.result);
      else p.reject(new Error(msg.error));
      this.armWatchdog();
    };
  }

  private armWatchdog() {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = this.pending.size
      ? setTimeout(() => this.handleTimeout(), INACTIVITY_MS)
      : null;
  }

  private rejectAll(err: Error) {
    this.pending.forEach((p) => p.reject(err));
    this.pending.clear();
  }

  private handleTimeout() {
    this.rejectAll(
      new Error(
        "The Python engine stopped responding (a possible infinite loop). It was restarted — try running again.",
      ),
    );
    this.restart();
  }

  /**
   * Tear down and re-create the worker. Rejects any in-flight calls and emits a "restarted"
   * status so the boot store can re-initialize. Used by the watchdog and available to the UI.
   */
  restart() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
    this.ready = false;
    this.status = "restarted";
    this.rejectAll(new Error("Python engine restarted."));
    this.statusListeners.forEach((l) => l("restarted"));
  }

  private call<T>(type: string, payload?: unknown): Promise<T> {
    this.ensureWorker();
    const id = ++this.seq;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      this.worker!.postMessage({ id, type, payload });
      this.armWatchdog();
    });
  }

  onStatus(listener: (s: string) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /** Boot the interpreter. Safe to call repeatedly; only the first does work. */
  init(): Promise<{ ready: boolean }> {
    return this.call("init");
  }

  installPackages(packages: string[]): Promise<{ installed: string[] }> {
    return this.call("install", { packages });
  }

  runCode(
    code: string,
    opts?: { packages?: string[]; expectPlot?: boolean },
  ): Promise<RunResult> {
    return this.call("run", {
      code,
      packages: opts?.packages ?? [],
      expectPlot: opts?.expectPlot ?? false,
    });
  }

  trace(code: string): Promise<TraceResult> {
    return this.call("trace", { code });
  }
}

// One shared interpreter for the whole app.
export const pyodideClient = new PyodideClient();
