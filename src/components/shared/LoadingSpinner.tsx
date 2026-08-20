export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`}
    />
  );
}
