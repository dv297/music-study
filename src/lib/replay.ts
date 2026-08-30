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

/**
 * Like tonesToAscendingMidi, but for a chord whose tones can sit more than
 * an octave above the root — a 9th, 11th, or 13th tension (see AlteredChord
 * in alteredChords.ts). `semitonesAboveRoot` gives each tone's real distance
 * above the root (14 for a 9th, not the mod-12-reduced 2 a plain 2nd would
 * use), so a tension is voiced audibly above the rest of the chord instead
 * of collapsing back down next to the root.
 */
export function intervalsToAscendingMidi(
  root: SpelledNote,
  semitonesAboveRoot: readonly number[],
  lowMidi: number,
): number[] {
  const rootMidi = lowMidi + pitchClassOf(root);
  return semitonesAboveRoot.map((semitones) => rootMidi + semitones);
}

/**
 * Replay groups for a chord built from real (not mod-reduced) intervals —
 * see intervalsToAscendingMidi() — struck the same way as chordReplayGroups:
 * each tone alone, ascending, then every tone together as a block chord.
 */
export function chordReplayGroupsFromIntervals(
  root: SpelledNote,
  semitonesAboveRoot: readonly number[],
  lowMidi: number,
): number[][] {
  const midi = intervalsToAscendingMidi(root, semitonesAboveRoot, lowMidi);
  return [...midi.map((note) => [note]), midi];
}
