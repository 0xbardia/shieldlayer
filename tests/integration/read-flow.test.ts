import { describe, expect, it } from "vitest";
import { CONTRACT_METHODS } from "../../src/lib/contract-abi";
import { writeContract } from "../../src/lib/genlayer-client";
import { CONTRACT_ADDRESS } from "../../src/lib/constants";

describe("integration contracts", () => {
  it("frontend knows view methods used by backend", () => {
    expect(CONTRACT_METHODS.get_stats.type).toBe("view");
    expect(CONTRACT_METHODS.purchase_policy.type).toBe("write");
  });
  it("refuses writes when the contract is undeployed", async () => {
    if (!/^0x0{40}$/i.test(CONTRACT_ADDRESS)) return;
    await expect(
      writeContract({
        functionName: "purchase_policy",
        args: [],
        address: "0x1",
        signMessage: async () => "0x",
      }),
    ).rejects.toThrow(/Network unavailable/);
  });
});
