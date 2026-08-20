"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const qs = [
  {
    q: "Who holds private keys?",
    a: "Nobody on the server. You sign writes in MetaMask.",
  },
  {
    q: "How are claims verified?",
    a: "Validators run genlayer.nondet.web + exec_prompt under run_nondet.",
  },
  {
    q: "What is the confidence threshold?",
    a: "0.7. Below that the claim is rejected.",
  },
  {
    q: "Can I file twice?",
    a: "No. Duplicate claims revert.",
  },
  {
    q: "What if the pool is thin?",
    a: "Approved claims go pending until the pool covers payout.",
  },
  {
    q: "Which policy types exist?",
    a: "flight_delay, storm, bankruptcy.",
  },
  {
    q: "Is event_data validated?",
    a: "Yes. Malformed JSON reverts purchase.",
  },
  {
    q: "Where is the contract?",
    a: "Deployed via GenLayer Studio. Address is in the footer and /api/health.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section-narrow">
      <AnimatedSection>
        <div className="text-center">
          <span className="label text-brand">FAQ</span>
          <h2 className="heading-section mt-3 text-slate-900 dark:text-white">
            Common questions
          </h2>
        </div>
      </AnimatedSection>

      <div className="mt-10 space-y-2">
        {qs.map((item, i) => (
          <AnimatedSection key={item.q} delay={i * 0.04}>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-slate-900 dark:text-white">{item.q}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {open === i ? "−" : "+"}
                </span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
