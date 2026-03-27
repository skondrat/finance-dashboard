"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Standalone error-state panel (also usable for API / fetch errors)  */
/* ------------------------------------------------------------------ */

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "An unexpected error occurred.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container-low px-8 py-16 text-center">
      {/* Circle-X icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        fill="none"
        className="mb-6 h-12 w-12 text-on-surface-variant"
        aria-hidden="true"
      >
        <circle
          cx="24"
          cy="24"
          r="22"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <line
          x1="16"
          y1="16"
          x2="32"
          y2="32"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="32"
          y1="16"
          x2="16"
          y2="32"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      <h2 className="font-display text-lg text-on-surface">
        Something went wrong
      </h2>

      <p className="mt-2 max-w-md font-mono text-sm text-on-surface-variant">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 font-display text-sm text-on-primary transition-opacity hover:opacity-80"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Class-based error boundary (React 18 pattern)                     */
/* ------------------------------------------------------------------ */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorState
          message={this.state.error?.message}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
