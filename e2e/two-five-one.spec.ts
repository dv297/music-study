import { expect, test } from "@playwright/test";

// ?key= pins the whole ii-V-I to a known key (see findRootByAscii() in
// src/lib/chords.ts), so every chord in the progression is known ahead of
// time instead of only the tonic that's actually shown on screen.

test("?key= pins the progression so the first step is known ahead of time", async ({ page }) => {
  await page.goto("/#/exercise/two-five-one?key=Bb");

  await expect(page.locator(".chord-symbol")).toHaveText("B♭△7");

  // Bb major's ii is Cm7.
  for (const note of ["C3", "D#3", "G3", "A#3"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
  await expect(page.getByRole("button", { name: /Next: V/ })).toBeVisible();
});

test("a wrong step offers a retry without discarding the pinned progression", async ({ page }) => {
  await page.goto("/#/exercise/two-five-one?key=Bb");

  // Missing notes for Cm7 (the ii chord).
  for (const note of ["C3", "D3", "G3"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".verdict")).toContainText("Not quite");

  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.locator(".verdict")).not.toContainText("Not quite");

  for (const note of ["C3", "D#3", "G3", "A#3"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
  await expect(page.getByRole("button", { name: /Next: V/ })).toBeVisible();
});
