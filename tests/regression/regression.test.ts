import { describe, expect, it } from "vitest";
import { CONTRACT_METHODS } from "../../src/lib/contract-abi";

describe("regression", () => {
  it("ABI catalog still lists get_stats", () => {
    expect(CONTRACT_METHODS.get_stats).toBeTruthy();
  });
  it("file_claim remains a write", () => {
    expect(CONTRACT_METHODS.file_claim.type).toBe("write");
  });
});
