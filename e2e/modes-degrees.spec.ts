import { expect, test } from "@playwright/test";

// The ?mode= param is just the mode-quality id (no root — degree alterations
// don't depend on one, see modeDegreeAlterations() in src/lib/modes.ts), so
// these assertions don't have to account for whatever mode a random draw
// would have produced.

test("no keyboard is shown — just the three degree rows", async ({ page }) => {
  await page.goto("/#/exercise/modes-degrees?mode=dorian");

  await expect(page.locator(".piano")).toHaveCount(0);
  await expect(page.locator(".degree-grid")).toBeVisible();
  await expect(page.getByRole("button", { name: "Degree 1 sharp" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Degree 1 flat" })).toBeVisible();
});

test("submitting the correct formula for Dorian", async ({ page }) => {
  await page.goto("/#/exercise/modes-degrees?mode=dorian");

  await expect(page.locator(".chord-symbol")).toHaveText("Dorian");

  await page.getByRole("button", { name: "Degree 3 flat" }).click();
  await page.getByRole("button", { name: "Degree 7 flat" }).click();
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
});

test("pressing sharp then flat on the same degree swaps rather than stacks", async ({ page }) => {
  await page.goto("/#/exercise/modes-degrees?mode=lydian");

  const sharp4 = page.getByRole("button", { name: "Degree 4 sharp" });
  const flat4 = page.getByRole("button", { name: "Degree 4 flat" });

  await flat4.click();
  await expect(flat4).toHaveAttribute("aria-pressed", "true");

  await sharp4.click();
  await expect(sharp4).toHaveAttribute("aria-pressed", "true");
  await expect(flat4).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".verdict")).toContainText("Correct.");
});

test("a wrong answer names the degrees to fix and offers a retry", async ({ page }) => {
  await page.goto("/#/exercise/modes-degrees?mode=dorian");

  // Leave everything natural — Dorian needs the 3rd and 7th flatted.
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Not quite");
  await expect(page.locator(".verdict")).toContainText("degree 3 should be ♭");
  await expect(page.locator(".verdict")).toContainText("degree 7 should be ♭");

  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.locator(".verdict")).not.toContainText("Not quite");

  await page.getByRole("button", { name: "Degree 3 flat" }).click();
  await page.getByRole("button", { name: "Degree 7 flat" }).click();
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
});

test("there is no auto-submit setting", async ({ page }) => {
  await page.goto("/#/exercise/modes-degrees?mode=dorian");

  await page.click("summary");
  await expect(page.getByText("Check automatically once enough notes are selected")).toHaveCount(0);
});

test("a forced mode outside a customized quality setting still pins correctly", async ({ page }) => {
  // Simulates a returning visitor who has disabled every quality but
  // dorian — exactly the case where the settings-reconcile effect could
  // mistake a valid pinned prompt for a stale one and redraw it.
  await page.addInitScript(() => {
    localStorage.setItem("music-study:modes-degrees:qualityIds", JSON.stringify(["dorian"]));
  });
  await page.goto("/#/exercise/modes-degrees?mode=lydian");

  await expect(page.locator(".chord-symbol")).toHaveText("Lydian");
});

test("an unrecognized mode param falls back to a normal prompt instead of breaking", async ({ page }) => {
  await page.goto("/#/exercise/modes-degrees?mode=not-a-real-mode");

  await expect(page.locator(".chord-symbol")).not.toBeEmpty();
  await expect(page.getByRole("button", { name: "Check" })).toBeVisible();
});
