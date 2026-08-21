"use client";

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function formatAge(totalSec: number): string {
  if (totalSec < 5) return "just now";
  if (totalSec < 60) return `${totalSec}s ago`;
  if (totalSec < 3600) return `${Math.floor(totalSec / 60)}m ago`;
  if (totalSec < 86400) return `${Math.floor(totalSec / 3600)}h ago`;
  return `${Math.floor(totalSec / 86400)}d ago`;
}

export function RefreshBar({ secondsAgo, onRefresh, isLoading }: { secondsAgo?: number | null; onRefresh?: () => void; isLoading?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
      <span className="text-slate-500 dark:text-slate-400">
        {secondsAgo != null ? `Updated ${formatAge(secondsAgo)}` : "Auto-refresh: 15s"}
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2 text-brand hover:text-brand-600 dark:hover:text-brand-400 transition-colors disabled:opacity-50"
      >
        <RefreshIcon className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>
  );
}
