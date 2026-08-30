/** The seven diatonic modes, built the same way as a major scale rotated to start on each degree. */

import { findRootByAscii, ROOTS } from "./chords";
import { MIDDLE_C, noteToAscii, noteToDisplay, pitchClassOf, spellAbove, type SpelledNote } from "./notes";
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

function requireModeQuality(id: string): ModeQuality {
  const quality = QUALITY_BY_ID.get(id);
  if (!quality) throw new Error(`missing mode quality ${id}`);
  return quality;
}

const IONIAN = requireModeQuality("ionian");

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

/** Looks up a mode quality by id, e.g. "dorian" — see MODE_QUALITIES. */
export function findModeQuality(id: string): ModeQuality | undefined {
  return QUALITY_BY_ID.get(id);
}

export type DegreeAlteration = "flat" | "natural" | "sharp";

/**
 * How each of the seven scale degrees is altered relative to the major
 * scale (Ionian) — e.g. Dorian's 3rd and 7th come back "flat" and the rest
 * "natural". Root-independent: the same formula applies no matter what the
 * mode is built on.
 */
export function modeDegreeAlterations(quality: ModeQuality): DegreeAlteration[] {
  return quality.intervals.map(([, semitones], index) => {
    const diff = semitones - IONIAN.intervals[index][1];
    if (diff === 0) return "natural";
    if (diff === -1) return "flat";
    if (diff === 1) return "sharp";
    throw new Error(`unexpected ${diff}-semitone alteration on degree ${index + 1} of ${quality.name}`);
  });
}

/**
 * MIDI numbers for this quality's seven degrees, built on a reference root —
 * used to draw the quality on a keyboard for visual feedback. Degree
 * alterations don't depend on an actual root (see modeDegreeAlterations
 * above), so the reference root is arbitrary and defaults to middle C purely
 * for display.
 */
export function modeDegreeMidiNotes(quality: ModeQuality, referenceRootMidi: number = MIDDLE_C): number[] {
  return quality.intervals.map(([, semitones]) => referenceRootMidi + semitones);
}

export interface DegreeGrade {
  correct: boolean;
  /** 1-based degrees the answer got right. */
  correctDegrees: number[];
  /** 1-based degrees the answer got wrong, with what they should have been. */
  wrongDegrees: { degree: number; expected: DegreeAlteration }[];
}

/** Grades a per-degree sharp/flat/natural answer (index 0 = degree 1) against a mode's real formula. */
export function gradeModeDegrees(quality: ModeQuality, answer: readonly DegreeAlteration[]): DegreeGrade {
  const expected = modeDegreeAlterations(quality);
  const correctDegrees: number[] = [];
  const wrongDegrees: DegreeGrade["wrongDegrees"] = [];
  expected.forEach((alteration, index) => {
    const degree = index + 1;
    if (answer[index] === alteration) correctDegrees.push(degree);
    else wrongDegrees.push({ degree, expected: alteration });
  });
  return { correct: wrongDegrees.length === 0, correctDegrees, wrongDegrees };
}

/**
 * Pick a random mode quality from the enabled ones — no root involved, since
 * degree alterations don't depend on one. Avoids repeating a quality already
 * used this cycle — see `pickFromBag` — until the rest of the pool has come
 * up.
 */
export function randomModeQuality(
  qualityIds: string[],
  used: ReadonlySet<string> = new Set(),
  random: () => number = Math.random,
): { quality: ModeQuality; used: Set<string> } {
  const qualities = qualityIds.map((id) => QUALITY_BY_ID.get(id)).filter((q): q is ModeQuality => Boolean(q));
  if (qualities.length === 0) throw new Error("No mode qualities enabled");

  const { value, used: nextUsed } = pickFromBag(qualities, (quality) => quality.id, used, random);
  return { quality: value, used: nextUsed };
}
