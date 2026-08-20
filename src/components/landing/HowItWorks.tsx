import { AnimatedSection } from "@/components/ui/AnimatedSection";

// Custom SVG icons
function BuyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M3 12h18" strokeLinecap="round" />
      <path d="M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2" strokeLinecap="round" />
    </svg>
  );
}

function ClaimIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function PayoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

const steps = [
  {
    n: "01",
    title: "Buy a policy",
    description: "Choose a type, coverage, and event. Sign in your wallet.",
    icon: BuyIcon,
  },
  {
    n: "02",
    title: "File a claim",
    description: "Only the beneficiary can file. Duplicates revert.",
    icon: ClaimIcon,
  },
  {
    n: "03",
    title: "AI verifies + payout",
    description: "run_nondet fetches evidence. Confidence ≥ 0.7 pays out.",
    icon: PayoutIcon,
  },
];

export function HowItWorks() {
  return (
    <section className="section-narrow">
      <AnimatedSection>
        <div className="text-center">
          <span className="label text-brand">How it works</span>
          <h2 className="heading-section mt-3 text-slate-900 dark:text-white">
            Three simple steps
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            From purchase to payout — fully automated.
          </p>
        </div>
      </AnimatedSection>

      {/* Unique: Vertical timeline with custom icons */}
      <div className="mt-12 space-y-8">
        {steps.map((step, i) => (
          <AnimatedSection key={step.n} delay={i * 0.1}>
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand dark:bg-brand-900/20">
                  <step.icon className="h-5 w-5" />
                </div>
                {i < steps.length - 1 && (
                  <div className="mt-2 h-full w-px bg-slate-200 dark:bg-slate-700" />
                )}
              </div>
              <div className="flex-1 pb-8">
                <span className="text-sm font-mono text-brand">{step.n}</span>
                <h3 className="heading-subsection mt-1 text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 prose">{step.description}</p>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
