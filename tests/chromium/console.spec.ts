import { test, expect } from "@playwright/test";

test("no unexpected console errors on landing", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  const res = await page.goto("/");
  expect(res?.ok()).toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
  const ignored = errors.filter(
    (e) =>
      e.includes("Failed to load resource") ||
      e.includes("net::ERR") ||
      e.toLowerCase().includes("hydration"),
  );
  expect(errors.filter((e) => !ignored.includes(e))).toEqual([]);
});
