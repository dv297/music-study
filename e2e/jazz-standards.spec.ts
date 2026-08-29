import { expect, test } from "@playwright/test";

// ?standard= picks the tune and ?step= pins the opening chord (see
// standardSteps() in src/lib/standards.ts), so these assertions don't have
// to walk the whole head to reach a known chord.

test("landing on the exercise with no ?standard= offers a picker", async ({ page }) => {
  await page.goto("/#/exercise/jazz-standards");

  await expect(page.getByRole("link", { name: /Misty/ })).toBeVisible();
});

test("picking Misty from the home page starts at its first chord", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: /Misty/ }).click();

  await expect(page.locator(".chord-symbol")).toHaveText("E♭maj7");
  await expect(page.locator(".standard-progress-label")).toContainText("Chord 1 of");
});

test("answering every note correctly advances to the next chord", async ({ page }) => {
  await page.goto("/#/exercise/jazz-standards?standard=misty");

  for (const note of ["D#3", "G3", "A#3", "D4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Correct.");
  await page.getByRole("button", { name: "Next chord" }).click();

  await expect(page.locator(".chord-symbol")).toHaveText("B♭m7");
  await expect(page.locator(".standard-progress-label")).toContainText("Chord 2 of");
});

test("finishing the last chord shows a tune-complete summary", async ({ page }) => {
  await page.goto("/#/exercise/jazz-standards?standard=misty&step=49");

  await expect(page.locator(".chord-symbol")).toHaveText("B♭7");
  await expect(page.locator(".standard-progress-label")).toContainText("1 to go");

  for (const note of ["A#3", "D4", "F4", "G#4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();

  await expect(page.locator(".verdict")).toContainText("Tune complete");
  await expect(page.locator(".standard-progress-label")).toContainText("0 to go");
  await expect(page.getByRole("button", { name: "Start over" })).toBeVisible();
});
