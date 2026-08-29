/** Grading a set of pressed piano keys against a chord or scale. */

import { noteToDisplay, pitchClassOfMidi, type SpelledNote } from "./notes";

/** What gradeAnswer() needs from a chord or scale — see Chord (chords.ts) and Scale (scales.ts). */
export interface GradeableTones {
  /** Properly spelled tones, root first. */
  tones: SpelledNote[];
  /** The tones' pitch classes, in no particular order. */
  pitchClasses: number[];
}

export interface GradeOptions {
  /** When true, the lowest pressed key must be the root. */
  requireRootInBass: boolean;
}

export interface Grade {
  correct: boolean;
  /** Pressed keys that belong to the chord or scale. */
  correctMidi: number[];
  /** Pressed keys that do not belong to the chord or scale. */
  extraMidi: number[];
  /** Pitch classes that were never pressed. */
  missingPitchClasses: number[];
  /** Set when the notes are right but the voicing breaks a rule. */
  voicingIssue: string | null;
}

export function gradeAnswer(item: GradeableTones, selectedMidi: number[], options: GradeOptions): Grade {
  const wanted = new Set(item.pitchClasses);
  const pressed = new Set(selectedMidi.map(pitchClassOfMidi));

  const correctMidi = selectedMidi.filter((midi) => wanted.has(pitchClassOfMidi(midi))).sort((a, b) => a - b);
  const extraMidi = selectedMidi.filter((midi) => !wanted.has(pitchClassOfMidi(midi))).sort((a, b) => a - b);
  const missingPitchClasses = item.pitchClasses.filter((pitchClass) => !pressed.has(pitchClass));

  const notesRight = extraMidi.length === 0 && missingPitchClasses.length === 0;

  let voicingIssue: string | null = null;
  if (notesRight && options.requireRootInBass && selectedMidi.length > 0) {
    const lowest = Math.min(...selectedMidi);
    if (pitchClassOfMidi(lowest) !== item.pitchClasses[0]) {
      voicingIssue = `Right notes, but the chord is inverted — put ${noteToDisplay(item.tones[0])} in the bass.`;
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
