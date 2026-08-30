/**
 * Extended and altered chord definitions and generation — a 7th chord with
 * one 9th, 11th, or 13th tension stacked on top.
 */

import { findRootByAscii, ROOTS } from "./chords";
import { noteToAscii, noteToDisplay, pitchClassOf, spellAbove, type SpelledNote } from "./notes";
import { pickFromBag } from "./random";

/** A chord tone as (letter steps above the root, semitones above the root). */
type Interval = readonly [letterSteps: number, semitones: number];

export interface AlteredChordQuality {
  id: string;
  /** Short label used in the exercise settings, e.g. "Dominant 9th". */
  name: string;
  /** Suffix appended to the root, e.g. "7♭9" in "C7♭9". */
  suffix: string;
  /** Other suffixes a lead sheet might use for the same chord. */
  aliasSuffixes: string[];
  /** Root, third, fifth, seventh, and the tension(s) that name the chord, ascending. */
  intervals: readonly Interval[];
  /** How the chord is built, shown after answering. */
  formula: string;
}

const ROOT: Interval = [0, 0];
const MAJOR_3RD: Interval = [2, 4];
const MINOR_3RD: Interval = [2, 3];
const FIFTH: Interval = [4, 7];
const MAJOR_7TH: Interval = [6, 11];
const MINOR_7TH: Interval = [6, 10];
// Tensions are written as a full octave (7 letter steps, 12 semitones) plus
// the plain scale-degree interval, since a 9th/11th/13th *is* a 2nd/4th/6th
// an octave up — spelling and grading only ever look at the result mod an
// octave, but writing it this way keeps the formula's degree numbers honest.
const FLAT_NINTH: Interval = [7 + 1, 12 + 1];
const NINTH: Interval = [7 + 1, 12 + 2];
const SHARP_NINTH: Interval = [7 + 1, 12 + 3];
const ELEVENTH: Interval = [7 + 3, 12 + 5];
const SHARP_ELEVENTH: Interval = [7 + 3, 12 + 6];
const THIRTEENTH: Interval = [7 + 5, 12 + 9];

// Only the tensions that are actually taught as their own chord: a plain
// (natural) 11th is the textbook "avoid note" a half step above the major
// 3rd, so it's offered here only over a minor triad — everywhere else the
// 11th appears sharped. A 13th chord conventionally includes the 9th too
// (and skips the 11th, avoid-note again) rather than only adding the 6th.
export const ALTERED_CHORD_QUALITIES: AlteredChordQuality[] = [
  {
    id: "dom9",
    name: "Dominant 9th",
    suffix: "9",
    aliasSuffixes: [],
    intervals: [ROOT, MAJOR_3RD, FIFTH, MINOR_7TH, NINTH],
    formula: "1 3 5 ♭7 9",
  },
  {
    id: "dom7b9",
    name: "Dominant 7♭9",
    suffix: "7♭9",
    aliasSuffixes: [],
    intervals: [ROOT, MAJOR_3RD, FIFTH, MINOR_7TH, FLAT_NINTH],
    formula: "1 3 5 ♭7 ♭9",
  },
  {
    id: "dom7sharp9",
    name: "Dominant 7♯9",
    suffix: "7♯9",
    aliasSuffixes: [],
    intervals: [ROOT, MAJOR_3RD, FIFTH, MINOR_7TH, SHARP_NINTH],
    formula: "1 3 5 ♭7 ♯9",
  },
  {
    id: "dom7sharp11",
    name: "Dominant 7♯11",
    suffix: "7♯11",
    aliasSuffixes: [],
    intervals: [ROOT, MAJOR_3RD, FIFTH, MINOR_7TH, SHARP_ELEVENTH],
    formula: "1 3 5 ♭7 ♯11",
  },
  {
    id: "dom13",
    name: "Dominant 13th",
    suffix: "13",
    aliasSuffixes: [],
    intervals: [ROOT, MAJOR_3RD, FIFTH, MINOR_7TH, NINTH, THIRTEENTH],
    formula: "1 3 5 ♭7 9 13",
  },
  {
    id: "maj9",
    name: "Major 9th",
    suffix: "△9",
    aliasSuffixes: ["maj9", "M9"],
    intervals: [ROOT, MAJOR_3RD, FIFTH, MAJOR_7TH, NINTH],
    formula: "1 3 5 7 9",
  },
  {
    id: "maj7sharp11",
    name: "Major 7♯11",
    suffix: "△7♯11",
    aliasSuffixes: ["maj7♯11"],
    intervals: [ROOT, MAJOR_3RD, FIFTH, MAJOR_7TH, SHARP_ELEVENTH],
    formula: "1 3 5 7 ♯11",
  },
  {
    id: "maj13",
    name: "Major 13th",
    suffix: "△13",
    aliasSuffixes: ["maj13"],
    intervals: [ROOT, MAJOR_3RD, FIFTH, MAJOR_7TH, NINTH, THIRTEENTH],
    formula: "1 3 5 7 9 13",
  },
  {
    id: "min9",
    name: "Minor 9th",
    suffix: "m9",
    aliasSuffixes: ["mi9", "-9"],
    intervals: [ROOT, MINOR_3RD, FIFTH, MINOR_7TH, NINTH],
    formula: "1 ♭3 5 ♭7 9",
  },
  {
    id: "min11",
    name: "Minor 11th",
    suffix: "m11",
    aliasSuffixes: ["mi11", "-11"],
    intervals: [ROOT, MINOR_3RD, FIFTH, MINOR_7TH, ELEVENTH],
    formula: "1 ♭3 5 ♭7 11",
  },
];

export const QUALITY_BY_ID = new Map(ALTERED_CHORD_QUALITIES.map((q) => [q.id, q]));

export interface AlteredChord {
  root: SpelledNote;
  quality: AlteredChordQuality;
  /** Root, third, fifth, seventh, and tension(s) — properly spelled. */
  tones: SpelledNote[];
  /** The chord's pitch classes, in no particular order. */
  pitchClasses: number[];
  /**
   * Each tone's real semitone distance above the root (root first,
   * ascending) — unlike pitchClasses, NOT reduced mod an octave, so a 9th
   * reads as 14 rather than the 2 a plain 2nd would use. Audio replay needs
   * this to voice a tension above the octave instead of collapsing it back
   * down next to the root (see intervalsToAscendingMidi in replay.ts).
   */
  semitonesAboveRoot: number[];
}

export function buildAlteredChord(root: SpelledNote, quality: AlteredChordQuality): AlteredChord {
  const tones = quality.intervals.map(([letterSteps, semitones]) => spellAbove(root, letterSteps, semitones));
  const semitonesAboveRoot = quality.intervals.map(([, semitones]) => semitones);
  return { root, quality, tones, pitchClasses: tones.map(pitchClassOf), semitonesAboveRoot };
}

/** "C7♯9" */
export function alteredChordSymbol(chord: AlteredChord): string {
  return noteToDisplay(chord.root) + chord.quality.suffix;
}

export function alteredChordAliasSymbols(chord: AlteredChord): string[] {
  return chord.quality.aliasSuffixes.map((suffix) => noteToDisplay(chord.root) + suffix);
}

export function alteredChordToneNames(chord: AlteredChord): string[] {
  return chord.tones.map(noteToDisplay);
}

export function alteredChordId(chord: AlteredChord): string {
  return `${noteToAscii(chord.root)}:${chord.quality.id}`;
}

/** Parses the format alteredChordId() produces, e.g. "F#:dom7b9". Undefined if the root or quality isn't recognized. */
export function parseAlteredChordId(id: string): AlteredChord | undefined {
  const [rootAscii, qualityId] = id.split(":");
  if (!rootAscii || !qualityId) return undefined;
  const root = findRootByAscii(rootAscii);
  const quality = QUALITY_BY_ID.get(qualityId);
  if (!root || !quality) return undefined;
  return buildAlteredChord(root, quality);
}

/**
 * Pick a random altered chord from the enabled qualities. Avoids repeating
 * any chord already used this cycle — see `pickFromBag` — so the same
 * symbol doesn't come up again until the rest of the pool has been drawn.
 */
export function randomAlteredChord(
  qualityIds: string[],
  used: ReadonlySet<string> = new Set(),
  random: () => number = Math.random,
): { chord: AlteredChord; used: Set<string> } {
  const qualities = qualityIds.map((id) => QUALITY_BY_ID.get(id)).filter((q): q is AlteredChordQuality => Boolean(q));
  if (qualities.length === 0) throw new Error("No chord qualities enabled");

  const candidates: AlteredChord[] = [];
  for (const root of ROOTS) {
    for (const quality of qualities) candidates.push(buildAlteredChord(root, quality));
  }
  const { value, used: nextUsed } = pickFromBag(candidates, alteredChordId, used, random);
  return { chord: value, used: nextUsed };
}
