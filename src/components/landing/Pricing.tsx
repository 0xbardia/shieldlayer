"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { POLICY_TYPES } from "@/lib/constants";
import { premiumFor, formatUnits, genToWei } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function Pricing() {
  const [type, setType] = useState(POLICY_TYPES[0].id);
  const [coverage, setCoverage] = useState(10000);
  const meta = POLICY_TYPES.find((p) => p.id === type)!;
  const premium = useMemo(
    () => premiumFor(genToWei(coverage), meta.rateBps),
    [coverage, meta.rateBps],
  );

  return (
    <section className="section" id="pricing">
      <AnimatedSection>
        <div className="max-w-2xl">
          <span className="label text-brand">Transparent pricing</span>
          <h2 className="heading-section mt-3 text-slate-900 dark:text-white">
            Premium calculator
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Flat basis points. No underwriting call. Same math as the contract.
          </p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.15}>
        <div className="mt-10 card-highlight overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-2">
              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  htmlFor="ptype"
                >
                  Policy type
                </label>
                <select
                  id="ptype"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  value={type}
                  onChange={(e) => setType(e.target.value as typeof type)}
                >
                  {POLICY_TYPES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                  htmlFor="cov"
                >
                  Coverage ({formatUnits(coverage)} GEN)
                </label>
                <input
                  id="cov"
                  type="range"
                  min={1000}
                  max={100000}
                  step={500}
                  value={coverage}
                  onChange={(e) => setCoverage(Number(e.target.value))}
                  className="mt-2 w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand dark:bg-slate-700"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1K GEN</span>
                  <span>100K GEN</span>
                </div>
              </div>
              <Link href={`/new-policy?type=${type}&coverage=${coverage}`}>
                <Button className="w-full" size="lg">
                  Get covered
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-col justify-center rounded-xl bg-slate-50 p-6 dark:bg-slate-800/50 lg:col-span-3">
              <p className="label text-slate-400 dark:text-slate-500">
                Estimated premium
              </p>
              <motion.p
                key={premium.toString()}
                initial={{ scale: 0.96, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="mt-3 text-4xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-5xl"
              >
                {formatUnits(premium)}{" "}
                <span className="text-xl font-medium text-slate-400 dark:text-slate-500">
                  GEN
                </span>
              </motion.p>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {(meta.rateBps / 100).toFixed(2)}% of coverage · {meta.example}
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <MiniStat label="Rate" value={`${(meta.rateBps / 100).toFixed(2)}%`} />
                <MiniStat label="BPS" value={String(meta.rateBps)} />
                <MiniStat label="Coverage" value={`${formatUnits(coverage)} GEN`} />
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3 text-center dark:bg-slate-900">
      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
