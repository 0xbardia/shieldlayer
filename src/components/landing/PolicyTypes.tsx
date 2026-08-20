"use client";

import { useState } from "react";
import { POLICY_TYPES } from "@/lib/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ArrowRightIcon } from "@/components/ui/Icons";

function FlightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 12h17m-17 0l5-10m12 10l-5-10m5 10H3.5" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function StormIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v6m0 4v2m0 4v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l4 4m4-4l4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 14l4 4m4-4l4 4" />
    </svg>
  );
}

function BankruptcyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" strokeLinecap="round" />
      <path d="M10 10v6" strokeLinecap="round" />
      <path d="M14 10v6" strokeLinecap="round" />
    </svg>
  );
}

const icons = {
  flight_delay: FlightIcon,
  storm: StormIcon,
  bankruptcy: BankruptcyIcon,
};

export function PolicyTypes() {
  const [active, setActive] = useState(POLICY_TYPES[0].id);
  const current = POLICY_TYPES.find((p) => p.id === active)!;
  const ActiveIcon = icons[active as keyof typeof icons];

  return (
    <section className="section">
      <AnimatedSection>
        <div className="max-w-2xl">
          <span className="label text-brand">Coverage options</span>
          <h2 className="heading-section mt-3 text-slate-900 dark:text-white">
            Policy types
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Choose the coverage that fits your needs.
          </p>
        </div>
      </AnimatedSection>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {POLICY_TYPES.map((p, i) => {
          const Icon = icons[p.id as keyof typeof icons];
          const isActive = active === p.id;
          return (
            <AnimatedSection key={p.id} delay={i * 0.08}>
              <button
                type="button"
                onClick={() => setActive(p.id)}
                aria-pressed={isActive}
                className={`w-full text-left rounded-2xl p-6 transition-all duration-300 ${
                  isActive
                    ? "card-highlight shadow-md"
                    : "card hover:shadow-soft"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand dark:bg-brand-900/20"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{p.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{p.blurb}</p>
                  </div>
                </div>
              </button>
            </AnimatedSection>
          );
        })}
      </div>

      <AnimatedSection delay={0.3}>
        <div className="mt-8 card-flat p-6">
          <div className="flex items-center gap-3 mb-3">
            <ActiveIcon className="h-5 w-5 text-brand" />
            <span className="label text-slate-400">Example question</span>
          </div>
          <p className="heading-subsection text-slate-900 dark:text-white">{current.example}</p>
          <Link href={`/new-policy?type=${current.id}`} className="mt-6 inline-block">
            <Button>
              Insure this event
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </AnimatedSection>
    </section>
  );
}
