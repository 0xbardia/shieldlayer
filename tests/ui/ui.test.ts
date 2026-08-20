import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "../..");

describe("ui", () => {
  it("landing page includes all required sections", () => {
    const page = readFileSync(join(root, "src/app/page.tsx"), "utf8");
    for (const s of [
      "Hero",
      "Features",
      "HowItWorks",
      "Stats",
      "PolicyTypes",
      "Pricing",
      "FAQ",
      "CTA",
      "Footer",
    ]) {
      expect(page).toContain(s);
    }
  });
  it("navbar has wallet and theme", () => {
    const nav = readFileSync(join(root, "src/components/shared/Navbar.tsx"), "utf8");
    expect(nav).toContain("WalletConnect");
    expect(nav).toContain("ThemeToggle");
  });
});
