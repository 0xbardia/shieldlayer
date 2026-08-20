import { test, expect } from "@playwright/test";

test("landing loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading").first()).toBeVisible();
  await expect(page.getByText("Get Insured").first()).toBeVisible();
});

test("routes are reachable", async ({ page }) => {
  for (const path of ["/", "/dashboard", "/policies", "/claims", "/new-policy"]) {
    const res = await page.goto(path);
    expect(res?.ok()).toBeTruthy();
  }
});
