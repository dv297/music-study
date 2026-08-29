/** The seven diatonic modes, built the same way as a major scale rotated to start on each degree. */

import { findRootByAscii, ROOTS } from "./chords";
import { noteToAscii, noteToDisplay, pitchClassOf, spellAbove, type SpelledNote } from "./notes";
import { pickFromBag } from "./random";

/** A scale tone as (letter steps above the root, semitones above the root). */
type Interval = readonly [letterSteps: number, semitones: number];

export interface ModeQuality {
  id: string;
  /** Short label used in the exercise settings, e.g. "Dorian". */
  name: string;
  /** Suffix appended to the root, e.g. "Dorian" in "D Dorian". */
  suffix: string;
  /** Root through the 7th degree, ascending — the octave repeats the root. */
  intervals: readonly [Interval, Interval, Interval, Interval, Interval, Interval, Interval];
  /** Scale-degree formula relative to the major scale, shown after answering. */
  formula: string;
}

const ROOT: Interval = [0, 0];

// Each mode is a rotation of the major scale, so — unlike the octatonic
// diminished scale — all seven degrees get a distinct natural letter name,
// same as buildChord()/buildScale() spell their tones.
export const MODE_QUALITIES: ModeQuality[] = [
  {
    id: "ionian",
    name: "Ionian (Major)",
    suffix: "Ionian",
    intervals: [ROOT, [1, 2], [2, 4], [3, 5], [4, 7], [5, 9], [6, 11]],
    formula: "1 2 3 4 5 6 7",
  },
  {
    id: "dorian",
    name: "Dorian",
    suffix: "Dorian",
    intervals: [ROOT, [1, 2], [2, 3], [3, 5], [4, 7], [5, 9], [6, 10]],
    formula: "1 2 ♭3 4 5 6 ♭7",
  },
  {
    id: "phrygian",
    name: "Phrygian",
    suffix: "Phrygian",
    intervals: [ROOT, [1, 1], [2, 3], [3, 5], [4, 7], [5, 8], [6, 10]],
    formula: "1 ♭2 ♭3 4 5 ♭6 ♭7",
  },
  {
    id: "lydian",
    name: "Lydian",
    suffix: "Lydian",
    intervals: [ROOT, [1, 2], [2, 4], [3, 6], [4, 7], [5, 9], [6, 11]],
    formula: "1 2 3 ♯4 5 6 7",
  },
  {
    id: "mixolydian",
    name: "Mixolydian",
    suffix: "Mixolydian",
    intervals: [ROOT, [1, 2], [2, 4], [3, 5], [4, 7], [5, 9], [6, 10]],
    formula: "1 2 3 4 5 6 ♭7",
  },
  {
    id: "aeolian",
    name: "Aeolian (Natural Minor)",
    suffix: "Aeolian",
    intervals: [ROOT, [1, 2], [2, 3], [3, 5], [4, 7], [5, 8], [6, 10]],
    formula: "1 2 ♭3 4 5 ♭6 ♭7",
  },
  {
    id: "locrian",
    name: "Locrian",
    suffix: "Locrian",
    intervals: [ROOT, [1, 1], [2, 3], [3, 5], [4, 6], [5, 8], [6, 10]],
    formula: "1 ♭2 ♭3 4 ♭5 ♭6 ♭7",
  },
];

const QUALITY_BY_ID = new Map(MODE_QUALITIES.map((q) => [q.id, q]));

export interface Mode {
  root: SpelledNote;
  quality: ModeQuality;
  /** Root through the 7th degree, properly spelled, ascending. */
  tones: SpelledNote[];
  /** The seven pitch classes of the mode, in no particular order. */
  pitchClasses: number[];
}

export function buildMode(root: SpelledNote, quality: ModeQuality): Mode {
  const tones = quality.intervals.map(([letterSteps, semitones]) => spellAbove(root, letterSteps, semitones));
  return { root, quality, tones, pitchClasses: tones.map(pitchClassOf) };
}

/** "D Dorian" */
export function modeSymbol(mode: Mode): string {
  return `${noteToDisplay(mode.root)} ${mode.quality.suffix}`;
}

export function modeToneNames(mode: Mode): string[] {
  return mode.tones.map(noteToDisplay);
}

export function modeId(mode: Mode): string {
  return `${noteToAscii(mode.root)}:${mode.quality.id}`;
}

/** Parses the format modeId() produces, e.g. "F#:dorian". Undefined if the root or quality isn't recognized. */
export function parseModeId(id: string): Mode | undefined {
  const [rootAscii, qualityId] = id.split(":");
  if (!rootAscii || !qualityId) return undefined;
  const root = findRootByAscii(rootAscii);
  const quality = QUALITY_BY_ID.get(qualityId);
  if (!root || !quality) return undefined;
  return buildMode(root, quality);
}

/**
 * Pick a random mode from the enabled qualities. Avoids repeating any mode
 * already used this cycle — see `pickFromBag` — so the same root and
 * quality don't come up again until the rest of the pool has been drawn.
 */
export function randomMode(
  qualityIds: string[],
  used: ReadonlySet<string> = new Set(),
  random: () => number = Math.random,
): { mode: Mode; used: Set<string> } {
  const qualities = qualityIds.map((id) => QUALITY_BY_ID.get(id)).filter((q): q is ModeQuality => Boolean(q));
  if (qualities.length === 0) throw new Error("No mode qualities enabled");

  const candidates: Mode[] = [];
  for (const root of ROOTS) {
    for (const quality of qualities) candidates.push(buildMode(root, quality));
  }
  const { value, used: nextUsed } = pickFromBag(candidates, modeId, used, random);
  return { mode: value, used: nextUsed };
}
