import { createRouter, useRouter } from "@tanstack/react-router";
import { Component, type ReactNode, useEffect } from "react";
import { routeTree } from "./routeTree.gen";

// ── React Error Boundary for invariant crashes ────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We encountered an unexpected error. Your data is safe.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Reload page
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const errorMsg = error?.message || "";

  useEffect(() => {
    // Auto-retry on chunk/module loading failures
    if (
      /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|dynamically/i.test(
        errorMsg,
      )
    ) {
      try {
        const lastReload = sessionStorage.getItem("last_chunk_reload");
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem("last_chunk_reload", now.toString());
          window.location.reload();
        }
      } catch {}
    }
  }, [errorMsg]);

  // Check if it's a rate limit error
  const isRateLimited =
    errorMsg.includes("429") ||
    errorMsg.includes("Too Many") ||
    errorMsg.includes("rate limit");

  // Check if it's an invariant / assertion error (React internal)
  const isInvariantError =
    errorMsg.includes("invariant") ||
    errorMsg.includes("Invariant") ||
    errorMsg.includes("minimum") ||
    errorMsg.includes("Maximum update depth");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isRateLimited
            ? "Slow down!"
            : isInvariantError
              ? "Page error"
              : "Something went wrong"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isRateLimited
            ? "You're making too many requests. Please wait a moment and try again."
            : isInvariantError
              ? "A rendering error occurred. Reloading the page usually fixes this."
              : "An unexpected error occurred. Please try again."}
        </p>
        {import.meta.env.DEV && errorMsg && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-muted p-3 text-left font-mono text-xs text-destructive">
            {errorMsg}
          </pre>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const GlobalErrorBoundaryWrapper = GlobalErrorBoundary;

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
