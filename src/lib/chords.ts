/** Seventh-chord definitions and generation. */

import { noteToAscii, noteToDisplay, parseNote, pitchClassOf, spellAbove, type SpelledNote } from "./notes";

/** A chord tone as (letter steps above the root, semitones above the root). */
type Interval = readonly [letterSteps: number, semitones: number];

export interface ChordQuality {
  id: string;
  /** Short label used in the exercise settings, e.g. "Major 7th". */
  name: string;
  /** Suffix appended to the root, e.g. "maj7" in "Cmaj7". */
  suffix: string;
  /** Other suffixes a lead sheet might use for the same chord. */
  aliasSuffixes: string[];
  /** Root, third, fifth, seventh. */
  intervals: readonly [Interval, Interval, Interval, Interval];
  /** How the chord is built, shown after answering. */
  formula: string;
}

const ROOT: Interval = [0, 0];

export const CHORD_QUALITIES: ChordQuality[] = [
  {
    id: "maj7",
    name: "Major 7th",
    suffix: "maj7",
    aliasSuffixes: ["△7", "M7"],
    intervals: [ROOT, [2, 4], [4, 7], [6, 11]],
    formula: "1 3 5 7",
  },
  {
    id: "dom7",
    name: "Dominant 7th",
    suffix: "7",
    aliasSuffixes: [],
    intervals: [ROOT, [2, 4], [4, 7], [6, 10]],
    formula: "1 3 5 ♭7",
  },
  {
    id: "min7",
    name: "Minor 7th",
    suffix: "m7",
    aliasSuffixes: ["mi7", "-7"],
    intervals: [ROOT, [2, 3], [4, 7], [6, 10]],
    formula: "1 ♭3 5 ♭7",
  },
  {
    id: "min7b5",
    name: "Half-diminished",
    suffix: "m7♭5",
    aliasSuffixes: ["ø7", "-7♭5"],
    intervals: [ROOT, [2, 3], [4, 6], [6, 10]],
    formula: "1 ♭3 ♭5 ♭7",
  },
  {
    id: "dim7",
    name: "Diminished 7th",
    suffix: "°7",
    aliasSuffixes: ["dim7"],
    intervals: [ROOT, [2, 3], [4, 6], [6, 9]],
    formula: "1 ♭3 ♭5 ♭♭7",
  },
  {
    id: "minMaj7",
    name: "Minor-major 7th",
    suffix: "mMaj7",
    aliasSuffixes: ["m△7", "-△7"],
    intervals: [ROOT, [2, 3], [4, 7], [6, 11]],
    formula: "1 ♭3 5 7",
  },
  {
    id: "dom7sharp5",
    name: "Altered dominant (7♯5)",
    suffix: "7♯5",
    aliasSuffixes: ["+7", "7aug"],
    intervals: [ROOT, [2, 4], [4, 8], [6, 10]],
    formula: "1 3 ♯5 ♭7",
  },
  {
    id: "maj7sharp5",
    name: "Major 7th ♯5",
    suffix: "maj7♯5",
    aliasSuffixes: ["△7♯5", "+M7"],
    intervals: [ROOT, [2, 4], [4, 8], [6, 11]],
    formula: "1 3 ♯5 7",
  },
];

export const QUALITY_BY_ID = new Map(CHORD_QUALITIES.map((q) => [q.id, q]));

/** Roots that appear in real lead sheets — no B♯ or F♭. */
export const ROOTS: SpelledNote[] = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B"].map(
  parseNote,
);

export interface Chord {
  root: SpelledNote;
  quality: ChordQuality;
  /** Root, third, fifth, seventh — properly spelled. */
  tones: SpelledNote[];
  /** The four pitch classes of the chord, in no particular order. */
  pitchClasses: number[];
}

export function buildChord(root: SpelledNote, quality: ChordQuality): Chord {
  const tones = quality.intervals.map(([letterSteps, semitones]) => spellAbove(root, letterSteps, semitones));
  return { root, quality, tones, pitchClasses: tones.map(pitchClassOf) };
}

/** "C♯m7♭5" */
export function chordSymbol(chord: Chord): string {
  return noteToDisplay(chord.root) + chord.quality.suffix;
}

export function chordAliasSymbols(chord: Chord): string[] {
  return chord.quality.aliasSuffixes.map((suffix) => noteToDisplay(chord.root) + suffix);
}

export function chordToneNames(chord: Chord): string[] {
  return chord.tones.map(noteToDisplay);
}

export function chordId(chord: Chord): string {
  return `${noteToAscii(chord.root)}:${chord.quality.id}`;
}

/**
 * Pick a random chord from the enabled qualities, avoiding an immediate repeat
 * so the same symbol never comes up twice in a row.
 */
export function randomChord(qualityIds: string[], previous?: Chord | null, random: () => number = Math.random): Chord {
  const qualities = qualityIds.map((id) => QUALITY_BY_ID.get(id)).filter((q): q is ChordQuality => Boolean(q));
  if (qualities.length === 0) throw new Error("No chord qualities enabled");

  const candidates: Chord[] = [];
  for (const root of ROOTS) {
    for (const quality of qualities) candidates.push(buildChord(root, quality));
  }
  const previousId = previous ? chordId(previous) : null;
  const pool = candidates.length > 1 ? candidates.filter((c) => chordId(c) !== previousId) : candidates;
  return pool[Math.floor(random() * pool.length) % pool.length];
}
