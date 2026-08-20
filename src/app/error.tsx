"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PageError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-950">
        <h2 className="text-2xl font-semibold text-red-800 dark:text-red-200">
          Page Error
        </h2>
        <p className="mt-1 text-xs font-medium text-red-500">ShieldLayer: Protection, On-Chain</p>
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          This page encountered an error. Please try again.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-red-500">
            Error ID: {error.digest}
          </p>
        )}
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-4 max-w-md overflow-auto rounded bg-red-100 p-3 text-left text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>
          <a
            href="/"
            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
