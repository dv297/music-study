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
      start() {
        // @ts-expect-error test-only global
        window.__oscillatorStarts = (window.__oscillatorStarts ?? 0) + 1;
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
