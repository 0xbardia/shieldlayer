import { describe, expect, it } from "vitest";
import { GENLAYER_NETWORK, CHAIN_ID } from "../../src/lib/constants";
import { truncateAddress } from "../../src/lib/utils";

describe("wallet", () => {
  it("truncates address", () => {
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef12345678")).toMatch(/…/);
  });
  it("genlayer chain id is configured", () => {
    expect(CHAIN_ID).toBe(61999);
    expect(GENLAYER_NETWORK.chainId.toLowerCase()).toBe("0xf22f");
    expect(GENLAYER_NETWORK.chainName).toBe("GenLayer Studio");
  });
  it("wallet connect hook exports wc path", async () => {
    const src = await import("fs").then((fs) =>
      fs.readFileSync("src/hooks/useWallet.ts", "utf8"),
    );
    expect(src).toContain("connectWalletConnect");
    expect(src).toContain("EthereumProvider");
  });
});
