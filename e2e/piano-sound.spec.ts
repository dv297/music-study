import { expect, test } from "@playwright/test";

// AudioContext isn't observable through the DOM, so each test stubs it with a
// fake that just counts oscillators started — enough to tell whether a key
// press tried to play a tone, without asserting on actual audio output.
async function stubAudioContext(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    class FakeParam {
      setValueAtTime() {
        return this;
      }
      linearRampToValueAtTime() {
        return this;
      }
      exponentialRampToValueAtTime() {
        return this;
      }
    }
    class FakeNode {
      connect() {
        return this;
      }
    }
    class FakeOscillator extends FakeNode {
      frequency = new FakeParam();
      start(startTime?: number) {
        // @ts-expect-error test-only global
        window.__oscillatorStarts = (window.__oscillatorStarts ?? 0) + 1;
        // @ts-expect-error test-only global
        (window.__oscillatorStartTimes ??= []).push(startTime ?? 0);
      }
      stop() {}
    }
    class FakeGain extends FakeNode {
      gain = new FakeParam();
    }
    class FakeAudioContext {
      state = "running";
      currentTime = 0;
      destination = new FakeNode();
      createOscillator() {
        return new FakeOscillator();
      }
      createGain() {
        return new FakeGain();
      }
      resume() {
        return Promise.resolve();
      }
    }
    // @ts-expect-error test-only stub
    window.AudioContext = FakeAudioContext;
    // @ts-expect-error test-only global
    window.__oscillatorStarts = 0;
  });
}

const oscillatorStarts = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as unknown as { __oscillatorStarts: number }).__oscillatorStarts);

const oscillatorStartTimes = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as unknown as { __oscillatorStartTimes: number[] }).__oscillatorStartTimes);

test("pressing a key plays a tone by default", async ({ page }) => {
  await stubAudioContext(page);
  await page.goto("/#/exercise/seventh-chords?chord=C:maj7");

  expect(await oscillatorStarts(page)).toBe(0);

  await page.getByRole("button", { name: "C4", exact: true }).click();

  expect(await oscillatorStarts(page)).toBe(1);
});

test("releasing a key does not play a second tone", async ({ page }) => {
  await stubAudioContext(page);
  await page.goto("/#/exercise/seventh-chords?chord=C:maj7");

  const key = page.getByRole("button", { name: "C4", exact: true });
  await key.click(); // on
  await key.click(); // off

  expect(await oscillatorStarts(page)).toBe(1);
});

test("unchecking the setting stops new key presses from playing a tone", async ({ page }) => {
  await stubAudioContext(page);
  await page.goto("/#/exercise/seventh-chords?chord=C:maj7");

  await page.click("summary");
  await page.getByText("Play a sound when a note is pressed").click();

  await page.getByRole("button", { name: "C4", exact: true }).click();

  expect(await oscillatorStarts(page)).toBe(0);
});

test("the computer-keyboard shortcut also plays a tone", async ({ page }) => {
  await stubAudioContext(page);
  await page.goto("/#/exercise/seventh-chords?chord=C:maj7");
  await page.locator(".app-header").click();

  await page.keyboard.press("z"); // lowest key on the piano

  expect(await oscillatorStarts(page)).toBe(1);
});

test("a correct chord answer replays it, note by note then as a block", async ({ page }) => {
  await stubAudioContext(page);
  await page.goto("/#/exercise/seventh-chords?chord=C:maj7");

  for (const note of ["C4", "E4", "G4", "B4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  expect(await oscillatorStarts(page)).toBe(4);

  await page.getByRole("button", { name: "Check" }).click();

  // The 4 key presses above, then the replay: the same 4 notes one at a
  // time, then all 4 again together as a block chord — 8 more tones.
  expect(await oscillatorStarts(page)).toBe(4 + 8);
});

test("an incorrect answer does not replay anything", async ({ page }) => {
  await stubAudioContext(page);
  await page.goto("/#/exercise/seventh-chords?chord=C:maj7");

  for (const note of ["C4", "E4", "G4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  expect(await oscillatorStarts(page)).toBe(3);

  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".verdict")).toContainText("Not quite");

  expect(await oscillatorStarts(page)).toBe(3);
});

test("unchecking the replay setting stops a correct answer from replaying", async ({ page }) => {
  await stubAudioContext(page);
  await page.goto("/#/exercise/seventh-chords?chord=C:maj7");

  await page.click("summary");
  await page.getByText("Play the chord back, note by note then as a block, after a correct answer").click();

  for (const note of ["C4", "E4", "G4", "B4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  expect(await oscillatorStarts(page)).toBe(4);

  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".verdict")).toContainText("Correct.");

  expect(await oscillatorStarts(page)).toBe(4);
});

test("auto-submit delays the replay by 200ms so it doesn't collide with the triggering note", async ({ page }) => {
  await stubAudioContext(page);
  await page.goto("/#/exercise/seventh-chords?chord=C:maj7");

  await page.click("summary");
  await page.getByText("Check automatically once enough notes are selected").click();

  // The 4th note completes the chord and triggers auto-submit itself, with
  // no separate "Check" click.
  for (const note of ["C4", "E4", "G4", "B4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await expect(page.locator(".verdict")).toContainText("Correct.");

  // 12 tones total: the 4 key presses (undelayed), then the 8-tone replay.
  expect(await oscillatorStarts(page)).toBe(4 + 8);

  const startTimes = await oscillatorStartTimes(page);
  expect(startTimes.slice(0, 4)).toEqual([0, 0, 0, 0]);
  expect(startTimes[4]).toBeCloseTo(0.2, 5);
});

test("a manual check has no extra delay before the replay", async ({ page }) => {
  await stubAudioContext(page);
  await page.goto("/#/exercise/seventh-chords?chord=C:maj7");

  for (const note of ["C4", "E4", "G4", "B4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.locator(".verdict")).toContainText("Correct.");

  const startTimes = await oscillatorStartTimes(page);
  expect(startTimes[4]).toBe(0);
});

test("a correct scale answer replays each note once, with no trailing block chord", async ({ page }) => {
  await stubAudioContext(page);
  await page.goto("/#/exercise/diminished-scale?scale=C:wholeHalf");

  for (const note of ["C4", "D4", "D#4", "F4", "F#4", "G#4", "A4", "B4"]) {
    await page.getByRole("button", { name: note, exact: true }).click();
  }
  expect(await oscillatorStarts(page)).toBe(8);

  await page.getByRole("button", { name: "Check" }).click();

  // The 8 key presses above, then the 8 scale notes replayed once each.
  expect(await oscillatorStarts(page)).toBe(8 + 8);
});
