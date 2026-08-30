import { expect, test } from "@playwright/test";

// The ?scale= param (root + scale-quality id, e.g. "C:wholeHalf" — see
// scaleId() in src/lib/scales.ts) pins the opening prompt so these
// assertions don't have to account for whatever scale a random draw would
// have produced.

test("answering every note correctly", async ({ page }) => {
  await page.goto("/#/exercise/diminished-scale?scale=C:wholeHalf");

  await expect(page.locator(".chord-symbol")).toHaveText("C dim (W–H)");

  for (const note of ["C4", "D4", "D#4", "F4", "F#4", "G#4", "A4", "B4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
});

test("leaving out a note reports it as missing, with a retry available", async ({ page }) => {
  await page.goto("/#/exercise/diminished-scale?scale=C:wholeHalf");

  for (const note of ["C4", "D4", "D#4", "F4", "F#4", "G#4", "A4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Not quite");
  await expect(page.locator(".verdict")).toContainText("missed 1 note");

  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.locator(".verdict")).not.toContainText("Not quite");

  for (const note of ["C4", "D4", "D#4", "F4", "F#4", "G#4", "A4", "B4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
});

test("the half-whole form is spelled differently from the same root", async ({ page }) => {
  await page.goto("/#/exercise/diminished-scale?scale=C:halfWhole");

  await expect(page.locator(".chord-symbol")).toHaveText("C dim (H–W)");

  for (const note of ["C4", "C#4", "D#4", "E4", "F#4", "G4", "A4", "A#4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
});

test("a forced scale outside a customized quality setting still pins correctly", async ({ page }) => {
  // Simulates a returning visitor who has disabled every quality but
  // wholeHalf — exactly the case where the settings-reconcile effect could
  // mistake a valid pinned prompt for a stale one and redraw it.
  await page.addInitScript(() => {
    localStorage.setItem("music-study:diminished-scale:qualityIds", JSON.stringify(["wholeHalf"]));
  });
  await page.goto("/#/exercise/diminished-scale?scale=C:halfWhole");

  await expect(page.locator(".chord-symbol")).toHaveText("C dim (H–W)");
});

test("an unrecognized scale param falls back to a normal prompt instead of breaking", async ({ page }) => {
  await page.goto("/#/exercise/diminished-scale?scale=not-a-real-scale");

  await expect(page.locator(".chord-symbol")).not.toBeEmpty();
  await expect(page.getByRole("button", { name: "Check" })).toBeVisible();
});
