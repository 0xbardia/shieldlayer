export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`shimmer rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-800 p-5 ${className}`}>
      <div className="shimmer h-4 w-1/3 rounded mb-4" />
      <div className="shimmer h-3 w-full rounded mb-2" />
      <div className="shimmer h-3 w-2/3 rounded" />
    </div>
  );
}
