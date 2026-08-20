"use client";

import { FormEvent, useEffect, useMemo, useState, Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { POLICY_TYPES, PREMIUM_BPS, POLICY_CAP_BPS, PREMIUM_RATE } from "@/lib/constants";
import { premiumFor, formatUnits, genToWei, weiToGen, maxCoverageWei } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";
import { useGenLayer } from "@/hooks/useGenLayer";
import { useQueryClient } from "@tanstack/react-query";
import { usePendingWrites } from "@/hooks/usePendingWrites";
import { TxHash } from "@/components/shared/TxHash";
import { readContract } from "@/lib/genlayer-client";
import { fetchReserve } from "@/lib/contract-reads";
import { Button } from "@/components/ui/button";
import { Shimmer } from "@/components/ui/Shimmer";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import {
  AIRLINES,
  STORM_LOCATIONS,
  COMPANIES,
  validateEvent,
  type PolicyKind,
} from "@/lib/event-schema";

function NewPolicyForm() {
  const params = useSearchParams();
  const { address, connect, status, switchNetwork } = useWallet();
  const { write } = useGenLayer();
  const qc = useQueryClient();
  const pendingWrites = usePendingWrites();
  const [step, setStep] = useState(1);
  const initialType = (params.get("type") ?? "flight_delay") as PolicyKind;
  const [type, setType] = useState<PolicyKind>(
    ["flight_delay", "storm", "bankruptcy"].includes(initialType)
      ? initialType
      : "flight_delay",
  );
  const [coverage, setCoverage] = useState(1);
  const [airline, setAirline] = useState<string>("BA");
  const [flightNum, setFlightNum] = useState("249");
  const [date, setDate] = useState("2026-08-01");
  const [hours, setHours] = useState(3);
  const [location, setLocation] = useState("MIA");
  const [wind, setWind] = useState(80);
  const [company, setCompany] = useState("AAPL");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: ReactNode } | null>(
    null,
  );
  const [onChainBps, setOnChainBps] = useState<Record<string, number>>(PREMIUM_BPS);
  const [poolBalanceWei, setPoolBalanceWei] = useState<bigint | null>(null);
  const [limitsError, setLimitsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [bpsRaw, reserve] = await Promise.all([
          readContract<Record<string, unknown>>("get_premium_bps", []).catch(() => null),
          fetchReserve(),
        ]);
        if (cancelled) return;
        if (bpsRaw) {
          const next: Record<string, number> = { ...PREMIUM_BPS };
          for (const k of Object.keys(PREMIUM_BPS)) {
            const n = Number(bpsRaw[k]);
            if (Number.isFinite(n) && n > 0) next[k] = n;
          }
          setOnChainBps(next);
        }
        setPoolBalanceWei(reserve.contract_balance);
        setLimitsError(null);
      } catch {
        if (!cancelled) {
          setLimitsError("Could not load pool cap from the contract. Coverage is limited until this succeeds.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const meta = POLICY_TYPES.find((p) => p.id === type) ?? POLICY_TYPES[0];
  const rateBps = onChainBps[type] ?? meta.rateBps;
  const rateFrac = PREMIUM_RATE[type] ?? rateBps / 10_000;
  const maxCoverageWeiValue = useMemo(
    () => (poolBalanceWei == null ? null : maxCoverageWei(poolBalanceWei, POLICY_CAP_BPS)),
    [poolBalanceWei],
  );
  const maxCoverageGen = useMemo(() => {
    if (maxCoverageWeiValue == null) return 1;
    const g = Math.floor(weiToGen(maxCoverageWeiValue) * 100) / 100;
    return Math.max(0, g);
  }, [maxCoverageWeiValue]);

  useEffect(() => {
    if (maxCoverageWeiValue == null) return;
    setCoverage((prev) => {
      const cap = maxCoverageGen;
      if (cap < 0.01) return 0;
      const next = Math.min(prev, cap);
      return next > 0 ? next : Math.min(1, cap);
    });
  }, [maxCoverageGen, maxCoverageWeiValue]);

  const coverageWei = useMemo(() => genToWei(coverage), [coverage]);
  const requiredPremium = useMemo(
    () => premiumFor(coverageWei, rateBps),
    [coverageWei, rateBps],
  );
  const overCap =
    maxCoverageWeiValue != null && coverageWei > maxCoverageWeiValue;
  const poolTooSmall = maxCoverageWeiValue != null && maxCoverageWeiValue === 0n;

  const onCoverageChange = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    const capped = maxCoverageWeiValue == null ? raw : Math.min(raw, maxCoverageGen);
    setCoverage(Math.max(0, capped));
  };

  const built = useMemo(() => {
    if (type === "flight_delay") {
      return validateEvent(type, {
        flight: `${airline}${flightNum}`,
        date,
        hours,
      });
    }
    if (type === "storm") {
      return validateEvent(type, { location, date, wind_kmh: wind });
    }
    return validateEvent(type, { company, date });
  }, [type, airline, flightNum, date, hours, location, wind, company]);

  const handlePurchase = async (e: FormEvent) => {
    e.preventDefault();
    if (!built.ok) {
      setToast({ type: "error", message: built.error });
      return;
    }
    if (poolTooSmall) {
      setToast({ type: "error", message: "Pool has no capacity for a new policy yet. Fund the pool first." });
      return;
    }
    if (overCap || coverageWei <= 0n) {
      setToast({
        type: "error",
        message: `Coverage exceeds the 1% policy cap (${formatUnits(maxCoverageGen)} GEN max).`,
      });
      return;
    }
    if (status === "wrong_network") {
      try {
        await switchNetwork();
      } catch {
        setToast({
          type: "error",
          message: "Switch to GenLayer Studio (61999) first",
        });
        return;
      }
    }
    if (!address) {
      await connect();
      return;
    }
    const value = requiredPremium;
    if (value !== premiumFor(coverageWei, rateBps)) {
      setToast({ type: "error", message: "Premium drifted; refresh and try again." });
      return;
    }
    pendingWrites.begin();
    try {
      const hash = await write.mutateAsync({
        method: "purchase_policy",
        args: [type, coverageWei, built.payload],
        value,
      });
      setToast({
        type: "success",
        message: (
          <span>
            Submitted on-chain: <TxHash hash={hash} className="text-mint" />
          </span>
        ),
      });
      await qc.invalidateQueries({ queryKey: ["policies"] });
      await qc.invalidateQueries({ queryKey: ["stats"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction rejected or failed";
      setToast({ type: "error", message: msg });
    } finally {
      pendingWrites.end();
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <AnimatedSection>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">New Policy</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Parametric cover is underwritten by the on-chain pool. Claims pay only after
          oracle consensus and only if the pool has liquidity.
        </p>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <div className="mt-8 flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step >= s
                    ? "bg-brand text-white"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`h-0.5 w-12 rounded-full transition-colors ${
                    step > s ? "bg-brand" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <form onSubmit={handlePurchase} className="mt-8 space-y-6">
          {step === 1 ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="ptype">
                Policy Type
              </label>
              <select
                id="ptype"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={type}
                onChange={(e) => setType(e.target.value as PolicyKind)}
              >
                {POLICY_TYPES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {step === 2 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="coverage">
                  Coverage Amount ({formatUnits(coverage)} GEN)
                </label>
                <input
                  id="coverage"
                  type="range"
                  min={0}
                  max={Math.max(maxCoverageGen, 0.01)}
                  step={maxCoverageGen >= 10 ? 1 : 0.01}
                  className="mt-2 w-full accent-brand"
                  value={Math.min(coverage, Math.max(maxCoverageGen, 0))}
                  onChange={(e) => onCoverageChange(Number(e.target.value))}
                  disabled={poolBalanceWei == null || poolTooSmall}
                />
                <input
                  id="coverage-num"
                  type="number"
                  min={0}
                  max={maxCoverageGen}
                  step={maxCoverageGen >= 10 ? 1 : 0.01}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                  value={coverage}
                  onChange={(e) => onCoverageChange(Number(e.target.value))}
                  disabled={poolBalanceWei == null || poolTooSmall}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Max coverage is 1% of pool balance
                  {poolBalanceWei != null
                    ? ` (${formatUnits(weiToGen(poolBalanceWei))} GEN pool → ${formatUnits(maxCoverageGen)} GEN cap)`
                    : " (loading from contract…)"}
                  . Required premium:{" "}
                  <span className="font-semibold text-brand">
                    {formatUnits(requiredPremium)} GEN
                  </span>{" "}
                  ({(rateFrac * 100).toFixed(0)}% / {rateBps} bps).
                </p>
                {limitsError ? (
                  <p role="alert" className="mt-1 text-xs text-amber-600">
                    {limitsError}
                  </p>
                ) : null}
                {overCap || poolTooSmall ? (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {poolTooSmall
                      ? "Pool cap is zero. Fund the pool before buying cover."
                      : "This coverage would revert with policy_cap_exceeded."}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium" htmlFor="event-date">
                  Event date
                </label>
                <input
                  id="event-date"
                  type="date"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              {type === "flight_delay" ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium" htmlFor="airline">
                      Airline
                    </label>
                    <select
                      id="airline"
                      className="mt-2 w-full rounded-xl border px-3 py-3 dark:bg-slate-800"
                      value={airline}
                      onChange={(e) => setAirline(e.target.value)}
                    >
                      {AIRLINES.map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium" htmlFor="fnum">
                      Number
                    </label>
                    <input
                      id="fnum"
                      inputMode="numeric"
                      pattern="[0-9]{1,4}"
                      maxLength={4}
                      className="mt-2 w-full rounded-xl border px-3 py-3 dark:bg-slate-800"
                      value={flightNum}
                      onChange={(e) => setFlightNum(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium" htmlFor="hours">
                      Delay hrs
                    </label>
                    <input
                      id="hours"
                      type="number"
                      min={1}
                      max={48}
                      className="mt-2 w-full rounded-xl border px-3 py-3 dark:bg-slate-800"
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                    />
                  </div>
                </div>
              ) : null}
              {type === "storm" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium" htmlFor="loc">
                      Location
                    </label>
                    <select
                      id="loc"
                      className="mt-2 w-full rounded-xl border px-3 py-3 dark:bg-slate-800"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      {STORM_LOCATIONS.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium" htmlFor="wind">
                      Wind km/h
                    </label>
                    <input
                      id="wind"
                      type="number"
                      min={40}
                      max={300}
                      className="mt-2 w-full rounded-xl border px-3 py-3 dark:bg-slate-800"
                      value={wind}
                      onChange={(e) => setWind(Number(e.target.value))}
                    />
                  </div>
                </div>
              ) : null}
              {type === "bankruptcy" ? (
                <div>
                  <label className="block text-sm font-medium" htmlFor="co">
                    Company
                  </label>
                  <select
                    id="co"
                    className="mt-2 w-full rounded-xl border px-3 py-3 dark:bg-slate-800"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  >
                    {COMPANIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              {!built.ok ? (
                <p role="alert" className="text-sm text-red-600">
                  {built.error}
                </p>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold text-slate-900 dark:text-white">Review</h3>
              <dl className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500">Type</dt>
                  <dd className="text-sm font-medium">{meta.title}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500">Coverage</dt>
                  <dd className="text-sm font-medium">{formatUnits(coverage)} GEN</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500">Pool cap (1%)</dt>
                  <dd className="text-sm font-medium">{formatUnits(maxCoverageGen)} GEN</dd>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <dt className="text-sm text-slate-500">Premium due (tx value)</dt>
                  <dd className="text-lg font-bold text-brand">{formatUnits(requiredPremium)} GEN</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-slate-500">
                Payouts are automated parametric transfers subject to pool liquidity and
                oracle consensus. Wallet: {status}. You sign in-browser; the API never holds a key.
              </p>
            </div>
          ) : null}

          <div className="flex gap-3">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : null}
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 2 && !built.ok) {
                    setToast({ type: "error", message: built.error });
                    return;
                  }
                  if (step === 2 && (overCap || poolTooSmall || coverageWei <= 0n)) {
                    setToast({
                      type: "error",
                      message: "Coverage is outside the on-chain 1% policy cap.",
                    });
                    return;
                  }
                  setStep(step + 1);
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={
                  write.isPending ||
                  status === "wrong_network" ||
                  overCap ||
                  poolTooSmall ||
                  coverageWei <= 0n ||
                  poolBalanceWei == null
                }
              >
                {write.isPending ? "Signing…" : "Purchase Policy"}
              </Button>
            )}
          </div>

          {toast && (
            <div
              role="alert"
              className={`rounded-xl p-4 text-sm ${
                toast.type === "success"
                  ? "bg-mint/10 text-mint border border-mint/20"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {toast.message}
            </div>
          )}
        </form>
      </AnimatedSection>
    </div>
  );
}

export default function NewPolicyPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12">
          <Shimmer className="h-96" />
        </div>
      }
    >
      <NewPolicyForm />
    </Suspense>
  );
}
