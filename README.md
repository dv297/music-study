# music-study

A React app for drilling music theory at the keyboard.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # music theory + grading tests
npm run typecheck
npm run build
```

## Exercises

### 7th Chords

A jazz chord symbol appears at the top; build it on the on-screen keyboard and
submit. Grading compares pitch classes, so any octave or inversion counts unless
you turn on **Require the root in the bass**. After submitting, the keyboard
marks what you played: green for chord tones, red for notes that don't belong,
and a gold hatch on every octave of a note you missed.

Eight qualities are available (major 7th, dominant 7th, minor 7th,
half-diminished, diminished 7th, minor-major 7th, 7♯5, and major 7♯5) across all
fourteen practical roots. The default pool is the four most common; the rest are
in Settings.

**Keyboard shortcuts** — `enter` checks, then advances to the next chord.
`esc` clears. The keys play notes the way a DAW's typing keyboard does:
`z s x d c v g b h n j m` for the lower octave, `q 2 w 3 e r 5 t 6 y 7 u` for the
upper.

### ii–V–I

The tonic seventh chord appears at the top (e.g. Fmaj7 for the key of F); build
the ii, V, and I chords in order — iim7, then V7, then back to Imaj7 — submitting
each on the keyboard before moving to the next. The step tracker shows where you
are in the progression and marks each chord correct or incorrect as you go; the
final chord's feedback also shows how many of the three you got right.

Random keys are drawn from the same fourteen practical roots as 7th Chords, and
grading follows the same rules (any octave or inversion counts, unless you turn
on **Require the root in the bass**).

Uses the same keyboard shortcuts as 7th Chords.

The other exercises listed on the home screen are placeholders.

## Layout

```
src/lib/          notes.ts (spelling, MIDI), chords.ts (qualities), grade.ts,
                  progressions.ts (ii-V-I)
src/components/   Piano.tsx
src/exercises/    registry.ts + one directory per exercise
```

To add an exercise, drop a component in `src/exercises/<id>/` and register it in
`src/exercises/registry.ts`; the home screen and hash routing pick it up.

### Note spelling

Chord tones carry a letter and an accidental independently of their pitch class,
so a C°7 spells `C E♭ G♭ B♭♭` rather than `C D♯ F♯ A`, and F♯maj7 stays on sharps.
Grading ignores spelling — it only compares pitch classes.
