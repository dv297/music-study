import { expect, test } from "@playwright/test";

// Every exercise gets a "Tutorial" accordion below its Settings accordion.
// These checks don't assert on the prose itself — just that each exercise
// wires one up and it actually expands.

const EXERCISE_ROUTES = [
  "/#/exercise/seventh-chords?chord=C:maj7",
  "/#/exercise/two-five-one?key=C",
  "/#/exercise/diminished-scale?scale=C:wholeHalf",
  "/#/exercise/modes?mode=C:ionian",
  "/#/exercise/jazz-standards?standard=misty",
];

for (const route of EXERCISE_ROUTES) {
  test(`${route} has a collapsed Tutorial accordion below Settings`, async ({ page }) => {
    await page.goto(route);

    const accordions = page.locator("details.settings > summary");
    await expect(accordions).toHaveText(["Settings", "Tutorial"]);

    const tutorial = page.locator("details.settings").filter({ has: page.getByText("Tutorial", { exact: true }) });
    await expect(tutorial).not.toHaveAttribute("open", "");

    await tutorial.locator("summary").click();
    await expect(tutorial).toHaveAttribute("open", "");
    await expect(tutorial.locator(".tutorial-section").first()).toBeVisible();
  });
}
