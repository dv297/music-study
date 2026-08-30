import { expect, test } from "@playwright/test";

// The ?mode= param (root + mode-quality id, e.g. "D:dorian" — see modeId()
// in src/lib/modes.ts) pins the opening prompt so these assertions don't
// have to account for whatever mode a random draw would have produced.

test("answering every note correctly", async ({ page }) => {
  await page.goto("/#/exercise/modes?mode=D:dorian");

  await expect(page.locator(".chord-symbol")).toHaveText("D Dorian");

  for (const note of ["D4", "E4", "F4", "G4", "A4", "B4", "C5"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
});

test("leaving out a note reports it as missing, with a retry available", async ({ page }) => {
  await page.goto("/#/exercise/modes?mode=D:dorian");

  for (const note of ["D4", "E4", "F4", "G4", "A4", "B4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Not quite");
  await expect(page.locator(".verdict")).toContainText("missed 1 note");

  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.locator(".verdict")).not.toContainText("Not quite");

  for (const note of ["D4", "E4", "F4", "G4", "A4", "B4", "C5"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
});

test("a different mode from the same root is spelled differently", async ({ page }) => {
  await page.goto("/#/exercise/modes?mode=C:lydian");

  await expect(page.locator(".chord-symbol")).toHaveText("C Lydian");

  for (const note of ["C4", "D4", "E4", "F#4", "G4", "A4", "B4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
});

test("a forced mode outside a customized quality setting still pins correctly", async ({ page }) => {
  // Simulates a returning visitor who has disabled every quality but
  // dorian — exactly the case where the settings-reconcile effect could
  // mistake a valid pinned prompt for a stale one and redraw it.
  await page.addInitScript(() => {
    localStorage.setItem("music-study:modes:qualityIds", JSON.stringify(["dorian"]));
  });
  await page.goto("/#/exercise/modes?mode=C:lydian");

  await expect(page.locator(".chord-symbol")).toHaveText("C Lydian");
});

test("an unrecognized mode param falls back to a normal prompt instead of breaking", async ({ page }) => {
  await page.goto("/#/exercise/modes?mode=not-a-real-mode");

  await expect(page.locator(".chord-symbol")).not.toBeEmpty();
  await expect(page.getByRole("button", { name: "Check" })).toBeVisible();
});
