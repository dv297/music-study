/** ii–V–I progressions, built from the seventh-chord qualities. */

import { buildChord, QUALITY_BY_ID, ROOTS, type Chord, type ChordQuality } from "./chords";
import { noteToAscii, spellAbove, type SpelledNote } from "./notes";

export type Degree = "ii" | "V" | "I";

/** In order — the sequence the user plays. */
export const DEGREES: readonly Degree[] = ["ii", "V", "I"];

function requireQuality(id: string): ChordQuality {
  const quality = QUALITY_BY_ID.get(id);
  if (!quality) throw new Error(`missing chord quality ${id}`);
  return quality;
}

// A major-key ii–V–I: minor 7th, dominant 7th, major 7th.
const II_QUALITY = requireQuality("min7");
const V_QUALITY = requireQuality("dom7");
const I_QUALITY = requireQuality("maj7");

export interface TwoFiveOne {
  key: SpelledNote;
  /** ii, V, I — in playing order. */
  chords: readonly [Chord, Chord, Chord];
}

/** Builds the ii–V–I that resolves to `key` major: iim7 – V7 – Imaj7. */
export function buildTwoFiveOne(key: SpelledNote): TwoFiveOne {
  const ii = buildChord(spellAbove(key, 1, 2), II_QUALITY);
  const v = buildChord(spellAbove(key, 4, 7), V_QUALITY);
  const i = buildChord(key, I_QUALITY);
  return { key, chords: [ii, v, i] };
}

/**
 * Picks a random key from the fourteen practical roots, avoiding an
 * immediate repeat so the same key never comes up twice in a row.
 */
export function randomTwoFiveOne(
  previous?: TwoFiveOne | null,
  random: () => number = Math.random,
): TwoFiveOne {
  const previousKey = previous ? noteToAscii(previous.key) : null;
  const pool = previousKey ? ROOTS.filter((root) => noteToAscii(root) !== previousKey) : ROOTS;
  const key = pool[Math.floor(random() * pool.length) % pool.length];
  return buildTwoFiveOne(key);
}
