import { AnimatedSection } from "@/components/ui/AnimatedSection";

// Custom SVG icons
function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
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

const specs = [
  {
    icon: ShieldIcon,
    label: "Coverage types",
    value: "3",
    detail: "Flight delay · Storm · Bankruptcy",
    color: "text-brand",
    bg: "bg-brand-50 dark:bg-brand-900/20",
  },
  {
    icon: ZapIcon,
    label: "Settlement",
    value: "< 2 min",
    detail: "Automated via oracle consensus",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    icon: LockIcon,
    label: "Security model",
    value: "0 keys",
    detail: "Server never holds private keys",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    icon: ClockIcon,
    label: "Oracle response",
    value: "~30s",
    detail: "Dual-feed validation with tiebreaker",
    color: "text-accent",
    bg: "bg-accent-50 dark:bg-accent-900/20",
  },
];

export function Testimonials() {
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

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {specs.map((s, i) => {
          const Icon = s.icon;
          return (
            <AnimatedSection key={s.label} delay={i * 0.08}>
              <div className="card-flat flex flex-col items-start gap-3 p-5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}
                >
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {s.detail}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          );
        })}
      </div>
    </section>
  );
}
