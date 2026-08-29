/** Diminished (octatonic) scale definitions and generation. */

import { findRootByAscii, ROOTS } from "./chords";
import { noteToAscii, noteToDisplay, pitchClassOf, spellAbove, type SpelledNote } from "./notes";
import { pickFromBag } from "./random";

/** A scale tone as (letter steps above the root, semitones above the root). */
type Interval = readonly [letterSteps: number, semitones: number];

export interface ScaleQuality {
  id: string;
  /** Short label used in the exercise settings, e.g. "Whole-Half". */
  name: string;
  /** Suffix appended to the root, e.g. "dim (W–H)" in "C dim (W–H)". */
  suffix: string;
  /** Root through the 7th degree, ascending — the octave repeats the root. */
  intervals: readonly [Interval, Interval, Interval, Interval, Interval, Interval, Interval, Interval];
  /** How the scale is built, shown after answering. */
  formula: string;
}

const ROOT: Interval = [0, 0];

// The octatonic scale alternates whole and half steps and so has two forms
// depending on which comes first. Each spells with one letter doubled (once
// natural, once altered) because 8 pitches don't fit 7 letter names — see
// AGENTS.md's spelling rule; these are the widely taught jazz spellings.
export const SCALE_QUALITIES: ScaleQuality[] = [
  {
    id: "wholeHalf",
    name: "Whole-Half",
    suffix: "dim (W–H)",
    intervals: [ROOT, [1, 2], [2, 3], [3, 5], [4, 6], [5, 8], [5, 9], [6, 11]],
    formula: "1 2 ♭3 4 ♭5 ♭6 6 7",
  },
  {
    id: "halfWhole",
    name: "Half-Whole",
    suffix: "dim (H–W)",
    intervals: [ROOT, [1, 1], [1, 3], [2, 4], [3, 6], [4, 7], [5, 9], [6, 10]],
    formula: "1 ♭2 ♯2 3 ♯4 5 6 ♭7",
  },
];

const QUALITY_BY_ID = new Map(SCALE_QUALITIES.map((q) => [q.id, q]));

export interface Scale {
  root: SpelledNote;
  quality: ScaleQuality;
  /** Root through the 7th degree, properly spelled, ascending. */
  tones: SpelledNote[];
  /** The eight pitch classes of the scale, in no particular order. */
  pitchClasses: number[];
}

export function buildScale(root: SpelledNote, quality: ScaleQuality): Scale {
  const tones = quality.intervals.map(([letterSteps, semitones]) => spellAbove(root, letterSteps, semitones));
  return { root, quality, tones, pitchClasses: tones.map(pitchClassOf) };
}

/** "C♯ dim (W–H)" */
export function scaleSymbol(scale: Scale): string {
  return `${noteToDisplay(scale.root)} ${scale.quality.suffix}`;
}

export function scaleToneNames(scale: Scale): string[] {
  return scale.tones.map(noteToDisplay);
}

export function scaleId(scale: Scale): string {
  return `${noteToAscii(scale.root)}:${scale.quality.id}`;
}

/** Parses the format scaleId() produces, e.g. "F#:halfWhole". Undefined if the root or quality isn't recognized. */
export function parseScaleId(id: string): Scale | undefined {
  const [rootAscii, qualityId] = id.split(":");
  if (!rootAscii || !qualityId) return undefined;
  const root = findRootByAscii(rootAscii);
  const quality = QUALITY_BY_ID.get(qualityId);
  if (!root || !quality) return undefined;
  return buildScale(root, quality);
}

/**
 * Pick a random scale from the enabled qualities. Avoids repeating any
 * scale already used this cycle — see `pickFromBag` — so the same root and
 * quality don't come up again until the rest of the pool has been drawn.
 */
export function randomScale(
  qualityIds: string[],
  used: ReadonlySet<string> = new Set(),
  random: () => number = Math.random,
): { scale: Scale; used: Set<string> } {
  const qualities = qualityIds.map((id) => QUALITY_BY_ID.get(id)).filter((q): q is ScaleQuality => Boolean(q));
  if (qualities.length === 0) throw new Error("No scale qualities enabled");

  const candidates: Scale[] = [];
  for (const root of ROOTS) {
    for (const quality of qualities) candidates.push(buildScale(root, quality));
  }
  const { value, used: nextUsed } = pickFromBag(candidates, scaleId, used, random);
  return { scale: value, used: nextUsed };
}
