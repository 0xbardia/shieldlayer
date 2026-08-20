import { AnimatedSection } from "@/components/ui/AnimatedSection";

// Custom SVG icons — unique to ShieldLayer
function AiOracleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" strokeLinecap="round" />
      <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}

function ConsensusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="12" r="3" />
      <circle cx="12" cy="6" r="3" />
      <path d="M6 12l6-6m0 0l6 6" strokeLinecap="round" />
    </svg>
  );
}

function SettlementIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M16 14a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" />
      <path d="M2 10h20" strokeLinecap="round" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function TransparencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

const items = [
  {
    icon: AiOracleIcon,
    title: "AI-verified claims",
    body: "Validators fetch the web and score claims with greyboxed models. Two structured feeds must agree before payout.",
    color: "text-brand",
    bg: "bg-brand-50 dark:bg-brand-900/20",
  },
  {
    icon: ConsensusIcon,
    title: "Decentralized consensus",
    body: "Optimistic Democracy. No single oracle or claims desk decides.",
    color: "text-accent",
    bg: "bg-accent-50 dark:bg-accent-900/20",
  },
  {
    icon: SettlementIcon,
    title: "Automated settlement",
    body: "Approved claims transfer native value if the pool clears the reserve check. No manual wiring.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    icon: WalletIcon,
    title: "Wallet-signed writes",
    body: "You sign in-browser. The API is read-only and never holds a key.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    icon: LayersIcon,
    title: "Multi-policy protocol",
    body: "Flight delay, storm, and bankruptcy — one contract, three coverage types.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/20",
  },
  {
    icon: TransparencyIcon,
    title: "Fully transparent",
    body: "Every policy, claim, and confidence score lives on-chain. Look it up yourself in the Explorer.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20",
  },
];

export function Features() {
  return (
    <section className="section">
      <AnimatedSection>
        <div className="max-w-2xl">
          <span className="label text-brand">Protocol primitives</span>
          <h2 className="heading-section mt-3 text-slate-900 dark:text-white">
            Built like a clearing house
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Six primitives. No claims adjuster. No private keys on the server.
          </p>
        </div>
      </AnimatedSection>

      {/* Unique: Asymmetric grid with varied card treatments */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <AnimatedSection key={item.title} delay={i * 0.06}>
              <article
                className={`group flex h-full flex-col ${
                  i === 0 ? "card-highlight" : "card"
                }`}
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${item.bg} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.body}
                </p>
              </article>
            </AnimatedSection>
          );
        })}
      </div>
    </section>
  );
}
