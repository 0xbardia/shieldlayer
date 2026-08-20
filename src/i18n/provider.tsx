"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const dict = {
  en: {
    "nav.features": "Features",
    "nav.policies": "Policies",
    "nav.claims": "Claims",
    "nav.dashboard": "Dashboard",
    "hero.title": "ShieldLayer",
    "hero.sub":
      "Protection, On-Chain. Buy flight, storm, or bankruptcy insurance. Validators fetch allowlisted evidence, score the claim, and transfer value only after consensus and a reserve check.",
  },
  fa: {
    "nav.features": "ویژگی‌ها",
    "nav.policies": "بیمه‌نامه‌ها",
    "nav.claims": "ادعاها",
    "nav.dashboard": "داشبورد",
    "hero.title": "ShieldLayer",
    "hero.sub":
      "بیمه تأخیر پرواز، طوفان یا ورشکستگی بخرید. اعتبارسنج‌های جن‌لیر وب را می‌خوانند و ادعا را روی زنجیره تسویه می‌کنند.",
  },
} as const;

type Locale = keyof typeof dict;

const Ctx = createContext({
  locale: "en" as Locale,
  dir: "ltr" as "ltr" | "rtl",
  t: (k: string) => k,
  setLocale: (_: Locale) => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const value = useMemo(() => {
    const dir: "ltr" | "rtl" = locale === "fa" ? "rtl" : "ltr";
    const t = (k: string) =>
      (dict[locale] as Record<string, string>)[k] ??
      (dict.en as Record<string, string>)[k] ??
      k;
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "fa" ? "fa" : "en";
      document.documentElement.dir = dir;
    }
    return { locale, dir, t, setLocale };
  }, [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
