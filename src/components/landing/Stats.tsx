"use client";

import { useStats } from "@/hooks/useStats";
import { formatUnits } from "@/lib/utils";
import { Shimmer } from "@/components/ui/Shimmer";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

// Custom SVG icons
function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function BanknoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 6v12m12-12v12" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6m0-6l6 6" />
    </svg>
  );
}

export function Stats() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <section className="section-compact border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Shimmer key={i} className="h-24" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="section-compact border-t border-slate-200 dark:border-slate-800">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AnimatedSection delay={0}>
          <div className="card-flat">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="h-5 w-5 text-brand" />
              <div>
                <p className="text-xs text-slate-400">Active Policies</p>
                <p className="text-2xl font-bold tabular-nums">{stats?.total_policies ?? 0}</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
        <AnimatedSection delay={0.05}>
          <div className="card-flat">
            <div className="flex items-center gap-3">
              <BanknoteIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400">Pool Balance</p>
                <p className="text-2xl font-bold tabular-nums">{formatUnits(stats?.premium_pool ?? 0)} GEN</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
        <AnimatedSection delay={0.1}>
          <div className="card-flat">
            <div className="flex items-center gap-3">
              <FileTextIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs text-slate-400">Claims Processed</p>
                <p className="text-2xl font-bold tabular-nums">{stats?.total_claims ?? 0}</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
        <AnimatedSection delay={0.15}>
          <div className="card-flat">
            <div className="flex items-center gap-3">
              <XCircleIcon className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-slate-400">Rejected Claims</p>
                <p className="text-2xl font-bold tabular-nums">{stats?.rejected_claims ?? 0}</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
