/** Grading a set of pressed piano keys against a chord. */

import { chordToneNames, type Chord } from "./chords";
import { pitchClassOfMidi } from "./notes";

export interface GradeOptions {
  /** When true, the lowest pressed key must be the root of the chord. */
  requireRootInBass: boolean;
}

export interface Grade {
  correct: boolean;
  /** Pressed keys that belong to the chord. */
  correctMidi: number[];
  /** Pressed keys that do not belong to the chord. */
  extraMidi: number[];
  /** Chord pitch classes that were never pressed. */
  missingPitchClasses: number[];
  /** Set when the notes are right but the voicing breaks a rule. */
  voicingIssue: string | null;
}

export function gradeAnswer(chord: Chord, selectedMidi: number[], options: GradeOptions): Grade {
  const wanted = new Set(chord.pitchClasses);
  const pressed = new Set(selectedMidi.map(pitchClassOfMidi));

  const correctMidi = selectedMidi.filter((midi) => wanted.has(pitchClassOfMidi(midi))).sort((a, b) => a - b);
  const extraMidi = selectedMidi.filter((midi) => !wanted.has(pitchClassOfMidi(midi))).sort((a, b) => a - b);
  const missingPitchClasses = chord.pitchClasses.filter((pitchClass) => !pressed.has(pitchClass));

  const notesRight = extraMidi.length === 0 && missingPitchClasses.length === 0;

  let voicingIssue: string | null = null;
  if (notesRight && options.requireRootInBass && selectedMidi.length > 0) {
    const lowest = Math.min(...selectedMidi);
    if (pitchClassOfMidi(lowest) !== chord.pitchClasses[0]) {
      voicingIssue = `Right notes, but the chord is inverted — put ${chordToneNames(chord)[0]} in the bass.`;
    }
  }

  return {
    correct: notesRight && voicingIssue === null,
    correctMidi,
    extraMidi,
    missingPitchClasses,
    voicingIssue,
  };
}
