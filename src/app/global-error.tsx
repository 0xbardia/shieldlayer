"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="rounded-2xl border border-red-200 bg-white p-12 shadow-soft dark:border-red-800 dark:bg-slate-900 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
        <p className="mt-1 text-sm font-medium text-brand-600 dark:text-brand-400">ShieldLayer: Protection, On-Chain</p>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
