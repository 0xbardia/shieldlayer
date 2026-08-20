"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

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

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-32">
        <div className="grid items-start gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-3">
            <AnimatedSection>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                GenLayer Studio · Chain 61999
              </div>

              <h1 className="heading-display text-slate-900 dark:text-white">
                Insurance that
                <br />
                pays itself.
              </h1>

              <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                Parametric coverage verified by AI oracles. No adjusters, no
                claims desk. File a claim, get paid — if the data says so.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/new-policy">
                  <Button size="lg">
                    Get covered
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">
                    View dashboard
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldIcon className="h-4 w-4 text-emerald-500" />
                  No private keys on server
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
                <span className="flex items-center gap-1.5">
                  <FlightIcon className="h-4 w-4 text-brand" />
                  Flight delay coverage
                </span>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
                <span className="flex items-center gap-1.5">
                  <StormIcon className="h-4 w-4 text-amber-500" />
                  Storm protection
                </span>
              </div>
            </AnimatedSection>
          </div>

          <div className="lg:col-span-2">
            <AnimatedSection delay={0.15}>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <span className="label text-slate-400 dark:text-slate-500">
                    Live Protocol Data
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    auto-refresh
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
                <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-between text-sm font-medium text-brand hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    Full dashboard
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
}
