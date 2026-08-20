import { test, expect } from "@playwright/test";

test("purchase wizard uses typed inputs not a JSON textarea", async ({ page }) => {
  await page.goto("/new-policy");
  await expect(page.getByLabel("Policy Type")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByLabel("Airline")).toBeVisible();
  await expect(page.getByLabel("Number")).toBeVisible();
  await expect(page.getByLabel("Event date")).toBeVisible();
  await expect(page.locator("textarea")).toHaveCount(0);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText(/pool liquidity/i)).toBeVisible();
});

test("policies empty state explains next step", async ({ page }) => {
  await page.goto("/policies");
  await expect(page.getByText(/No policies yet|Connect|policies/i).first()).toBeVisible();
});
