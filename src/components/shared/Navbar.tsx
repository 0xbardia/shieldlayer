"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { WalletConnect } from "./WalletConnect";
import { useI18n } from "@/i18n/provider";
import { Logo } from "@/components/ui/Logo";

export function Navbar() {
  const { locale, setLocale, t, dir } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 shadow-soft"
          : "bg-transparent"
      }`}
      dir={dir}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <Logo className="h-8 w-8" />
          <span className="text-lg font-bold">ShieldLayer</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Primary">
          {[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/explorer", label: "Explorer" },
            { href: "/portfolio", label: "Portfolio" },
            { href: "/policies", label: t("nav.policies") },
            { href: "/claims", label: t("nav.claims") },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative rounded-lg px-3 py-2 text-slate-600 hover:text-brand focus-visible:text-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-lg hover:bg-brand-50 dark:text-slate-300 dark:hover:text-brand dark:hover:bg-brand-950/30 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setLocale(locale === "en" ? "fa" : "en")}
            aria-label="Toggle language"
          >
            {locale === "en" ? "فا" : "EN"}
          </button>
          <ThemeToggle />
          <button
            type="button"
            className="rounded-lg p-2 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-expanded={open}
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <WalletConnect />
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:hidden"
            aria-label="Mobile"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/explorer", label: "Explorer" },
                { href: "/portfolio", label: "Portfolio" },
                { href: "/policies", label: t("nav.policies") },
                { href: "/claims", label: t("nav.claims") },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
