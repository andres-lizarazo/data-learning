import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Changing this value (e.g. the route path) resets the boundary so navigation recovers. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

// Catches render-time throws from any lazy page or from malformed lesson data, so a single
// bad component shows a recoverable panel instead of white-screening the whole app.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    // A route change (new resetKey) clears a prior error so the next page can render.
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="glass p-8">
          <div className="mb-3 text-3xl">😵</div>
          <h1 className="mb-2 text-lg font-semibold text-slate-100">
            Something broke on this page
          </h1>
          <p className="mb-4 text-sm text-slate-400">
            The rest of the app is fine — try going back, or reload this view. Your progress
            is saved locally.
          </p>
          <pre className="mb-5 overflow-auto rounded-lg border border-brand-red/40 bg-brand-red/10 px-3 py-2 text-left font-mono text-xs text-brand-red">
            {error.message}
          </pre>
          <button className="btn-primary mx-auto" onClick={() => window.location.reload()}>
            <RotateCcw className="h-4 w-4" /> Reload
          </button>
        </div>
      </div>
    );
  }
}
