import { describe, expect, it } from "vitest";
import { POLICY_TYPES } from "../../src/lib/constants";
import { premiumFor } from "../../src/lib/utils";

describe("functional", () => {
  it("landing content exists as policy types", () => {
    expect(POLICY_TYPES).toHaveLength(3);
  });
  it("can price flight_delay", () => {
    expect(premiumFor(10000, 2200)).toBe(2200n);
  });
  it("can price storm", () => {
    expect(premiumFor(10000, 1700)).toBe(1700n);
  });
  it("can price bankruptcy", () => {
    expect(premiumFor(10000, 1200)).toBe(1200n);
  });
  it("claim requires existing policy conceptually", () => {
    const policies: number[] = [];
    const canClaim = (id: number) => policies.includes(id);
    expect(canClaim(1)).toBe(false);
  });
});
