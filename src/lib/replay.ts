/** Turns a chord, scale, or mode's tones into MIDI note groups for audio replay on success. */

import { pitchClassOf, type SpelledNote } from "./notes";

/**
 * MIDI numbers for `tones` (root first, ascending — see Chord/Scale/Mode),
 * with the root placed at its pitch class in the octave starting at
 * `lowMidi`. Every interval table in this app tops out 11 semitones above
 * the root, so the whole sequence lands within a major 7th above that root
 * and never wraps into a second octave.
 */
export function tonesToAscendingMidi(tones: readonly SpelledNote[], lowMidi: number): number[] {
  const rootPitchClass = pitchClassOf(tones[0]);
  const rootMidi = lowMidi + rootPitchClass;
  return tones.map((tone) => rootMidi + ((pitchClassOf(tone) - rootPitchClass + 12) % 12));
}

/** Replay groups for a scale or mode: each tone struck one at a time, ascending. */
export function scaleReplayGroups(tones: readonly SpelledNote[], lowMidi: number): number[][] {
  return tonesToAscendingMidi(tones, lowMidi).map((midi) => [midi]);
}

/**
 * Replay groups for a chord: each tone struck one at a time, ascending, then
 * every tone again together as a block chord.
 */
export function chordReplayGroups(tones: readonly SpelledNote[], lowMidi: number): number[][] {
  const midi = tonesToAscendingMidi(tones, lowMidi);
  return [...midi.map((note) => [note]), midi];
}
