import { describe, expect, it } from "vitest";
import { maxCoverageWei, premiumFor, genToWei } from "../../src/lib/utils";
import { POLICY_CAP_BPS, PREMIUM_BPS, PREMIUM_RATE } from "../../src/lib/constants";

describe("policy purchase limits", () => {
  it("caps coverage at 1% of pool (POLICY_CAP_BPS=100)", () => {
    const pool = 1_011n * 10n ** 18n;
    expect(maxCoverageWei(pool, POLICY_CAP_BPS)).toBe(pool / 100n);
  });

  it("computes flight_delay premium at 2200 bps", () => {
    const cov = genToWei(10);
    expect(premiumFor(cov, PREMIUM_BPS.flight_delay)).toBe((cov * 2200n) / 10_000n);
    expect(PREMIUM_RATE.flight_delay).toBe(0.22);
  });

  it("maps storm and bankruptcy rates", () => {
    expect(PREMIUM_RATE.storm).toBe(0.17);
    expect(PREMIUM_RATE.bankruptcy).toBe(0.12);
  });
});
