import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { useStats } from "@/hooks/useStats";
import { formatUnits } from "@/lib/utils";

// Custom SVG icons
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
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

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" />
    </svg>
  );
}

export function ProtocolShowcase() {
  const { data: stats } = useStats();

  return (
    <section className="section border-t border-slate-200 dark:border-slate-800">
      <AnimatedSection>
        <div className="max-w-2xl">
          <span className="label text-brand">Protocol specs</span>
          <h2 className="heading-section mt-3 text-slate-900 dark:text-white">
            Built for builders
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            The technical foundation underneath the UI.
          </p>
        </div>
      </AnimatedSection>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnimatedSection delay={0.1}>
          <div className="card-flat flex flex-col">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand dark:bg-brand-900/20">
                <ShieldIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Active Coverage</p>
                <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {stats?.total_policies ?? 0}
                </p>
              </div>
            </div>
            <div className="mt-4 flex-1 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Pool Balance</span>
                <span className="font-mono font-semibold">{formatUnits(stats?.premium_pool ?? 0)} GEN</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Claims Processed</span>
                <span className="font-mono font-semibold">{stats?.total_claims ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Approved Claims</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{stats?.approved_claims ?? 0}</span>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="card-flat flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                <ZapIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Settlement</p>
                <p className="text-2xl font-bold tabular-nums">&lt; 2 min</p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <div className="card-flat flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <LockIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Security Model</p>
                <p className="text-2xl font-bold tabular-nums">0 keys</p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.3}>
          <div className="card-flat flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-400">
                <ClockIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Oracle Response</p>
                <p className="text-2xl font-bold tabular-nums">~30s</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
