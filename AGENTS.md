# music-study

## Premise

A React app for studying music theory. It is a collection of **exercises** — each
one drills a different topic. The shape of an exercise is always the same:

1. Present a prompt (a chord symbol, an interval, a key signature).
2. The user answers on an interactive instrument, not a text box or a multiple
   choice list. Playing the answer is the point; recognizing it isn't enough.
3. The user submits, and the app checks correctness and shows what was wrong.

New work on this repo is usually either a new exercise or a deeper version of an
existing one. Assume that unless told otherwise.

The audience is one person practicing — no accounts, no backend. Keep it a
static site; client-side persistence (localStorage) is fine, syncing across
devices is not.

## Stack

Vite + React + TypeScript. No router, no UI library, no CSS framework. Plain CSS
in `src/styles.css` with custom properties for the palette. Prefer keeping it
that way; reach for a dependency only when hand-rolling would be genuinely worse.

```bash
npm run dev        # http://localhost:5173
npm test           # vitest
npm run test:e2e   # playwright, against a dev server it starts itself
npm run typecheck  # tsc -b
npm run build
```

## Layout

```
src/lib/          music theory core — no React in here
src/components/   shared instrument UI (Piano.tsx)
src/hooks/        small hooks wrapping a browser API (localStorage, location.hash)
src/exercises/    registry.ts + one directory per exercise
e2e/              Playwright specs, run against a real browser
```

To add an exercise: write a component in `src/exercises/<id>/`, then add an entry
to `EXERCISES` in `src/exercises/registry.ts`. The home screen and hash routing
pick it up automatically. An entry with no `component` renders as a "soon" stub —
that's how the unbuilt exercises are listed. A `component` receives
`ExerciseComponentProps` (`src/exercises/types.ts`) — currently just the parsed
query string off the hash route, for jumping straight to a specific prompt (see
"Deep-linking a prompt" below).

Exercise state (score, settings, current prompt) lives in the exercise component.
There is no global store. Settings persist to localStorage via
`src/hooks/useStoredState.ts` (a drop-in `useState`) so they survive a reload;
score and the current prompt don't — except when pinned by a query param, they're
sourced from the URL instead of `Math.random()` for exactly the initial prompt.

## Music theory conventions

These two rules are the reason the theory code is structured the way it is. Keep
them when adding exercises.

**Spelling is independent of pitch.** A note is a letter plus an accidental
(`src/lib/notes.ts`), never a bare pitch class. That is what makes C°7 spell
`C E♭ G♭ B♭♭` instead of `C D♯ F♯ A`, and keeps F♯maj7 on sharps. Anything shown
to the user goes through this — displaying a wrong enharmonic is a real bug, not
cosmetic.

**Grading compares pitch classes.** `src/lib/grade.ts` ignores spelling, octave,
inversion, and doubling, because the user is pressing piano keys and a key has no
spelling. An exercise may add stricter rules on top (the 7th chord exercise has
an optional "root in the bass"), but the default is permissive.

Roots are drawn from fourteen practical spellings — no B♯, no F♭.

## Deep-linking a prompt

Every exercise route can pin its opening prompt with a query param appended
after the route, inside the hash (`useHashRoute` in `src/hooks/useHashRoute.ts`
parses it off `location.hash`, not `location.search` — that keeps the params
scoped to one navigation instead of sticking around after an in-app link click):

```
#/exercise/seventh-chords?chord=Bb:min7b5   (root + quality id — see chordId() in src/lib/chords.ts)
#/exercise/two-five-one?key=F#              (root ascii — see findRootByAscii() in src/lib/chords.ts)
```

This only pins the *first* prompt the exercise shows — "Next chord" and its
equivalents go back to drawing randomly, same as ever. An unrecognized root or
quality is ignored rather than erroring, and the exercise falls back to a
random draw as if no param had been given. The point is a deterministic
starting point for Playwright, not a way to force the whole session.

Follow the same shape for a new exercise's own free variable: parse it out of
`params` into a `forced<Thing>` with a lookup that returns `undefined` on
anything unrecognized, use it as the `useState` initializer, and skip past any
one-time "current prompt isn't reachable under current settings" effect for
exactly the mount that consumed it (see the `skipReconcileRef` pattern in
`SeventhChordExercise.tsx`) so it isn't immediately overwritten.

## Testing

`src/lib/` is pure and must stay covered by tests in `src/lib/__tests__/` —
spelling and grading especially, since those are where quiet wrongness hides.

UI work should be verified by actually driving the app in a browser, not just by
typechecking. Watch for CSS transitions when screenshotting: the keys animate
over 90ms, so an immediate capture shows mid-transition colors and will mislead
you into "fixing" a bug that isn't there.

`e2e/` holds Playwright specs that drive a real browser end to end — one file per
exercise. Lean on the query params above so a spec presses known keys and
asserts known text instead of parsing whatever prompt a random draw produced.
`npm run test:e2e` starts its own dev server (`playwright.config.ts`) and reuses
one you already have running on :5173, unless `CI` is set. `@playwright/test` is
pinned to an exact version rather than a `^` range because it has to match
whatever Chromium build is actually installed in the environment running it.

## Deploying

Pushes to `main` build and publish to GitHub Pages
(`.github/workflows/deploy.yml`). The site is served from the `/music-study/`
subpath, which is why `vite.config.ts` sets `base` for production builds — keep
routing hash-based so no server-side fallback is needed.
