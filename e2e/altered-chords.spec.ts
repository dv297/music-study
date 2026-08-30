import { expect, test } from "@playwright/test";

// The ?chord= param (root + chord-quality id, e.g. "C:dom9" — see
// alteredChordId() in src/lib/alteredChords.ts) pins the opening prompt so
// these assertions don't have to account for whatever chord a random draw
// would have produced.

test("answering every note correctly", async ({ page }) => {
  await page.goto("/#/exercise/altered-chords?chord=C:dom9");

  await expect(page.locator(".chord-symbol")).toHaveText("C9");

  for (const note of ["C4", "E4", "G4", "A#4", "D4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
});

test("leaving out the 9th reports it as missing", async ({ page }) => {
  await page.goto("/#/exercise/altered-chords?chord=C:dom9");

  for (const note of ["C4", "E4", "G4", "A#4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Not quite");
  await expect(page.locator(".verdict")).toContainText("missed 1 note");
});

test("a wrong answer offers a retry that clears the board for another attempt", async ({ page }) => {
  await page.goto("/#/exercise/altered-chords?chord=C:dom9");

  for (const note of ["C4", "E4", "G4", "A#4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".verdict")).toContainText("Not quite");

  await page.getByRole("button", { name: "Retry" }).click();

  await expect(page.locator(".verdict")).not.toContainText("Not quite");
  await expect(page.getByRole("button", { name: "C4", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Check" })).toBeVisible();

  for (const note of ["C4", "E4", "G4", "A#4", "D4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
});

test("a correct answer does not offer a retry button", async ({ page }) => {
  await page.goto("/#/exercise/altered-chords?chord=C:dom9");

  for (const note of ["C4", "E4", "G4", "A#4", "D4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
});

test("a 13th chord requires the 9th but not the 11th", async ({ page }) => {
  await page.goto("/#/exercise/altered-chords?chord=C:dom13");

  await expect(page.locator(".chord-symbol")).toHaveText("C13");

  for (const note of ["C4", "E4", "G4", "A#4", "D4", "A4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
});

test("a forced chord outside the default quality settings still pins correctly", async ({ page }) => {
  // "dom7sharp9" isn't in the default enabled pool (dom9, maj9, min9, dom13),
  // which is exactly the case where the settings-reconcile effect could
  // mistake a valid pinned prompt for a stale one and redraw it.
  await page.goto("/#/exercise/altered-chords?chord=C:dom7sharp9");

  await expect(page.locator(".chord-symbol")).toHaveText("C7♯9");
});

test("an unrecognized chord param falls back to a normal prompt instead of breaking", async ({ page }) => {
  await page.goto("/#/exercise/altered-chords?chord=not-a-real-chord");

  await expect(page.locator(".chord-symbol")).not.toBeEmpty();
  await expect(page.getByRole("button", { name: "Check" })).toBeVisible();
});
