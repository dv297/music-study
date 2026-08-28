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

The audience is one person practicing — no accounts, no backend, no persistence
across reloads. Keep it a static site.

## Stack

Vite + React + TypeScript. No router, no UI library, no CSS framework. Plain CSS
in `src/styles.css` with custom properties for the palette. Prefer keeping it
that way; reach for a dependency only when hand-rolling would be genuinely worse.

```bash
npm run dev        # http://localhost:5173
npm test           # vitest
npm run typecheck  # tsc -b
npm run build
```

## Layout

```
src/lib/          music theory core — no React in here
src/components/   shared instrument UI (Piano.tsx)
src/exercises/    registry.ts + one directory per exercise
```

To add an exercise: write a component in `src/exercises/<id>/`, then add an entry
to `EXERCISES` in `src/exercises/registry.ts`. The home screen and hash routing
pick it up automatically. An entry with no `component` renders as a "soon" stub —
that's how the unbuilt exercises are listed.

Exercise state (score, settings, current prompt) lives in the exercise component.
There is no global store, and nothing is persisted.

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

## Testing

`src/lib/` is pure and must stay covered by tests in `src/lib/__tests__/` —
spelling and grading especially, since those are where quiet wrongness hides.

UI work should be verified by actually driving the app in a browser, not just by
typechecking. Watch for CSS transitions when screenshotting: the keys animate
over 90ms, so an immediate capture shows mid-transition colors and will mislead
you into "fixing" a bug that isn't there.

## Deploying

Pushes to `main` build and publish to GitHub Pages
(`.github/workflows/deploy.yml`). The site is served from the `/music-study/`
subpath, which is why `vite.config.ts` sets `base` for production builds — keep
routing hash-based so no server-side fallback is needed.
